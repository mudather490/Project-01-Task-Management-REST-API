from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.i18n import translate
from app.db.database import get_db

router = APIRouter(tags=["health"])


def _lang(request: Request) -> str:
    return request.headers.get("accept-language", "en").split("-")[0].lower()


@router.get("/health")
def health_check():
    return {
        "status": "ok",
        "app": settings.APP_NAME,
        "debug": settings.DEBUG,
    }


@router.get("/ready")
def readiness(request: Request, db: Session = Depends(get_db)):
    """DB-backed readiness: 200 when Postgres answers, else 503 (bilingual)."""
    try:
        db.execute(text("SELECT 1"))
    except SQLAlchemyError:
        db.rollback()
        raise HTTPException(
            status_code=503,
            detail={
                "code": "db_unreachable",
                "message": translate(_lang(request), "db_unreachable"),
            },
        )
    return {"status": "ready", "database": "ok"}
