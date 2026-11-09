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
        if not self.DEBUG and self.sqlalchemy_database_url.startswith("sqlite"):
            raise ValueError(
                "DATABASE_URL must point to Postgres when DEBUG=false "
                "(SQLite is not available on serverless filesystems). "
                "Set DATABASE_URL in the environment (e.g. Supabase/Neon)."
            )
        return self

    @property
    def sqlalchemy_database_url(self) -> str:
        """Return a SQLAlchemy URL using the installed psycopg 3 driver.

        Supabase/Neon both hand out ``postgresql://`` URLs. SQLAlchemy would
        otherwise look for psycopg2, while this project installs psycopg 3.
        """
        url = self.DATABASE_URL.strip()
        if url.startswith("postgres://"):
            return url.replace("postgres://", "postgresql+psycopg://", 1)
        if url.startswith("postgresql://"):
            return url.replace("postgresql://", "postgresql+psycopg://", 1)
        return url


settings = Settings()
