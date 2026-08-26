from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.bookmark import Bookmark
from app.models.user import User
from app.repositories.bookmark import BookmarkRepository
from app.repositories.folder import FolderRepository
from app.repositories.tag import TagRepository
from app.services.metadata import extract_metadata
from app.utils.time import utcnow
from app.utils.urls import InvalidURLError, domain_from_url, normalize_url, parse_user_url


class DuplicateBookmarkError(Exception):
    def __init__(self, existing: Bookmark) -> None:
        self.existing = existing
        super().__init__("Bookmark already exists.")


class BookmarkService:
    def __init__(self, db: Session) -> None:
        self.bookmarks = BookmarkRepository(db)
        self.folders = FolderRepository(db)
        self.tags = TagRepository(db)

    def list_bookmarks(
        self,
        user: User,
        **filters: object,
    ) -> tuple[list[Bookmark], int]:
        return self.bookmarks.list_page(user.id, **filters)  # type: ignore[arg-type]

    def get(self, user: User, bookmark_id: UUID) -> Bookmark:
        bookmark = self.bookmarks.get(user.id, bookmark_id)
        if bookmark is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Bookmark not found.")
        return bookmark

    def create(
        self,
        user: User,
        *,
        url: str,
        title: str | None,
        description: str | None,
        notes: str | None,
        folder_id: UUID | None,
        tags: list[str],
        is_favorite: bool,
        fetch_metadata: bool,
    ) -> Bookmark:
        try:
            original = parse_user_url(url)
            normalized = normalize_url(url)
        except InvalidURLError as exc:
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc)) from exc

        existing = self.bookmarks.get_by_normalized_url(user.id, normalized)
        if existing:
            raise DuplicateBookmarkError(existing)

        self._require_folder(user.id, folder_id)

        metadata_title = None
        favicon_url = None
        metadata_description = None
        metadata_status = "skipped"
        if fetch_metadata and not title:
            metadata = extract_metadata(original)
            metadata_title = metadata.title
            favicon_url = metadata.favicon_url
            metadata_description = metadata.description
            metadata_status = metadata.status
        elif fetch_metadata:
            metadata = extract_metadata(original)
            favicon_url = metadata.favicon_url
            if description is None:
                metadata_description = metadata.description
            metadata_status = metadata.status
            metadata_title = metadata.title

        bookmark = Bookmark(
            user_id=user.id,
            folder_id=folder_id,
            url=original,
            normalized_url=normalized,
            title=(title or metadata_title or original)[:500],
            description=description if description is not None else metadata_description,
            notes=notes,
            favicon_url=favicon_url,
            page_domain=domain_from_url(original),
            metadata_status=metadata_status,
            is_favorite=is_favorite,
        )
        bookmark.tags = [self.tags.get_or_create(user.id, name) for name in tags if name.strip()]
        return self.bookmarks.add(bookmark)

    def update(
        self,
        user: User,
        bookmark_id: UUID,
        *,
        url: str | None = None,
        title: str | None = None,
        description: str | None = None,
        notes: str | None = None,
        folder_id: UUID | None = None,
        tags: list[str] | None = None,
        is_favorite: bool | None = None,
        fetch_metadata: bool = False,
        folder_specified: bool = False,
    ) -> Bookmark:
        bookmark = self.get(user, bookmark_id)
        if url is not None:
            try:
                original = parse_user_url(url)
                normalized = normalize_url(url)
            except InvalidURLError as exc:
                raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc)) from exc
            duplicate = self.bookmarks.get_by_normalized_url(user.id, normalized)
            if duplicate and duplicate.id != bookmark.id:
                raise DuplicateBookmarkError(duplicate)
            bookmark.url = original
            bookmark.normalized_url = normalized
            bookmark.page_domain = domain_from_url(original)
            if fetch_metadata:
                metadata = extract_metadata(original)
                bookmark.favicon_url = metadata.favicon_url
                bookmark.metadata_status = metadata.status
                if not title:
                    bookmark.title = metadata.title or bookmark.title
        if title is not None:
            bookmark.title = title[:500]
        if description is not None:
            bookmark.description = description
        if notes is not None:
            bookmark.notes = notes
        if folder_specified:
            self._require_folder(user.id, folder_id)
            bookmark.folder_id = folder_id
        if tags is not None:
            bookmark.tags = [self.tags.get_or_create(user.id, name) for name in tags if name.strip()]
        if is_favorite is not None:
            bookmark.is_favorite = is_favorite
        return bookmark

    def delete(self, user: User, bookmark_id: UUID) -> None:
        bookmark = self.get(user, bookmark_id)
        self.bookmarks.delete(bookmark)

    def visit(self, user: User, bookmark_id: UUID) -> Bookmark:
        bookmark = self.get(user, bookmark_id)
        bookmark.visit_count += 1
        bookmark.last_visited_at = utcnow()
        return bookmark

    def archive(self, user: User, bookmark_id: UUID) -> Bookmark:
        bookmark = self.get(user, bookmark_id)
        bookmark.is_archived = True
        return bookmark

    def restore(self, user: User, bookmark_id: UUID) -> Bookmark:
        bookmark = self.get(user, bookmark_id)
        bookmark.is_archived = False
        return bookmark

    def preview(self, url: str) -> dict[str, str | None]:
        try:
            original = parse_user_url(url)
        except InvalidURLError as exc:
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc)) from exc
        metadata = extract_metadata(original)
        return {
            "url": original,
            "title": metadata.title,
            "description": metadata.description,
            "favicon_url": metadata.favicon_url,
            "page_domain": metadata.page_domain,
            "metadata_status": metadata.status,
        }

    def _require_folder(self, user_id: UUID, folder_id: UUID | None) -> None:
        if folder_id is None:
            return
        if self.folders.get(user_id, folder_id) is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Folder not found.")
