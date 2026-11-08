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
