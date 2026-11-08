from sqlalchemy.orm import Session

from app.core.security import get_password_hash
from app.db.models import User


def normalize_email(email: str) -> str:
    return email.strip().lower()


def get_user_by_email(db: Session, email: str) -> User | None:
    return db.query(User).filter(User.email == normalize_email(email)).first()


def create_user(db: Session, email: str, password: str, language: str = "en") -> User:
    email_norm = normalize_email(email)
    hashed = get_password_hash(password)
    user = User(email=email_norm, hashed_password=hashed, language=language)
    db.add(user)
    db.commit()
    db.refresh(user)
    return user
