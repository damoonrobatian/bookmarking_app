from uuid import UUID

from fastapi import APIRouter, Cookie, Depends, HTTPException, Request, Response, status
from jwt import InvalidTokenError
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.rate_limit import limiter
from app.repositories.user import UserRepository
from app.schemas import ChangePasswordRequest, DeleteAccountRequest, LoginRequest, RegisterRequest, UserRead
from app.security.cookies import REFRESH_COOKIE, clear_auth_cookies, set_auth_cookies
from app.security.tokens import decode_token
from app.services.auth import AuthService

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=UserRead, status_code=status.HTTP_201_CREATED)
@limiter.limit("5/minute")
def register(
    payload: RegisterRequest,
    response: Response,
    request: Request,
    db: Session = Depends(get_db),
) -> User:
    service = AuthService(db)
    user = service.register(payload.email, payload.password, payload.display_name)
    access, refresh = service.issue_tokens(user, remember=True)
    set_auth_cookies(response, access, refresh, remember=True)
    return user


@router.post("/login", response_model=UserRead)
@limiter.limit("5/minute")
def login(
    payload: LoginRequest,
    response: Response,
    request: Request,
    db: Session = Depends(get_db),
) -> User:
    service = AuthService(db)
    user = service.authenticate(payload.email, payload.password)
    access, refresh = service.issue_tokens(user, remember=payload.remember_me)
    set_auth_cookies(response, access, refresh, remember=payload.remember_me)
    return user


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout(response: Response) -> None:
    clear_auth_cookies(response)


@router.get("/me", response_model=UserRead)
def me(user: User = Depends(get_current_user)) -> User:
    return user


@router.post("/refresh", response_model=UserRead)
def refresh(
    response: Response,
    refresh_token: str | None = Cookie(default=None, alias=REFRESH_COOKIE),
    db: Session = Depends(get_db),
) -> User:
    if not refresh_token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Session expired.")
    try:
        payload = decode_token(refresh_token, "refresh")
    except InvalidTokenError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Session expired.") from exc
    user = UserRepository(db).get_by_id(UUID(str(payload["sub"])))
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Session expired.")
    remember = bool(payload.get("remember", True))
    access, new_refresh = AuthService(db).issue_tokens(user, remember=remember)
    set_auth_cookies(response, access, new_refresh, remember=remember)
    return user


@router.post("/password", status_code=status.HTTP_204_NO_CONTENT)
@limiter.limit("5/minute")
def change_password(
    payload: ChangePasswordRequest,
    request: Request,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> None:
    AuthService(db).change_password(user, payload.current_password, payload.new_password)


@router.delete("/account", status_code=status.HTTP_204_NO_CONTENT)
@limiter.limit("5/minute")
def delete_account(
    payload: DeleteAccountRequest,
    response: Response,
    request: Request,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> None:
    AuthService(db).delete_account(user, payload.password)
    clear_auth_cookies(response)
