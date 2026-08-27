from typing import Literal
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.schemas import (
    BookmarkCreate,
    BookmarkPreview,
    BookmarkPreviewRequest,
    BookmarkRead,
    BookmarkUpdate,
    DuplicateBookmark,
    Paginated,
)
from app.services.bookmark import BookmarkService, DuplicateBookmarkError

router = APIRouter(prefix="/bookmarks", tags=["bookmarks"])


def _duplicate_response(exc: DuplicateBookmarkError) -> HTTPException:
    body = DuplicateBookmark(
        message="This Bookmark Already Exists.",
        existing=BookmarkRead.model_validate(exc.existing),
    )
    return HTTPException(status_code=status.HTTP_409_CONFLICT, detail=body.model_dump(mode="json"))


@router.get("", response_model=Paginated[BookmarkRead])
def list_bookmarks(
    folder_id: UUID | None = None,
    tag: str | None = None,
    favorite: bool | None = None,
    archived: bool | None = False,
    search: str | None = None,
    sort: Literal["created_at", "title", "url", "visit_count", "last_visited_at"] = "created_at",
    order: Literal["asc", "desc"] = "desc",
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=50, ge=1, le=100),
    recent: Literal["added", "visited"] | None = None,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> Paginated[BookmarkRead]:
    items, total = BookmarkService(db).list_bookmarks(
        user,
        folder_id=folder_id,
        tag=tag,
        favorite=favorite,
        archived=archived,
        search=search,
        sort="created_at" if recent == "added" else ("last_visited_at" if recent == "visited" else sort),
        order=order,
        page=page,
        page_size=page_size,
        recent="visited" if recent == "visited" else None,
    )
    return Paginated(
        items=[BookmarkRead.model_validate(item) for item in items],
        page=page,
        page_size=page_size,
        total=total,
    )


@router.post("/preview", response_model=BookmarkPreview)
def preview_bookmark(
    payload: BookmarkPreviewRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> BookmarkPreview:
    data = BookmarkService(db).preview(user, payload.url)
    return BookmarkPreview(**data)


@router.post("", response_model=BookmarkRead, status_code=status.HTTP_201_CREATED)
def create_bookmark(
    payload: BookmarkCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> BookmarkRead:
    try:
        bookmark = BookmarkService(db).create(
            user,
            url=payload.url,
            title=payload.title,
            description=payload.description,
            notes=payload.notes,
            folder_id=payload.folder_id,
            tags=payload.tags,
            is_favorite=payload.is_favorite,
            fetch_metadata=payload.fetch_metadata,
        )
    except DuplicateBookmarkError as exc:
        raise _duplicate_response(exc) from exc
    return BookmarkRead.model_validate(bookmark)


@router.get("/{bookmark_id}", response_model=BookmarkRead)
def get_bookmark(
    bookmark_id: UUID,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> BookmarkRead:
    return BookmarkRead.model_validate(BookmarkService(db).get(user, bookmark_id))


@router.patch("/{bookmark_id}", response_model=BookmarkRead)
def update_bookmark(
    bookmark_id: UUID,
    payload: BookmarkUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> BookmarkRead:
    data = payload.model_dump(exclude_unset=True)
    try:
        bookmark = BookmarkService(db).update(
            user,
            bookmark_id,
            url=payload.url,
            title=payload.title,
            description=payload.description,
            notes=payload.notes,
            folder_id=payload.folder_id,
            tags=payload.tags,
            is_favorite=payload.is_favorite,
            fetch_metadata=payload.fetch_metadata,
            folder_specified="folder_id" in data,
        )
    except DuplicateBookmarkError as exc:
        raise _duplicate_response(exc) from exc
    return BookmarkRead.model_validate(bookmark)


@router.delete("/{bookmark_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_bookmark(
    bookmark_id: UUID,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> Response:
    BookmarkService(db).delete(user, bookmark_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post("/{bookmark_id}/visit", response_model=BookmarkRead)
def visit_bookmark(
    bookmark_id: UUID,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> BookmarkRead:
    return BookmarkRead.model_validate(BookmarkService(db).visit(user, bookmark_id))


@router.post("/{bookmark_id}/archive", response_model=BookmarkRead)
def archive_bookmark(
    bookmark_id: UUID,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> BookmarkRead:
    return BookmarkRead.model_validate(BookmarkService(db).archive(user, bookmark_id))


@router.post("/{bookmark_id}/restore", response_model=BookmarkRead)
def restore_bookmark(
    bookmark_id: UUID,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> BookmarkRead:
    return BookmarkRead.model_validate(BookmarkService(db).restore(user, bookmark_id))
