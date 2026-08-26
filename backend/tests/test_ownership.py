from fastapi.testclient import TestClient

from tests.conftest import register_user


def test_user_cannot_access_other_users_data(client: TestClient) -> None:
    register_user(client, email="ada@example.com", display_name="Ada")
    folder = client.post("/api/folders", json={"name": "Private"}).json()
    bookmark = client.post(
        "/api/bookmarks",
        json={
            "url": "https://secret.example/",
            "title": "Secret",
            "folder_id": folder["id"],
            "fetch_metadata": False,
        },
    ).json()
    tag = client.post("/api/tags", json={"name": "secret"}).json()
    client.post("/api/auth/logout")

    register_user(client, email="grace@example.com", display_name="Grace")
    assert client.get(f"/api/bookmarks/{bookmark['id']}").status_code == 404
    assert client.patch(f"/api/bookmarks/{bookmark['id']}", json={"title": "Stolen"}).status_code == 404
    assert client.delete(f"/api/bookmarks/{bookmark['id']}").status_code == 404
    assert client.post(f"/api/bookmarks/{bookmark['id']}/archive").status_code == 404
    assert client.get("/api/bookmarks").json()["total"] == 0
    assert client.patch(f"/api/folders/{folder['id']}", json={"name": "Hacked"}).status_code == 404
    assert client.delete(f"/api/folders/{folder['id']}").status_code == 404
    assert client.post(f"/api/folders/{folder['id']}/move", json={"parent_id": None}).status_code == 404
    assert client.delete(f"/api/tags/{tag['id']}").status_code == 404

    listed_folders = client.get("/api/folders").json()
    assert listed_folders == []
