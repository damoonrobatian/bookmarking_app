from fastapi.testclient import TestClient

from tests.conftest import register_user


def test_nested_folders(client: TestClient) -> None:
    register_user(client)
    work = client.post("/api/folders", json={"name": "Work"}).json()
    research = client.post("/api/folders", json={"name": "Research", "parent_id": work["id"]})
    assert research.status_code == 201
    folders = client.get("/api/folders").json()
    assert len(folders) == 2
    nested = next(item for item in folders if item["name"] == "Research")
    assert nested["parent_id"] == work["id"]


def test_folder_cycle_rejected(client: TestClient) -> None:
    register_user(client)
    parent = client.post("/api/folders", json={"name": "Parent"}).json()
    child = client.post("/api/folders", json={"name": "Child", "parent_id": parent["id"]}).json()
    move = client.post(f"/api/folders/{parent['id']}/move", json={"parent_id": child["id"]})
    assert move.status_code == 400


def test_delete_folder_moves_contents(client: TestClient) -> None:
    register_user(client)
    parent = client.post("/api/folders", json={"name": "Parent"}).json()
    child = client.post("/api/folders", json={"name": "Child", "parent_id": parent["id"]}).json()
    bookmark = client.post(
        "/api/bookmarks",
        json={
            "url": "https://example.com/work",
            "title": "Work item",
            "folder_id": child["id"],
            "fetch_metadata": False,
        },
    ).json()
    deleted = client.delete(f"/api/folders/{child['id']}")
    assert deleted.status_code == 204
    moved = client.get(f"/api/bookmarks/{bookmark['id']}").json()
    assert moved["folder_id"] == parent["id"]
    remaining = client.get("/api/folders").json()
    assert [item["name"] for item in remaining] == ["Parent"]


def test_rename_folder(client: TestClient) -> None:
    register_user(client)
    folder = client.post("/api/folders", json={"name": "Old"}).json()
    updated = client.patch(f"/api/folders/{folder['id']}", json={"name": "New"})
    assert updated.json()["name"] == "New"
