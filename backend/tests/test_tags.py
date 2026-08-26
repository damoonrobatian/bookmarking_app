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
