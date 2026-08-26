from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.folder import Folder


class FolderRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def get(self, user_id: UUID, folder_id: UUID) -> Folder | None:
        return self.db.scalar(select(Folder).where(Folder.id == folder_id, Folder.user_id == user_id))

    def list_for_user(self, user_id: UUID) -> list[Folder]:
        return list(
            self.db.scalars(
                select(Folder).where(Folder.user_id == user_id).order_by(Folder.position.asc(), Folder.name.asc())
            )
        )

    def next_position(self, user_id: UUID, parent_id: UUID | None) -> int:
        current = self.db.scalar(
            select(func.coalesce(func.max(Folder.position), -1)).where(
                Folder.user_id == user_id, Folder.parent_id == parent_id
            )
        )
        return int(current) + 1

    def sibling_with_name(
        self, user_id: UUID, parent_id: UUID | None, name: str, exclude_id: UUID | None = None
    ) -> Folder | None:
        stmt = select(Folder).where(
            Folder.user_id == user_id,
            Folder.parent_id == parent_id,
            Folder.name == name,
        )
        if exclude_id is not None:
            stmt = stmt.where(Folder.id != exclude_id)
        return self.db.scalar(stmt)

    def add(self, folder: Folder) -> Folder:
        self.db.add(folder)
        self.db.flush()
        return folder

    def delete(self, folder: Folder) -> None:
        self.db.delete(folder)

    def descendants(self, user_id: UUID, folder_id: UUID) -> list[Folder]:
        folders = self.list_for_user(user_id)
        by_parent: dict[UUID | None, list[Folder]] = {}
        for folder in folders:
            by_parent.setdefault(folder.parent_id, []).append(folder)

        result: list[Folder] = []

        def walk(parent_id: UUID) -> None:
            for child in by_parent.get(parent_id, []):
                result.append(child)
                walk(child.id)

        walk(folder_id)
        return result
