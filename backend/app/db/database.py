from sqlalchemy import create_engine
from sqlalchemy.exc import OperationalError, ProgrammingError
from sqlalchemy.orm import DeclarativeBase, sessionmaker
import time

from app.core.config import settings


database_url = settings.sqlalchemy_database_url

is_libsql = "libsql" in database_url

if is_libsql:
    # Register our own sqlite.libsql dialect (backed by the official
    # `libsql` SDK) instead of sqlalchemy-libsql's stale libsql-client.
    from sqlalchemy.dialects import registry

    registry.register("sqlite.libsql", "app.db.libsql_dialect", "SQLiteDialect_libsql")

connect_args: dict = {}
engine_kwargs: dict = {}

if database_url.startswith("sqlite") and not is_libsql:
    connect_args = {"check_same_thread": False}
else:
    # Serverless-friendly pool settings (Postgres and Turso both drop idle
    # connections, so validate them before use).
    engine_kwargs = {"pool_pre_ping": True, "pool_recycle": 300}

    # Supabase's transaction pooler (port 6543) does not support prepared
    # statements. The session pooler (5432) does not need this flag, and
    # the flag is meaningless for Turso — skip it there.
    if ":6543" in database_url and not is_libsql:
        connect_args = {"prepare_threshold": None}

engine = create_engine(
    database_url,
    connect_args=connect_args,
    **engine_kwargs,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def init_db(retries: int = 3) -> None:
    """Create tables if missing.

    On serverless platforms several cold-start instances can run this
    concurrently; the losers get "relation already exists" (ProgrammingError)
    or transient connection errors. Retrying makes startup idempotent-safe.
    """
    for attempt in range(retries):
        try:
            Base.metadata.create_all(bind=engine)
            return
        except (OperationalError, ProgrammingError):
            if attempt == retries - 1:
                raise
            time.sleep(0.5 * (attempt + 1))


class Base(DeclarativeBase):
    """Shared base for all ORM models (users, tasks)."""


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
