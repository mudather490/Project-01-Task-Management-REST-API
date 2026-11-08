from fastapi.testclient import TestClient
from tests.conftest import register_and_login, auth_headers
from tests.conftest import client


def test_title_empty_rejected():
    token = register_and_login("h1@example.com")
    h = auth_headers(token)
    resp = client.post("/api/tasks", json={"title": ""}, headers=h)
    assert resp.status_code == 422


def test_title_too_long():
    token = register_and_login("h2@example.com")
    h = auth_headers(token)
    long_title = "x" * 201
    resp = client.post("/api/tasks", json={"title": long_title}, headers=h)
    assert resp.status_code == 422


def test_invalid_status_string():
    token = register_and_login("h3@example.com")
    h = auth_headers(token)
    resp = client.post("/api/tasks", json={"title": "t", "status": "invalid_status"}, headers=h)
    assert resp.status_code == 422


def test_invalid_priority():
    token = register_and_login("h4@example.com")
    h = auth_headers(token)
    resp = client.post("/api/tasks", json={"title": "t", "priority": "critical"}, headers=h)
    assert resp.status_code == 422


def test_pagination_beyond_range_returns_empty():
    token = register_and_login("h5@example.com")
    h = auth_headers(token)
    client.post("/api/tasks", json={"title": "one"}, headers=h)
    resp = client.get("/api/tasks?skip=100&limit=10", headers=h)
    assert resp.status_code == 200
    assert resp.json() == []


def test_due_date_past_allowed():
    token = register_and_login("h6@example.com")
    h = auth_headers(token)
    resp = client.post("/api/tasks", json={"title": "past due", "due_date": "2020-01-01"}, headers=h)
    assert resp.status_code == 201


def test_expired_token_not_needed_but_invalid_token():
    resp = client.get("/api/users/me", headers={"Authorization": "Bearer expired.invalid.token"})
    assert resp.status_code == 401


def test_overdue_filter_logic():
    token = register_and_login("h7@example.com")
    h = auth_headers(token)
    client.post("/api/tasks", json={"title": "overdue task", "due_date": "2020-01-01", "status": "todo"}, headers=h)
    client.post("/api/tasks", json={"title": "done overdue", "due_date": "2020-01-01", "status": "done"}, headers=h)
    client.post("/api/tasks", json={"title": "future", "due_date": "2030-01-01"}, headers=h)

    resp = client.get("/api/tasks?overdue=true", headers=h)
    assert resp.status_code == 200
    titles = [t["title"] for t in resp.json()]
    assert "overdue task" in titles
    assert "done overdue" not in titles
    assert "future" not in titles
