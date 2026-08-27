from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.bookmark import Bookmark, bookmark_tags
from app.models.folder import Folder
from app.models.tag import Tag


def normalize_tag_name(name: str) -> str:
    return " ".join(name.strip().lower().split())


class TagRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def get(self, user_id: UUID, tag_id: UUID) -> Tag | None:
        return self.db.scalar(select(Tag).where(Tag.id == tag_id, Tag.user_id == user_id))

    def get_by_name(self, user_id: UUID, name: str) -> Tag | None:
        return self.db.scalar(select(Tag).where(Tag.user_id == user_id, Tag.name == normalize_tag_name(name)))

    def list_for_user(self, user_id: UUID) -> list[Tag]:
        return list(self.db.scalars(select(Tag).where(Tag.user_id == user_id).order_by(Tag.name.asc())))

    def list_grouped_by_folder(self, user_id: UUID) -> list[tuple[UUID | None, str, UUID, str, int]]:
        stmt = (
            select(Bookmark.folder_id, Folder.name, Tag.id, Tag.name, func.count(Bookmark.id))
            .select_from(Bookmark)
            .join(bookmark_tags, bookmark_tags.c.bookmark_id == Bookmark.id)
            .join(Tag, Tag.id == bookmark_tags.c.tag_id)
            .outerjoin(Folder, Folder.id == Bookmark.folder_id)
            .where(Bookmark.user_id == user_id, Bookmark.is_archived.is_(False))
            .group_by(Bookmark.folder_id, Folder.name, Tag.id, Tag.name)
        )
        return [(row[0], row[1] or "No Folder", row[2], row[3], int(row[4])) for row in self.db.execute(stmt)]

    def get_or_create(self, user_id: UUID, name: str) -> Tag:
        normalized = normalize_tag_name(name)
        if not normalized:
            raise ValueError("Tag name is required.")
        existing = self.get_by_name(user_id, normalized)
        if existing:
            return existing
        tag = Tag(user_id=user_id, name=normalized)
        self.db.add(tag)
        self.db.flush()
        return tag

    def add(self, tag: Tag) -> Tag:
        self.db.add(tag)
        self.db.flush()
        return tag

    def delete(self, tag: Tag) -> None:
        self.db.delete(tag)
