from __future__ import annotations

import html
import logging
from dataclasses import dataclass, field
from html.parser import HTMLParser
from uuid import UUID

from sqlalchemy.orm import Session

from app.models.folder import Folder
from app.models.user import User
from app.repositories.bookmark import BookmarkRepository
from app.repositories.folder import FolderRepository
from app.services.bookmark import BookmarkService, DuplicateBookmarkError
from app.utils.urls import InvalidURLError, normalize_url, parse_user_url

logger = logging.getLogger(__name__)


@dataclass
class ImportReport:
    bookmarks_imported: int = 0
    folders_created: int = 0
    duplicates_detected: int = 0
    invalid_entries_skipped: int = 0


@dataclass
class _ParseState:
    folder_stack: list[UUID | None] = field(default_factory=lambda: [None])
    pending_folder: str | None = None
    in_h3: bool = False
    in_a: bool = False
    href: str | None = None
    text: list[str] = field(default_factory=list)


class ImportExportService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.folders = FolderRepository(db)
        self.bookmarks = BookmarkRepository(db)
        self.bookmark_service = BookmarkService(db)

    def import_netscape(self, user: User, content: str) -> ImportReport:
        report = ImportReport()
        parser = _NetscapeParser(self, user, report)
        parser.feed(content)
        parser.close()
        return report

    def _get_or_create_folder(self, user: User, name: str, parent_id: UUID | None) -> Folder:
        existing = self.folders.sibling_with_name(user.id, parent_id, name)
        if existing:
            existing._just_created = False  # type: ignore[attr-defined]
            return existing
        folder = Folder(
            user_id=user.id,
            parent_id=parent_id,
            name=name[:200],
            position=self.folders.next_position(user.id, parent_id),
        )
        self.folders.add(folder)
        folder._just_created = True  # type: ignore[attr-defined]
        return folder

    def _import_bookmark(self, user: User, href: str, title: str, folder_id: UUID | None, report: ImportReport) -> None:
        try:
            if "://" not in href:
                raise InvalidURLError("URL is missing a scheme.")
            parse_user_url(href)
            normalize_url(href)
        except InvalidURLError:
            report.invalid_entries_skipped += 1
            return
        try:
            self.bookmark_service.create(
                user,
                url=href,
                title=(title or href)[:500],
                description=None,
                notes=None,
                folder_id=folder_id,
                tags=[],
                is_favorite=False,
                fetch_metadata=False,
            )
            report.bookmarks_imported += 1
        except DuplicateBookmarkError:
            report.duplicates_detected += 1
        except Exception:
            logger.exception("Skipping invalid bookmark during import")
            report.invalid_entries_skipped += 1

    def export_netscape(self, user: User) -> str:
        folders = self.folders.list_for_user(user.id)
        bookmarks, _ = self.bookmarks.list_page(
            user.id, archived=None, page=1, page_size=100_000, sort="created_at", order="asc"
        )
        by_parent: dict[UUID | None, list[Folder]] = {}
        for folder in folders:
            by_parent.setdefault(folder.parent_id, []).append(folder)
        by_folder: dict[UUID | None, list] = {}
        for bookmark in bookmarks:
            by_folder.setdefault(bookmark.folder_id, []).append(bookmark)

        lines = [
            "<!DOCTYPE NETSCAPE-Bookmark-file-1>",
            "<!-- This is an automatically generated file.",
            "     It will be read and overwritten.",
            "     DO NOT EDIT! -->",
            '<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">',
            "<TITLE>Bookmarks</TITLE>",
            "<H1>Bookmarks</H1>",
            "<DL><p>",
        ]
        self._write_level(lines, None, by_parent, by_folder, indent=1)
        lines.append("</DL><p>")
        return "\n".join(lines) + "\n"

    def _write_level(
        self,
        lines: list[str],
        parent_id: UUID | None,
        by_parent: dict[UUID | None, list[Folder]],
        by_folder: dict[UUID | None, list],
        indent: int,
    ) -> None:
        pad = "    " * indent
        for folder in by_parent.get(parent_id, []):
            lines.append(f"{pad}<DT><H3>{html.escape(folder.name)}</H3>")
            lines.append(f"{pad}<DL><p>")
            self._write_level(lines, folder.id, by_parent, by_folder, indent + 1)
            lines.append(f"{pad}</DL><p>")
        for bookmark in by_folder.get(parent_id, []):
            lines.append(
                f'{pad}<DT><A HREF="{html.escape(bookmark.url, quote=True)}">{html.escape(bookmark.title)}</A>'
            )


class _NetscapeParser(HTMLParser):
    def __init__(self, service: ImportExportService, user: User, report: ImportReport) -> None:
        super().__init__(convert_charrefs=True)
        self.service = service
        self.user = user
        self.report = report
        self.state = _ParseState()

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        attrs_dict = {key.lower(): value for key, value in attrs}
        if tag == "h3":
            self.state.in_h3 = True
            self.state.text = []
        elif tag == "a":
            self.state.in_a = True
            self.state.href = attrs_dict.get("href")
            self.state.text = []
        elif tag == "dl":
            if self.state.pending_folder:
                folder = self.service._get_or_create_folder(
                    self.user, self.state.pending_folder, self.state.folder_stack[-1]
                )
                if getattr(folder, "_just_created", False):
                    self.report.folders_created += 1
                self.state.folder_stack.append(folder.id)
                self.state.pending_folder = None

    def handle_endtag(self, tag: str) -> None:
        if tag == "h3" and self.state.in_h3:
            self.state.pending_folder = "".join(self.state.text).strip() or "Untitled"
            self.state.in_h3 = False
        elif tag == "a" and self.state.in_a:
            href = self.state.href or ""
            title = "".join(self.state.text).strip()
            self.service._import_bookmark(self.user, href, title, self.state.folder_stack[-1], self.report)
            self.state.in_a = False
            self.state.href = None
        elif tag == "dl" and len(self.state.folder_stack) > 1:
            self.state.folder_stack.pop()

    def handle_data(self, data: str) -> None:
        if self.state.in_h3 or self.state.in_a:
            self.state.text.append(data)
