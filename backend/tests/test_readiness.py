"""Readiness probe, production fail-fast, and rate-limit behaviour."""

import pytest
from pydantic import ValidationError

from app.core.config import Settings
from tests.conftest import client


def test_health():
    resp = client.get("/api/health")
    assert resp.status_code == 200
    assert resp.json()["status"] == "ok"


def test_ready_ok_when_database_answers():
    resp = client.get("/api/ready")
    assert resp.status_code == 200
    assert resp.json() == {"status": "ready", "database": "ok"}


def test_ready_returns_503_bilingual_when_database_unreachable():
    import sqlalchemy

    from app.db.database import get_db
    from app.main import app

    class BrokenSession:
        """Session stand-in whose execute() simulates a dead connection."""

        def execute(self, *args, **kwargs):
            raise sqlalchemy.exc.OperationalError(
                "SELECT 1", {}, Exception("connection refused")
            )

        def rollback(self):
            pass

    def failing_db():
        yield BrokenSession()

    app.dependency_overrides[get_db] = failing_db
    try:
        resp = client.get("/api/ready", headers={"Accept-Language": "ar"})
    finally:
        del app.dependency_overrides[get_db]
    assert resp.status_code == 503
    detail = resp.json()["detail"]
    assert detail["code"] == "db_unreachable"
    assert detail["message"] == "قاعدة البيانات غير متاحة الآن. حاول بعد قليل."


def test_production_fails_fast_on_sqlite():
    with pytest.raises(ValidationError, match="DATABASE_URL"):
        Settings(DATABASE_URL="sqlite:///./task_management.db", DEBUG=False)


def test_production_accepts_postgres_url():
    settings = Settings(
        DATABASE_URL="postgresql://user:pass@host.pooler.supabase.com:5432/postgres",
        DEBUG=False,
    )
    assert settings.sqlalchemy_database_url.startswith("postgresql+psycopg://")


def test_rate_limit_disabled_in_debug_mode():
    """With DEBUG=true the limiter never throttles (keeps the suite hermetic)."""
    for i in range(12):
        resp = client.post(
            "/api/auth/register",
            json={"email": f"burst{i}@example.com", "password": "secret123"},
        )
        assert resp.status_code in (201, 400)  # never 429 in debug
