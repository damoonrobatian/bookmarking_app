from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from fastapi.responses import PlainTextResponse
from sqlalchemy.orm import Session

from app.config import get_settings
from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.schemas import ImportReport
from app.services.import_export import ImportExportService

router = APIRouter(tags=["import-export"])


@router.post("/import/bookmarks", response_model=ImportReport)
async def import_bookmarks(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> ImportReport:
    settings = get_settings()
    content_type = (file.content_type or "").lower()
    filename = (file.filename or "").lower()
    if content_type not in {"text/html", "application/octet-stream", "text/plain", ""} and not filename.endswith(
        (".html", ".htm")
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid Bookmark File. Please Upload A Netscape HTML Export.",
        )
    raw = await file.read(settings.import_max_bytes + 1)
    if len(raw) > settings.import_max_bytes:
        raise HTTPException(
            status_code=status.HTTP_413_CONTENT_TOO_LARGE,
            detail="Import File Is Too Large.",
        )
    try:
        text = raw.decode("utf-8")
    except UnicodeDecodeError:
        text = raw.decode("latin-1", errors="replace")
    report = ImportExportService(db).import_netscape(user, text)
    return ImportReport(
        bookmarks_imported=report.bookmarks_imported,
        folders_created=report.folders_created,
        duplicates_detected=report.duplicates_detected,
        invalid_entries_skipped=report.invalid_entries_skipped,
    )


@router.get("/export/bookmarks")
def export_bookmarks(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> PlainTextResponse:
    content = ImportExportService(db).export_netscape(user)
    return PlainTextResponse(
        content,
        media_type="text/html; charset=utf-8",
        headers={"Content-Disposition": 'attachment; filename="bookmarks.html"'},
    )
