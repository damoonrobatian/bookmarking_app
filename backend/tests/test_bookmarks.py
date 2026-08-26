from fastapi.testclient import TestClient

from tests.conftest import register_user


def test_bookmark_crud(client: TestClient) -> None:
    register_user(client)
    created = client.post(
        "/api/bookmarks",
        json={
            "url": "https://fastapi.tiangolo.com/",
            "title": "FastAPI",
            "description": "API docs",
            "notes": "Read later",
            "tags": ["python", "docs"],
            "fetch_metadata": False,
        },
    )
    assert created.status_code == 201, created.text
    bookmark = created.json()
    assert bookmark["title"] == "FastAPI"
    assert bookmark["page_domain"] == "fastapi.tiangolo.com"
    assert {tag["name"] for tag in bookmark["tags"]} == {"python", "docs"}

    listed = client.get("/api/bookmarks")
    assert listed.status_code == 200
    assert listed.json()["total"] == 1

    detail = client.get(f"/api/bookmarks/{bookmark['id']}")
    assert detail.status_code == 200

    updated = client.patch(
        f"/api/bookmarks/{bookmark['id']}",
        json={"title": "FastAPI Docs", "is_favorite": True},
    )
    assert updated.json()["title"] == "FastAPI Docs"
    assert updated.json()["is_favorite"] is True

    deleted = client.delete(f"/api/bookmarks/{bookmark['id']}")
    assert deleted.status_code == 204
    assert client.get(f"/api/bookmarks/{bookmark['id']}").status_code == 404


def test_duplicate_bookmark(client: TestClient) -> None:
    register_user(client)
    payload = {"url": "https://example.com/path?utm_source=x", "title": "Example", "fetch_metadata": False}
    first = client.post("/api/bookmarks", json=payload)
    assert first.status_code == 201
    second = client.post("/api/bookmarks", json={"url": "https://example.com/path", "title": "Again"})
    assert second.status_code == 409
    assert second.json()["detail"]["code"] == "duplicate"
    assert second.json()["detail"]["existing"]["id"] == first.json()["id"]


def test_search_and_sort(client: TestClient) -> None:
    register_user(client)
    client.post(
        "/api/bookmarks",
        json={"url": "https://react.dev/", "title": "React", "notes": "frontend library", "fetch_metadata": False},
    )
    client.post(
        "/api/bookmarks",
        json={
            "url": "https://www.postgresql.org/",
            "title": "Postgres",
            "description": "database",
            "fetch_metadata": False,
        },
    )
    results = client.get("/api/bookmarks", params={"search": "frontend"})
    assert results.json()["total"] == 1
    assert results.json()["items"][0]["title"] == "React"

    tagged = client.post(
        "/api/bookmarks",
        json={"url": "https://docs.python.org/", "title": "Python", "tags": ["docs"], "fetch_metadata": False},
    )
    assert tagged.status_code == 201
    by_tag = client.get("/api/bookmarks", params={"search": "docs"})
    assert by_tag.json()["total"] == 1

    sorted_title = client.get("/api/bookmarks", params={"sort": "title", "order": "asc"})
    titles = [item["title"] for item in sorted_title.json()["items"]]
    assert titles == sorted(titles)


def test_archive_restore_favorite_visit(client: TestClient) -> None:
    register_user(client)
    created = client.post(
        "/api/bookmarks",
        json={"url": "https://example.org/", "title": "Example", "fetch_metadata": False},
    ).json()
    bookmark_id = created["id"]

    client.patch(f"/api/bookmarks/{bookmark_id}", json={"is_favorite": True})
    favorites = client.get("/api/bookmarks", params={"favorite": True})
    assert favorites.json()["total"] == 1

    client.post(f"/api/bookmarks/{bookmark_id}/archive")
    active = client.get("/api/bookmarks")
    assert active.json()["total"] == 0
    archived = client.get("/api/bookmarks", params={"archived": True})
    assert archived.json()["total"] == 1

    client.post(f"/api/bookmarks/{bookmark_id}/restore")
    assert client.get("/api/bookmarks").json()["total"] == 1

    visited = client.post(f"/api/bookmarks/{bookmark_id}/visit")
    assert visited.json()["visit_count"] == 1
    assert visited.json()["last_visited_at"] is not None

    recent = client.get("/api/bookmarks", params={"recent": "visited"})
    assert recent.json()["total"] == 1


def test_pagination(client: TestClient) -> None:
    register_user(client)
    for index in range(3):
        client.post(
            "/api/bookmarks",
            json={"url": f"https://example.com/page-{index}", "title": f"Page {index}", "fetch_metadata": False},
        )
    page = client.get("/api/bookmarks", params={"page": 1, "page_size": 2})
    assert page.json()["page_size"] == 2
    assert page.json()["total"] == 3
    assert len(page.json()["items"]) == 2
