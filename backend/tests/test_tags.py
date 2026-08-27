from fastapi.testclient import TestClient

from tests.conftest import register_user


def test_tag_crud_and_filter(client: TestClient) -> None:
    register_user(client)
    created = client.post("/api/tags", json={"name": "  Machine Learning "})
    assert created.status_code == 201
    assert created.json()["name"] == "machine learning"

    duplicate = client.post("/api/tags", json={"name": "machine learning"})
    assert duplicate.status_code == 409

    tag_id = created.json()["id"]
    renamed = client.patch(f"/api/tags/{tag_id}", json={"name": "research"})
    assert renamed.json()["name"] == "research"

    client.post(
        "/api/bookmarks",
        json={"url": "https://arxiv.org/", "title": "Arxiv", "tags": ["research"], "fetch_metadata": False},
    )
    client.post(
        "/api/bookmarks",
        json={"url": "https://news.ycombinator.com/", "title": "HN", "tags": ["news"], "fetch_metadata": False},
    )
    filtered = client.get("/api/bookmarks", params={"tag": "research"})
    assert filtered.json()["total"] == 1
    assert filtered.json()["items"][0]["title"] == "Arxiv"

    client.delete(f"/api/tags/{tag_id}")
    assert len(client.get("/api/tags").json()) == 1


def test_tags_grouped_by_folder(client: TestClient) -> None:
    register_user(client)
    folder = client.post("/api/folders", json={"name": "Work"}).json()
    client.post(
        "/api/bookmarks",
        json={
            "url": "https://docs.python.org/",
            "title": "Python",
            "folder_id": folder["id"],
            "tags": ["docs", "python"],
            "fetch_metadata": False,
        },
    )
    client.post(
        "/api/bookmarks",
        json={"url": "https://news.ycombinator.com/", "title": "HN", "tags": ["news"], "fetch_metadata": False},
    )
    grouped = client.get("/api/tags/grouped")
    assert grouped.status_code == 200
    by_name = {item["folder_name"]: item for item in grouped.json()}
    assert {tag["name"] for tag in by_name["Work"]["tags"]} == {"docs", "python"}
    assert {tag["name"] for tag in by_name["No Folder"]["tags"]} == {"news"}
