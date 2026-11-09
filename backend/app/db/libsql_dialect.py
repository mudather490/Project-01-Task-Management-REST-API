"""SQLAlchemy dialect for Turso (libsql) over the official ``libsql`` SDK.

Why a custom dialect instead of ``sqlalchemy-libsql``:
The published ``sqlalchemy-libsql`` (0.2.0) depends on ``libsql-experimental``,
a Rust extension with no prebuilt wheels — it cannot build on this Windows
dev machine (no MSVC) and would need the same Rust toolchain on Vercel.
The older ``sqlalchemy-libsql`` (0.1.0) ships with ``libsql-client 0.3.x``,
which speaks a stale protocol and fails Turso's WebSocket handshake (400).

The official ``libsql`` Python package (Rust SDK with prebuilt wheels for
Windows/Linux) exposes a standard sqlite3-style DB-API — Connection, Cursor,
lastrowid, rowcount, LEGACY_TRANSACTION_CONTROL — which is exactly what the
stock ``SQLiteDialect_pysqlite`` needs. This dialect is a thin adaptation of
the approach in sqlalchemy-libsql 0.2.0 (SQLiteDialect_libsql), pointed at
the ``libsql`` module instead.

URL format (SQLAlchemy side): ``sqlite+libsql://<host>?authToken=<jwt>&secure=true``
"""

import urllib.parse

from sqlalchemy import util
from sqlalchemy.dialects.sqlite.pysqlite import SQLiteDialect_pysqlite


class SQLiteDialect_libsql(SQLiteDialect_pysqlite):
    driver = "libsql"
    # pysqlite's statement cache is statement-level caching; keep it enabled
    # to mirror SQLite behavior through the libsql protocol.
    supports_statement_cache = SQLiteDialect_pysqlite.supports_statement_cache

    @classmethod
    def import_dbapi(cls):
        import libsql

        return libsql

    def on_connect(self):
        import libsql

        sqlite3_connect = super().on_connect()

        def connect(conn):
            # LibSQL: there is no support for create_function()
            if isinstance(conn, libsql.Connection):
                return
            return sqlite3_connect(conn)

        return connect

    def create_connect_args(self, url):
        opts = dict(url.query)

        # libsql.connect() accepts only: database, timeout, isolation_level,
        # _check_same_thread, _uri, sync_url, auth_token, ... Map the URL
        # query onto exactly those; everything else is ignored (never leak
        # sqlite-only flags into the Rust driver).
        libsql_opts: dict = {}
        if "timeout" in opts:
            libsql_opts["timeout"] = float(opts.pop("timeout"))
        if "isolation_level" in opts:
            libsql_opts["isolation_level"] = opts.pop("isolation_level")
        if "check_same_thread" in opts:
            libsql_opts["_check_same_thread"] = opts.pop("check_same_thread") == "true"

        # The native libsql driver does NOT read authToken from the URL —
        # it must arrive as the auth_token kwarg (otherwise: empty JWT).
        auth_token = opts.pop("authToken", "")
        opts.pop("secure", None)  # libsql:// implies wss; nothing to pass

        if not url.host:
            # local file / :memory: — libsql.connect handles paths directly
            database = url.database or ":memory:"
            if auth_token:
                libsql_opts["auth_token"] = auth_token
            return ((database,), libsql_opts)

        # Rebuild a clean libsql:// URL (host only — auth goes via kwarg).
        netloc = url.host
        if url.username and url.password:
            netloc = f"{url.username}:{url.password}@{netloc}"
        elif url.username:
            netloc = f"{url.username}@{netloc}"
        if url.port:
            netloc += f":{url.port}"
        libsql_url = urllib.parse.urlunsplit(
            ("libsql", netloc, url.database or "", "", "")
        )
        return ((libsql_url,), dict(libsql_opts, auth_token=auth_token))
