from uuid import UUID

from fastapi import Cookie, Depends, HTTPException, status
from jwt import InvalidTokenError
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.repositories.user import UserRepository
from app.security.cookies import ACCESS_COOKIE
from app.security.tokens import decode_token


def get_current_user(
    access_token: str | None = Cookie(default=None, alias=ACCESS_COOKIE),
    db: Session = Depends(get_db),
) -> User:
    if not access_token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated.")
    try:
        payload = decode_token(access_token, "access")
        user_id = payload.get("sub")
    except InvalidTokenError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Session expired.") from exc
    user = UserRepository(db).get_by_id(UUID(str(user_id)))
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated.")
    return user
