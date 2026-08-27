from uuid import UUID

from sqlalchemy import delete, select, update
from sqlalchemy.orm import Session

from app.models.bookmark import Bookmark, bookmark_tags
from app.models.folder import Folder
from app.models.tag import Tag
from app.models.user import User


class UserRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def get_by_id(self, user_id: UUID) -> User | None:
        return self.db.get(User, user_id)

    def get_by_email(self, email: str) -> User | None:
        return self.db.scalar(select(User).where(User.email == email.lower()))

    def add(self, user: User) -> User:
        self.db.add(user)
        self.db.flush()
        return user

    def delete(self, user: User) -> None:
        bookmark_ids = select(Bookmark.id).where(Bookmark.user_id == user.id)
        self.db.execute(delete(bookmark_tags).where(bookmark_tags.c.bookmark_id.in_(bookmark_ids)))
        self.db.execute(delete(Bookmark).where(Bookmark.user_id == user.id))
        self.db.execute(delete(Tag).where(Tag.user_id == user.id))
        self.db.execute(update(Folder).where(Folder.user_id == user.id).values(parent_id=None))
        self.db.execute(delete(Folder).where(Folder.user_id == user.id))
        self.db.delete(user)
        self.db.flush()
