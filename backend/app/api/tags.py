from uuid import UUID

from fastapi import APIRouter, Depends, Response, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.schemas import FolderTagGroup, TagCreate, TagRead, TagUpdate
from app.services.tag import TagService

router = APIRouter(prefix="/tags", tags=["tags"])


@router.get("", response_model=list[TagRead])
def list_tags(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> list[TagRead]:
    return [TagRead.model_validate(item) for item in TagService(db).list_tags(user)]


@router.get("/grouped", response_model=list[FolderTagGroup])
def list_tags_grouped(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> list[FolderTagGroup]:
    return TagService(db).list_grouped_by_folder(user)


@router.post("", response_model=TagRead, status_code=status.HTTP_201_CREATED)
def create_tag(
    payload: TagCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> TagRead:
    return TagRead.model_validate(TagService(db).create(user, payload.name))


@router.patch("/{tag_id}", response_model=TagRead)
def update_tag(
    tag_id: UUID,
    payload: TagUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> TagRead:
    return TagRead.model_validate(TagService(db).update(user, tag_id, payload.name))


@router.delete("/{tag_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_tag(
    tag_id: UUID,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> Response:
    TagService(db).delete(user, tag_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
