import os

import os

os.environ["DATABASE_URL"] = "sqlite:///./test.db"

from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

TEST_DB_URL = "sqlite:///./test.db"

engine = create_engine(
    TEST_DB_URL,
    connect_args={"check_same_thread": False},
    poolclass=None,
)

TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Import AFTER setting env so settings picks test DB
from app.db.database import Base, get_db  # noqa: E402
from app.db import models  # noqa: F401, E402 - register tables
from app.main import app  # noqa: E402

# recreate tables on test engine
Base.metadata.drop_all(bind=engine)
Base.metadata.create_all(bind=engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db

client = TestClient(app)


def test_register_success():
    resp = client.post(
        "/api/auth/register",
        json={"email": "new@example.com", "password": "secret123", "language": "en"},
    )
    assert resp.status_code == 201, resp.text
    data = resp.json()
    assert data["email"] == "new@example.com"
    assert data["language"] == "en"
    assert "password" not in data


def test_register_duplicate_returns_400():
    resp = client.post(
        "/api/auth/register",
        json={"email": "new@example.com", "password": "secret123"},
    )
    assert resp.status_code == 400


def test_login_success():
    resp = client.post(
        "/api/auth/login",
        json={"email": "new@example.com", "password": "secret123"},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"


def test_login_wrong_password_401():
    resp = client.post(
        "/api/auth/login",
        json={"email": "new@example.com", "password": "wrongpass123"},
    )
    assert resp.status_code == 401


def test_login_arabic_message():
    resp = client.post(
        "/api/auth/login",
        json={"email": "new@example.com", "password": "wrongpass123"},
        headers={"Accept-Language": "ar"},
    )
    assert resp.status_code == 401
    detail = resp.json()["detail"]
    assert detail["code"] == "invalid_credentials"
    assert "غير صحيحة" in detail["message"]


def test_password_stored_hashed():
    from app.db.models import User

    db = TestingSessionLocal()
    user = db.query(User).filter(User.email == "new@example.com").first()
    assert user is not None
    assert user.hashed_password != "secret123"
    assert user.hashed_password.startswith("$2b$")
    db.close()
