from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.folder import Folder
from app.models.user import User
from app.repositories.bookmark import BookmarkRepository
from app.repositories.folder import FolderRepository


class FolderService:
    def __init__(self, db: Session) -> None:
        self.folders = FolderRepository(db)
        self.bookmarks = BookmarkRepository(db)

    def list_folders(self, user: User) -> list[Folder]:
        return self.folders.list_for_user(user.id)

    def create(self, user: User, name: str, parent_id: UUID | None) -> Folder:
        parent = self._require_parent(user.id, parent_id)
        clean_name = name.strip()
        if self.folders.sibling_with_name(user.id, parent_id, clean_name):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="A Folder With This Name Already Exists Here.",
            )
        folder = Folder(
            user_id=user.id,
            parent_id=parent.id if parent else None,
            name=clean_name,
            position=self.folders.next_position(user.id, parent_id),
        )
        return self.folders.add(folder)

    def update(self, user: User, folder_id: UUID, name: str | None, position: int | None) -> Folder:
        folder = self._require(user.id, folder_id)
        if name is not None:
            clean_name = name.strip()
            sibling = self.folders.sibling_with_name(user.id, folder.parent_id, clean_name, exclude_id=folder.id)
            if sibling:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="A Folder With This Name Already Exists Here.",
                )
            folder.name = clean_name
        if position is not None:
            folder.position = position
        return folder

    def move(self, user: User, folder_id: UUID, parent_id: UUID | None) -> Folder:
        folder = self._require(user.id, folder_id)
        if parent_id == folder.id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A Folder Cannot Be Moved Into Itself.",
            )
        parent = self._require_parent(user.id, parent_id)
        if parent_id is not None:
            descendants = {item.id for item in self.folders.descendants(user.id, folder.id)}
            if parent_id in descendants:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="A Folder Cannot Be Moved Into One Of Its Descendants.",
                )
        if self.folders.sibling_with_name(user.id, parent_id, folder.name, exclude_id=folder.id):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="A Folder With This Name Already Exists There.",
            )
        folder.parent_id = parent.id if parent else None
        folder.position = self.folders.next_position(user.id, folder.parent_id)
        return folder

    def delete(self, user: User, folder_id: UUID) -> None:
        folder = self._require(user.id, folder_id)
        destination = folder.parent_id
        children = [item for item in self.folders.list_for_user(user.id) if item.parent_id == folder.id]
        for child in children:
            child.parent_id = destination
        self.bookmarks.move_folder_contents(user.id, folder.id, destination)
        self.folders.db.flush()
        self.folders.delete(folder)

    def _require(self, user_id: UUID, folder_id: UUID) -> Folder:
        folder = self.folders.get(user_id, folder_id)
        if folder is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Folder Not Found.")
        return folder

    def _require_parent(self, user_id: UUID, parent_id: UUID | None) -> Folder | None:
        if parent_id is None:
            return None
        return self._require(user_id, parent_id)
