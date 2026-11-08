from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

from app.core.config import settings


database_url = settings.sqlalchemy_database_url

connect_args: dict = {}
engine_kwargs: dict = {}

if database_url.startswith("sqlite"):
    connect_args = {"check_same_thread": False}
else:
    # Serverless-friendly pool settings. Neon/Supabase can drop idle
    # connections, so validate them before use.
    engine_kwargs = {"pool_pre_ping": True, "pool_recycle": 300}

    # Supabase's transaction pooler (port 6543) does not support prepared
    # statements. The session pooler (5432) does not need this flag.
    if ":6543" in database_url:
        connect_args = {"prepare_threshold": None}

engine = create_engine(
    database_url,
    connect_args=connect_args,
    **engine_kwargs,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    """Shared base for all ORM models (users, tasks)."""


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
