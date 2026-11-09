from pydantic import model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    APP_NAME: str = "Task Management API"
    DEBUG: bool = True

    DATABASE_URL: str = "sqlite:///./task_management.db"

    # Comma-separated list of browser origins allowed to call this API.
    # Same-origin requests (the Vercel deployment and the local Next.js proxy)
    # do not need CORS; these origins are for direct local API access.
    CORS_ORIGINS: str = "http://localhost:3000,http://127.0.0.1:3000"

    SECRET_KEY: str = "dev-only-insecure-secret-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    model_config = SettingsConfigDict(env_file=".env", case_sensitive=True)

    @model_validator(mode="after")
    def _require_database_in_production(self):
        """Fail fast at boot when production has no Postgres DATABASE_URL.

        Without this check, missing DATABASE_URL silently selects the
        default SQLite file, which is read-only on serverless filesystems
        and surfaces as an opaque 500 on the first database write (e.g.
        POST /api/auth/register). Raising here turns that into a clear
        startup error instead.
        """
        if not self.DATABASE_URL.strip():
            raise ValueError(
                "DATABASE_URL is empty. Set it in the environment "
                "(e.g. Turso libsql://, Supabase/Neon postgresql://, or the "
                "default local SQLite file for development)."
            )
        is_file_sqlite = self.sqlalchemy_database_url.startswith("sqlite://") and (
            "libsql" not in self.sqlalchemy_database_url
        )
        if not self.DEBUG and is_file_sqlite:
            raise ValueError(
                "DATABASE_URL must point to a remote database (Postgres or "
                "Turso libsql) when DEBUG=false: a local SQLite file is not "
                "available on serverless filesystems and would lose data. "
                "Set DATABASE_URL in the environment."
            )
        return self

    @property
    def sqlalchemy_database_url(self) -> str:
        """Return a SQLAlchemy URL using the installed driver for this backend.

        - Postgres (Supabase/Neon) → ``postgresql+psycopg://`` (psycopg 3 is installed).
        - Turso (libsql) → ``sqlite+libsql://...&secure=true`` so the app can
          run a durable SQLite-family database on serverless filesystems.
        Single-file SQLite (``sqlite:///...``) stays available for local dev.
        """
        url = self.DATABASE_URL.strip()
        if url.startswith("postgres://"):
            return url.replace("postgres://", "postgresql+psycopg://", 1)
        if url.startswith("postgresql://"):
            return url.replace("postgresql://", "postgresql+psycopg://", 1)
        if url.startswith("libsql://"):
            # Turso dashboard gives: libsql://host?authToken=JWT
            turso_url = url.replace("libsql://", "sqlite+libsql://", 1)
            if "secure=" not in turso_url:
                separator = "&" if "?" in turso_url else "?"
                turso_url = f"{turso_url}{separator}secure=true"
            return turso_url
        return url


settings = Settings()
