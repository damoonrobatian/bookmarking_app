from fastapi import APIRouter

from app.api.auth import router as auth_router
from app.api.bookmarks import router as bookmarks_router
from app.api.folders import router as folders_router
from app.api.import_export import router as import_export_router
from app.api.tags import router as tags_router

api_router = APIRouter()
api_router.include_router(auth_router)
api_router.include_router(bookmarks_router)
api_router.include_router(folders_router)
api_router.include_router(tags_router)
api_router.include_router(import_export_router)
