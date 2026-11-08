from fastapi.testclient import TestClient

from tests.conftest import register_and_login, auth_headers


def test_task_not_found_english():
    token = register_and_login("i18n1@example.com")
    resp = client_get("/api/tasks/99999", token, lang="en")
    assert resp.status_code == 404
    detail = resp.json()["detail"]
    assert detail["code"] == "task_not_found"


def test_task_not_found_arabic_via_header():
    token = register_and_login("i18n2@example.com")
    resp = client_get("/api/tasks/99999", token, lang="ar")
    assert resp.status_code == 404
    detail = resp.json()["detail"]
    assert "المهمة" in detail["message"]


def test_user_language_setting_persists_and_overrides():
    token = register_and_login("i18n3@example.com")
    h = auth_headers(token)

    # get /users/me
    resp = client.get("/api/users/me", headers=h)
    assert resp.status_code == 200
    assert resp.json()["email"] == "i18n3@example.com"

    # update language to ar
    resp = client.patch("/api/users/me", json={"language": "ar"}, headers=h)
    assert resp.status_code == 200
    assert resp.json()["language"] == "ar"

    # subsequent 404 without header should use stored language (ar)
    resp = client.get("/api/tasks/99999", headers=h)
    assert resp.json()["detail"]["message"] == "المهمة غير موجودة"


# helper to avoid circular import of client
from tests.conftest import client  # noqa: E402


def client_get(path: str, token: str, lang: str):
    headers = auth_headers(token)
    headers["Accept-Language"] = lang
    return client.get(path, headers=headers)
