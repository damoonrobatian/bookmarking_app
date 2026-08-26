from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.user import User
from app.repositories.user import UserRepository
from app.security.passwords import hash_password, verify_password
from app.security.tokens import create_token
from app.utils.time import utcnow


class AuthService:
    def __init__(self, db: Session) -> None:
        self.users = UserRepository(db)

    def register(self, email: str, password: str, display_name: str) -> User:
        existing = self.users.get_by_email(email)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="An account with this email already exists.",
            )
        user = User(
            email=email.lower(),
            password_hash=hash_password(password),
            display_name=display_name.strip(),
        )
        return self.users.add(user)

    def authenticate(self, email: str, password: str) -> User:
        user = self.users.get_by_email(email)
        if user is None or not verify_password(password, user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password.",
            )
        user.last_login_at = utcnow()
        return user

    def issue_tokens(self, user: User) -> tuple[str, str]:
        return create_token(user.id, "access"), create_token(user.id, "refresh")
