from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from sqlalchemy.orm import Session

from app.core.deps import get_current_user, resolve_language
from app.core.i18n import translate
from app.crud import tasks as crud_tasks
from app.db.database import get_db
from app.db.models import User
from app.schemas.task import TaskCounts, TaskCreate, TaskRead, TaskUpdate

router = APIRouter(prefix="/tasks", tags=["tasks"])


@router.post("", response_model=TaskRead, status_code=status.HTTP_201_CREATED)
def create_task(
    payload: TaskCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    task = crud_tasks.create_task(db, user_id=current_user.id, data=payload)
    return task


@router.get("/today", response_model=list[TaskRead])
def list_today_tasks(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return crud_tasks.get_today_tasks(db, user_id=current_user.id)


@router.get("/counts", response_model=TaskCounts)
def task_counts(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return crud_tasks.get_task_counts(db, user_id=current_user.id)


@router.get("", response_model=list[TaskRead])
def list_tasks(
    status: str | None = Query(default=None, pattern=r"^(todo|in_progress|done)$"),
    priority: str | None = Query(default=None, pattern=r"^(low|medium|high)$"),
    q: str | None = Query(default=None),
    overdue: bool | None = Query(default=None),
    sort: str | None = Query(default="created_at", pattern=r"^(created_at|due_date|priority)$"),
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=200),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    tasks = crud_tasks.get_user_tasks(
        db,
        user_id=current_user.id,
        status=status,
        priority=priority,
        q=q,
        overdue=overdue,
        sort=sort,
        skip=skip,
        limit=limit,
    )
    return tasks


@router.get("/{task_id}", response_model=TaskRead)
def get_task(
    task_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    lang = resolve_language(request, current_user)
    task = crud_tasks.get_task_by_id_for_user(db, task_id, current_user.id)
    if not task:
        raise HTTPException(
            status_code=404,
            detail={"code": "task_not_found", "message": translate(lang, "task_not_found")},
        )
    return task


@router.patch("/{task_id}", response_model=TaskRead)
def update_task(
    task_id: int,
    payload: TaskUpdate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    lang = resolve_language(request, current_user)
    task = crud_tasks.get_task_by_id_for_user(db, task_id, current_user.id)
    if not task:
        raise HTTPException(
            status_code=404,
            detail={"code": "task_not_found", "message": translate(lang, "task_not_found")},
        )
    task = crud_tasks.update_task(db, task, payload)
    return task


@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_task(
    task_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    lang = resolve_language(request, current_user)
    task = crud_tasks.get_task_by_id_for_user(db, task_id, current_user.id)
    if not task:
        raise HTTPException(
            status_code=404,
            detail={"code": "task_not_found", "message": translate(lang, "task_not_found")},
        )
    crud_tasks.delete_task(db, task)
    return None
