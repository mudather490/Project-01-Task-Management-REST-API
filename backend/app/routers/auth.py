from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.core.i18n import translate
from app.core.security import create_access_token, verify_password
from app.crud.users import create_user, get_user_by_email, normalize_email
from app.db.database import get_db
from app.schemas.auth import TokenResponse
from app.schemas.user import UserCreate, UserRead

router = APIRouter(prefix="/auth", tags=["auth"])


def get_lang(request: Request) -> str:
    return request.headers.get("accept-language", "en").split("-")[0].lower()


@router.post("/register", response_model=UserRead, status_code=status.HTTP_201_CREATED)
def register(payload: UserCreate, request: Request, db: Session = Depends(get_db)):
    lang = get_lang(request)
    email = normalize_email(payload.email)
    existing = get_user_by_email(db, email)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "code": "email_already_registered",
                "message": translate(lang, "email_already_registered"),
            },
        )
    user = create_user(db, email=email, password=payload.password, language=payload.language)
    return user


@router.post("/login", response_model=TokenResponse)
def login(payload: UserCreate, request: Request, db: Session = Depends(get_db)):
    lang = get_lang(request)
    email = normalize_email(payload.email)
    user = get_user_by_email(db, email)
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "code": "invalid_credentials",
                "message": translate(lang, "invalid_credentials"),
            },
        )
    token = create_access_token({"sub": str(user.id)})
    return TokenResponse(access_token=token)
