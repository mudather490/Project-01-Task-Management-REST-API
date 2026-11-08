import os
from datetime import date, timedelta

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

from app.db.database import Base, get_db  # noqa: E402
from app.db import models  # noqa: F401, E402
from app.main import app  # noqa: E402

engine.dispose()
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

# helpers

def register_and_login(email: str, password: str = "secret123"):
    client.post("/api/auth/register", json={"email": email, "password": password})
    resp = client.post("/api/auth/login", json={"email": email, "password": password})
    return resp.json()["access_token"]


def auth_headers(token: str):
    return {"Authorization": f"Bearer {token}"}


def test_create_task_requires_auth():
    resp = client.post("/api/tasks", json={"title": "Task without auth"})
    assert resp.status_code == 401


def test_crud_flow_and_ownership():
    token_a = register_and_login("a@example.com")
    token_b = register_and_login("b@example.com")

    # create task for A
    resp = client.post(
        "/api/tasks",
        json={"title": "Task A1", "description": "details for A", "priority": "high"},
        headers=auth_headers(token_a),
    )
    assert resp.status_code == 201, resp.text
    task_a = resp.json()
    task_id = task_a["id"]
    assert task_a["user_id"] > 0
    assert task_a["status"] == "todo"

    # B cannot see A's task
    resp = client.get(f"/api/tasks/{task_id}", headers=auth_headers(token_b))
    assert resp.status_code == 404

    # A can get it
    resp = client.get(f"/api/tasks/{task_id}", headers=auth_headers(token_a))
    assert resp.status_code == 200

    # A updates
    resp = client.patch(
        f"/api/tasks/{task_id}",
        json={"status": "in_progress"},
        headers=auth_headers(token_a),
    )
    assert resp.status_code == 200
    assert resp.json()["status"] == "in_progress"

    # B cannot delete
    resp = client.delete(f"/api/tasks/{task_id}", headers=auth_headers(token_b))
    assert resp.status_code == 404

    # A deletes
    resp = client.delete(f"/api/tasks/{task_id}", headers=auth_headers(token_a))
    assert resp.status_code == 204

    resp = client.get(f"/api/tasks/{task_id}", headers=auth_headers(token_a))
    assert resp.status_code == 404


def test_filters_search_and_sort():
    token = register_and_login("filter@example.com")
    h = auth_headers(token)

    client.post("/api/tasks", json={"title": "Buy milk", "priority": "low"}, headers=h)
    client.post("/api/tasks", json={"title": "Finish report", "priority": "high", "status": "done"}, headers=h)
    client.post("/api/tasks", json={"title": "Report follow up", "priority": "medium"}, headers=h)

    # filter by status
    resp = client.get("/api/tasks?status=todo", headers=h)
    assert resp.status_code == 200
    assert all(t["status"] == "todo" for t in resp.json())

    # search q
    resp = client.get("/api/tasks?q=Report", headers=h)
    assert resp.status_code == 200
    titles = [t["title"] for t in resp.json()]
    assert "Finish report" in titles
    assert "Report follow up" in titles

    # sort priority
    resp = client.get("/api/tasks?sort=priority", headers=h)
    assert resp.json()[0]["priority"] == "high"

    # pagination
    resp = client.get("/api/tasks?skip=0&limit=1", headers=h)
    assert len(resp.json()) == 1


def test_task_counts_are_scoped_and_accurate():
    token = register_and_login("counts@example.com")
    other_token = register_and_login("counts-other@example.com")
    h = auth_headers(token)
    other_h = auth_headers(other_token)

    today = date.today()
    yesterday = today - timedelta(days=1)
    tomorrow = today + timedelta(days=1)

    client.post("/api/tasks", json={"title": "Overdue", "due_date": str(yesterday)}, headers=h)
    client.post("/api/tasks", json={"title": "Due today", "due_date": str(today)}, headers=h)
    client.post("/api/tasks", json={"title": "Upcoming", "due_date": str(tomorrow)}, headers=h)
    client.post("/api/tasks", json={"title": "No date"}, headers=h)
    client.post(
        "/api/tasks",
        json={"title": "Finished", "status": "done", "due_date": str(today)},
        headers=h,
    )
    # Another user's tasks must never leak into these counters.
    client.post("/api/tasks", json={"title": "Other user", "due_date": str(today)}, headers=other_h)

    resp = client.get("/api/tasks/counts", headers=h)
    assert resp.status_code == 200, resp.text
    assert resp.json() == {
        "all": 5,
        "today": 2,       # due today + overdue
        "upcoming": 1,
        "overdue": 1,
        "completed": 1,
    }

    resp = client.get("/api/tasks/counts", headers=other_h)
    assert resp.status_code == 200
    assert resp.json() == {
        "all": 1,
        "today": 1,
        "upcoming": 0,
        "overdue": 0,
        "completed": 0,
    }
