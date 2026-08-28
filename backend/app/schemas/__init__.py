from datetime import datetime
from typing import Any, Generic, Literal, TypeVar
from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr, Field

T = TypeVar("T")

ThemeId = Literal["terracotta", "gray", "teal", "green", "purple", "blue"]
DEFAULT_THEME: ThemeId = "terracotta"


class APIError(BaseModel):
    code: str
    message: str
    details: dict[str, Any] | None = None


class Paginated(BaseModel, Generic[T]):
    items: list[T]
    page: int
    page_size: int
    total: int


class UserRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    email: EmailStr
    display_name: str
    theme: ThemeId = DEFAULT_THEME
    created_at: datetime
    last_login_at: datetime | None = None


class ThemeUpdate(BaseModel):
    theme: ThemeId


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    display_name: str = Field(min_length=1, max_length=120)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str
    remember_me: bool = False


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str = Field(min_length=8, max_length=128)


class DeleteAccountRequest(BaseModel):
    password: str


class TagRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    created_at: datetime


class TagCreate(BaseModel):
    name: str = Field(min_length=1, max_length=80)


class TagUpdate(BaseModel):
    name: str = Field(min_length=1, max_length=80)


class FolderTagRead(BaseModel):
    id: UUID
    name: str
    bookmark_count: int


class FolderTagGroup(BaseModel):
    folder_id: UUID | None
    folder_name: str
    tags: list[FolderTagRead]


class FolderRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    parent_id: UUID | None
    name: str
    position: int
    created_at: datetime
    updated_at: datetime


class FolderCreate(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    parent_id: UUID | None = None


class FolderUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=200)
    position: int | None = None


class FolderMove(BaseModel):
    parent_id: UUID | None = None


class BookmarkRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    folder_id: UUID | None
    url: str
    normalized_url: str
    title: str
    description: str | None
    notes: str | None
    favicon_url: str | None
    page_domain: str | None
    metadata_status: str
    is_favorite: bool
    is_archived: bool
    visit_count: int
    last_visited_at: datetime | None
    created_at: datetime
    updated_at: datetime
    tags: list[TagRead] = []
    folder: FolderRead | None = None


class BookmarkCreate(BaseModel):
    url: str = Field(min_length=1, max_length=2048)
    title: str | None = Field(default=None, max_length=500)
    description: str | None = None
    notes: str | None = None
    folder_id: UUID | None = None
    tags: list[str] = []
    is_favorite: bool = False
    fetch_metadata: bool = True


class BookmarkUpdate(BaseModel):
    url: str | None = Field(default=None, min_length=1, max_length=2048)
    title: str | None = Field(default=None, max_length=500)
    description: str | None = None
    notes: str | None = None
    folder_id: UUID | None = None
    tags: list[str] | None = None
    is_favorite: bool | None = None
    fetch_metadata: bool = False


class BookmarkPreviewRequest(BaseModel):
    url: str = Field(min_length=1, max_length=2048)


class BookmarkPreview(BaseModel):
    url: str
    title: str | None
    description: str | None
    favicon_url: str | None
    page_domain: str | None
    metadata_status: str
    suggested_tags: list[str] = []


class DuplicateBookmark(BaseModel):
    code: str = "duplicate"
    message: str
    existing: BookmarkRead


class ImportReport(BaseModel):
    bookmarks_imported: int
    folders_created: int
    duplicates_detected: int
    invalid_entries_skipped: int
