from sqlalchemy.orm import Session

from app.models.user import User
from app.services.auth import AuthService
from app.services.bookmark import BookmarkService, DuplicateBookmarkError
from app.services.folder import FolderService

SEED_FOLDERS = ["Research", "Work", "Programming", "Personal"]
SEED_BOOKMARKS = [
    ("https://fastapi.tiangolo.com/", "FastAPI documentation", "Programming"),
    ("https://www.postgresql.org/docs/", "PostgreSQL documentation", "Work"),
    ("https://react.dev/", "React documentation", "Programming"),
]


def seed_database(db: Session, email: str = "demo@example.com", password: str = "demopassword") -> User:
    auth = AuthService(db)
    existing = auth.users.get_by_email(email)
    if existing:
        return existing
    user = auth.register(email, password, "Demo User")
    folders = FolderService(db)
    created = {name: folders.create(user, name, None) for name in SEED_FOLDERS}
    bookmarks = BookmarkService(db)
    for url, title, folder_name in SEED_BOOKMARKS:
        try:
            bookmarks.create(
                user,
                url=url,
                title=title,
                description=None,
                notes=None,
                folder_id=created[folder_name].id,
                tags=["docs"],
                is_favorite=False,
                fetch_metadata=False,
            )
        except DuplicateBookmarkError:
            continue
    return user


if __name__ == "__main__":
    from app.database import SessionLocal

    session = SessionLocal()
    try:
        seed_database(session)
        session.commit()
        print("Seeded demo user demo@example.com / demopassword")
    finally:
        session.close()
