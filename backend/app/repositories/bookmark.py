from uuid import UUID

from sqlalchemy import Select, func, or_, select
from sqlalchemy.orm import Session, selectinload

from app.models.bookmark import Bookmark
from app.models.tag import Tag


class BookmarkRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def get(self, user_id: UUID, bookmark_id: UUID) -> Bookmark | None:
        return self.db.scalar(
            select(Bookmark)
            .options(selectinload(Bookmark.tags), selectinload(Bookmark.folder))
            .where(Bookmark.id == bookmark_id, Bookmark.user_id == user_id)
        )

    def get_by_normalized_url(self, user_id: UUID, normalized_url: str) -> Bookmark | None:
        return self.db.scalar(
            select(Bookmark)
            .options(selectinload(Bookmark.tags), selectinload(Bookmark.folder))
            .where(Bookmark.user_id == user_id, Bookmark.normalized_url == normalized_url)
        )

    def add(self, bookmark: Bookmark) -> Bookmark:
        self.db.add(bookmark)
        self.db.flush()
        return bookmark

    def delete(self, bookmark: Bookmark) -> None:
        self.db.delete(bookmark)

    def _base_query(
        self,
        user_id: UUID,
        *,
        folder_id: UUID | None = None,
        tag: str | None = None,
        favorite: bool | None = None,
        archived: bool | None = False,
        search: str | None = None,
        recent: str | None = None,
    ) -> Select[tuple[Bookmark]]:
        stmt = (
            select(Bookmark)
            .options(selectinload(Bookmark.tags), selectinload(Bookmark.folder))
            .where(Bookmark.user_id == user_id)
        )
        if archived is not None:
            stmt = stmt.where(Bookmark.is_archived == archived)
        if favorite is True:
            stmt = stmt.where(Bookmark.is_favorite.is_(True))
        if folder_id is not None:
            stmt = stmt.where(Bookmark.folder_id == folder_id)
        if tag:
            stmt = stmt.join(Bookmark.tags).where(Tag.user_id == user_id, Tag.name == tag)
        if search:
            term = f"%{_escape_like(search)}%"
            stmt = stmt.outerjoin(Bookmark.tags)
            stmt = stmt.where(
                or_(
                    Bookmark.title.ilike(term, escape="\\"),
                    Bookmark.url.ilike(term, escape="\\"),
                    Bookmark.page_domain.ilike(term, escape="\\"),
                    Bookmark.description.ilike(term, escape="\\"),
                    Bookmark.notes.ilike(term, escape="\\"),
                    Tag.name.ilike(term, escape="\\"),
                )
            ).distinct()
        if recent == "visited":
            stmt = stmt.where(Bookmark.last_visited_at.is_not(None))
        return stmt

    def list_page(
        self,
        user_id: UUID,
        *,
        folder_id: UUID | None = None,
        tag: str | None = None,
        favorite: bool | None = None,
        archived: bool | None = False,
        search: str | None = None,
        sort: str = "created_at",
        order: str = "desc",
        page: int = 1,
        page_size: int = 50,
        recent: str | None = None,
    ) -> tuple[list[Bookmark], int]:
        stmt = self._base_query(
            user_id,
            folder_id=folder_id,
            tag=tag,
            favorite=favorite,
            archived=archived,
            search=search,
            recent=recent,
        )
        total = self.db.scalar(select(func.count()).select_from(stmt.subquery())) or 0
        sort_map = {
            "created_at": Bookmark.created_at,
            "title": Bookmark.title,
            "url": Bookmark.url,
            "visit_count": Bookmark.visit_count,
            "last_visited_at": Bookmark.last_visited_at,
        }
        column = sort_map.get(sort, Bookmark.created_at)
        ordered = column.desc() if order.lower() == "desc" else column.asc()
        if sort == "last_visited_at":
            stmt = stmt.order_by(ordered.nulls_last(), Bookmark.created_at.desc())
        else:
            stmt = stmt.order_by(ordered)
        stmt = stmt.offset((page - 1) * page_size).limit(page_size)
        return list(self.db.scalars(stmt)), int(total)

    def move_folder_contents(self, user_id: UUID, folder_id: UUID, new_folder_id: UUID | None) -> None:
        bookmarks = list(
            self.db.scalars(select(Bookmark).where(Bookmark.user_id == user_id, Bookmark.folder_id == folder_id))
        )
        for bookmark in bookmarks:
            bookmark.folder_id = new_folder_id


def _escape_like(value: str) -> str:
    return value.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")
