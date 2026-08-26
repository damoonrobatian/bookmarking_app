from uuid import UUID

from fastapi import APIRouter, Depends, Response, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.schemas import FolderCreate, FolderMove, FolderRead, FolderUpdate
from app.services.folder import FolderService

router = APIRouter(prefix="/folders", tags=["folders"])


@router.get("", response_model=list[FolderRead])
def list_folders(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> list[FolderRead]:
    return [FolderRead.model_validate(item) for item in FolderService(db).list_folders(user)]


@router.post("", response_model=FolderRead, status_code=status.HTTP_201_CREATED)
def create_folder(
    payload: FolderCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> FolderRead:
    folder = FolderService(db).create(user, payload.name, payload.parent_id)
    return FolderRead.model_validate(folder)


@router.patch("/{folder_id}", response_model=FolderRead)
def update_folder(
    folder_id: UUID,
    payload: FolderUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> FolderRead:
    folder = FolderService(db).update(user, folder_id, payload.name, payload.position)
    return FolderRead.model_validate(folder)


@router.delete("/{folder_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_folder(
    folder_id: UUID,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> Response:
    FolderService(db).delete(user, folder_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post("/{folder_id}/move", response_model=FolderRead)
def move_folder(
    folder_id: UUID,
    payload: FolderMove,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> FolderRead:
    folder = FolderService(db).move(user, folder_id, payload.parent_id)
    return FolderRead.model_validate(folder)
