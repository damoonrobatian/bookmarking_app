import pytest
from fastapi.testclient import TestClient

from tests.conftest import register_user


def test_register_and_me(client: TestClient) -> None:
    register_user(client)
    me = client.get("/api/auth/me")
    assert me.status_code == 200
    data = me.json()
    assert data["email"] == "ada@example.com"
    assert data["display_name"] == "Ada"
    assert "password" not in data
    assert "password_hash" not in data


def test_duplicate_email_rejected(client: TestClient) -> None:
    register_user(client)
    again = client.post(
        "/api/auth/register",
        json={"email": "ada@example.com", "password": "anotherpass", "display_name": "Ada"},
    )
    assert again.status_code == 409


def test_login_logout(client: TestClient) -> None:
    register_user(client)
    client.post("/api/auth/logout")
    assert client.get("/api/auth/me").status_code == 401
    login = client.post(
        "/api/auth/login",
        json={"email": "ada@example.com", "password": "correct-horse"},
    )
    assert login.status_code == 200
    assert client.get("/api/auth/me").status_code == 200


def _set_cookie_headers(response) -> str:
    getter = getattr(response.headers, "get_list", None) or response.headers.getlist
    return " ".join(getter("set-cookie"))


def test_remember_me_sets_persistent_cookies(client: TestClient) -> None:
    register_user(client)
    client.post("/api/auth/logout")
    login = client.post(
        "/api/auth/login",
        json={"email": "ada@example.com", "password": "correct-horse", "remember_me": True},
    )
    assert login.status_code == 200
    cookies = _set_cookie_headers(login)
    assert "Max-Age=" in cookies
    assert client.get("/api/auth/me").status_code == 200


def test_secure_cookies_expire_insecure_duplicates(monkeypatch: pytest.MonkeyPatch) -> None:
    from app.config import Settings
    from app.security.cookies import set_auth_cookies
    from fastapi import Response

    monkeypatch.setattr(
        "app.security.cookies.get_settings",
        lambda: Settings(cookie_secure=True, environment="production"),
    )
    response = Response()
    set_auth_cookies(response, "access", "refresh", remember=True)
    setter = getattr(response.headers, "get_list", None) or response.headers.getlist
    headers = setter("set-cookie")
    assert any("access_token=" in item and "Max-Age=0" in item and "Secure" not in item for item in headers)
    assert any(item.startswith("access_token=access") and "Secure" in item for item in headers)


def test_login_without_remember_me_uses_session_cookies(client: TestClient) -> None:
    register_user(client)
    client.post("/api/auth/logout")
    login = client.post(
        "/api/auth/login",
        json={"email": "ada@example.com", "password": "correct-horse", "remember_me": False},
    )
    assert login.status_code == 200
    cookies = _set_cookie_headers(login)
    assert "Max-Age=" not in cookies
    assert client.get("/api/auth/me").status_code == 200


def test_invalid_login(client: TestClient) -> None:
    register_user(client)
    client.post("/api/auth/logout")
    response = client.post(
        "/api/auth/login",
        json={"email": "ada@example.com", "password": "wrong-password"},
    )
    assert response.status_code == 401


def test_unauthenticated_bookmarks(client: TestClient) -> None:
    assert client.get("/api/bookmarks").status_code == 401


def test_change_password(client: TestClient) -> None:
    register_user(client)
    wrong = client.post(
        "/api/auth/password",
        json={"current_password": "wrong-password", "new_password": "new-correct-horse"},
    )
    assert wrong.status_code == 401
    same = client.post(
        "/api/auth/password",
        json={"current_password": "correct-horse", "new_password": "correct-horse"},
    )
    assert same.status_code == 400
    changed = client.post(
        "/api/auth/password",
        json={"current_password": "correct-horse", "new_password": "new-correct-horse"},
    )
    assert changed.status_code == 204
    client.post("/api/auth/logout")
    old = client.post(
        "/api/auth/login",
        json={"email": "ada@example.com", "password": "correct-horse"},
    )
    assert old.status_code == 401
    new = client.post(
        "/api/auth/login",
        json={"email": "ada@example.com", "password": "new-correct-horse"},
    )
    assert new.status_code == 200


def test_delete_account(client: TestClient) -> None:
    register_user(client)
    client.post(
        "/api/bookmarks",
        json={"url": "https://fastapi.tiangolo.com/", "title": "FastAPI", "fetch_metadata": False},
    )
    wrong = client.request(
        "DELETE",
        "/api/auth/account",
        json={"password": "wrong-password"},
    )
    assert wrong.status_code == 401
    assert client.get("/api/auth/me").status_code == 200
    deleted = client.request(
        "DELETE",
        "/api/auth/account",
        json={"password": "correct-horse"},
    )
    assert deleted.status_code == 204
    assert client.get("/api/auth/me").status_code == 401
    again = client.post(
        "/api/auth/register",
        json={"email": "ada@example.com", "password": "correct-horse", "display_name": "Ada"},
    )
    assert again.status_code == 201
