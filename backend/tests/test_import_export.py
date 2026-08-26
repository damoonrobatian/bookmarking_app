from fastapi.testclient import TestClient

from tests.conftest import register_user

NETSCAPE = """<!DOCTYPE NETSCAPE-Bookmark-file-1>
<TITLE>Bookmarks</TITLE>
<H1>Bookmarks</H1>
<DL><p>
    <DT><H3>Work</H3>
    <DL><p>
        <DT><H3>Docs</H3>
        <DL><p>
            <DT><A HREF="https://fastapi.tiangolo.com/">FastAPI</A>
        </DL><p>
        <DT><A HREF="https://www.postgresql.org/docs/">Postgres</A>
    </DL><p>
    <DT><A HREF="not-a-url">Broken</A>
    <DT><A HREF="https://react.dev/">React</A>
</DL><p>
"""


def test_import_and_export(client: TestClient) -> None:
    register_user(client)
    imported = client.post(
        "/api/import/bookmarks",
        files={"file": ("bookmarks.html", NETSCAPE, "text/html")},
    )
    assert imported.status_code == 200, imported.text
    report = imported.json()
    assert report["bookmarks_imported"] == 3
    assert report["folders_created"] == 2
    assert report["invalid_entries_skipped"] == 1

    folders = {item["name"]: item for item in client.get("/api/folders").json()}
    assert "Work" in folders
    assert "Docs" in folders
    assert folders["Docs"]["parent_id"] == folders["Work"]["id"]

    again = client.post(
        "/api/import/bookmarks",
        files={"file": ("bookmarks.html", NETSCAPE, "text/html")},
    )
    assert again.json()["duplicates_detected"] == 3

    exported = client.get("/api/export/bookmarks")
    assert exported.status_code == 200
    body = exported.text
    assert "NETSCAPE-Bookmark-file-1" in body
    assert "FastAPI" in body
    assert "Work" in body
    assert "Docs" in body
    assert "https://react.dev/" in body
