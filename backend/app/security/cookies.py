from fastapi import Response

from app.config import get_settings

ACCESS_COOKIE = "access_token"
REFRESH_COOKIE = "refresh_token"


def _expire_auth_cookies(response: Response, *, secure: bool) -> None:
    response.delete_cookie(ACCESS_COOKIE, path="/", secure=secure, httponly=True, samesite="lax")
    response.delete_cookie(REFRESH_COOKIE, path="/api/auth", secure=secure, httponly=True, samesite="lax")


def set_auth_cookies(
    response: Response,
    access_token: str,
    refresh_token: str,
    *,
    remember: bool = True,
) -> None:
    settings = get_settings()
    secure = settings.cookie_secure_flag
    if secure:
        # HTTP cookies from :8080 share this host and can shadow the Secure ones.
        _expire_auth_cookies(response, secure=False)
    access_max_age = settings.access_token_expire_minutes * 60 if remember else None
    refresh_max_age = settings.refresh_token_expire_days * 24 * 60 * 60 if remember else None
    response.set_cookie(
        key=ACCESS_COOKIE,
        value=access_token,
        httponly=True,
        secure=secure,
        samesite="lax",
        max_age=access_max_age,
        path="/",
    )
    response.set_cookie(
        key=REFRESH_COOKIE,
        value=refresh_token,
        httponly=True,
        secure=secure,
        samesite="lax",
        max_age=refresh_max_age,
        path="/api/auth",
    )


def clear_auth_cookies(response: Response) -> None:
    settings = get_settings()
    _expire_auth_cookies(response, secure=settings.cookie_secure_flag)
    if settings.cookie_secure_flag:
        _expire_auth_cookies(response, secure=False)
