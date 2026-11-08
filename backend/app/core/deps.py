from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.core.i18n import translate
from app.core.security import decode_token
from app.db.database import get_db
from app.db.models import User

security = HTTPBearer(auto_error=False)


def get_user_language(request: Request) -> str:
    if request is None:
        return "en"
    accept = request.headers.get("accept-language") or ""
    lang = accept.split(",")[0].split("-")[0].strip().lower()
    if lang in {"en", "ar"}:
        return lang
    return "en"


def resolve_language(request: Request, user=None) -> str:
    """
    Priority:
    1. Accept-Language header
    2. users.language (user setting)
    3. Default en
    """
    header_lang = get_user_language(request)
    if header_lang != "en" or (request.headers.get("accept-language") is not None):
        # Header supplied (even if en, respect it as explicit)
        return header_lang
    if user is not None and getattr(user, "language", None):
        return user.language
    return header_lang


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(security),
    db: Session = Depends(get_db),
    request: Request = None,
) -> User:
    lang = get_user_language(request) if request else "en"
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": "invalid_token", "message": translate(lang, "invalid_token")},
            headers={"WWW-Authenticate": "Bearer"},
        )
    payload = decode_token(credentials.credentials)
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": "invalid_token", "message": translate(lang, "invalid_token")},
            headers={"WWW-Authenticate": "Bearer"},
        )
    user_id = payload.get("sub")
    if user_id is not None:
        try:
            user_id = int(user_id)
        except (TypeError, ValueError):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail={"code": "invalid_token", "message": translate(lang, "invalid_token")},
                headers={"WWW-Authenticate": "Bearer"},
            )
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": "invalid_token", "message": translate(lang, "invalid_token")},
            headers={"WWW-Authenticate": "Bearer"},
        )
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "user_not_found", "message": translate(user.language if hasattr(user, "language") else lang, "user_not_found")},
        )
    return user
