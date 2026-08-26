from datetime import UTC, datetime, timedelta
from typing import Any, Literal
from uuid import UUID

import jwt

from app.config import get_settings

TokenType = Literal["access", "refresh"]


def _now() -> datetime:
    return datetime.now(UTC)


def create_token(user_id: UUID, token_type: TokenType) -> str:
    settings = get_settings()
    if token_type == "access":
        expires = timedelta(minutes=settings.access_token_expire_minutes)
    else:
        expires = timedelta(days=settings.refresh_token_expire_days)
    payload = {
        "sub": str(user_id),
        "type": token_type,
        "iat": _now(),
        "exp": _now() + expires,
    }
    return jwt.encode(payload, settings.secret_key, algorithm="HS256")


def decode_token(token: str, expected_type: TokenType) -> dict[str, Any]:
    settings = get_settings()
    payload = jwt.decode(token, settings.secret_key, algorithms=["HS256"])
    if payload.get("type") != expected_type:
        raise jwt.InvalidTokenError("Unexpected token type.")
    return payload
