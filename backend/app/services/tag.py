from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.tag import Tag
from app.models.user import User
from app.repositories.tag import TagRepository, normalize_tag_name


class TagService:
    def __init__(self, db: Session) -> None:
        self.tags = TagRepository(db)

    def list_tags(self, user: User) -> list[Tag]:
        return self.tags.list_for_user(user.id)

    def create(self, user: User, name: str) -> Tag:
        normalized = normalize_tag_name(name)
        if not normalized:
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Tag name is required.")
        if self.tags.get_by_name(user.id, normalized):
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="A tag with this name already exists.")
        return self.tags.add(Tag(user_id=user.id, name=normalized))

    def update(self, user: User, tag_id: UUID, name: str) -> Tag:
        tag = self._require(user.id, tag_id)
        normalized = normalize_tag_name(name)
        existing = self.tags.get_by_name(user.id, normalized)
        if existing and existing.id != tag.id:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="A tag with this name already exists.")
        tag.name = normalized
        return tag

    def delete(self, user: User, tag_id: UUID) -> None:
        tag = self._require(user.id, tag_id)
        self.tags.delete(tag)

    def _require(self, user_id: UUID, tag_id: UUID) -> Tag:
        tag = self.tags.get(user_id, tag_id)
        if tag is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tag not found.")
        return tag
