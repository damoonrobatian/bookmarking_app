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
