from datetime import date

from sqlalchemy.orm import Session

from app.db.models import Task


def create_task(db: Session, user_id: int, data) -> Task:
    task = Task(
        user_id=user_id,
        title=data.title.strip(),
        description=data.description,
        status=data.status,
        priority=data.priority,
        due_date=data.due_date,
    )
    db.add(task)
    db.commit()
    db.refresh(task)
    return task


def get_user_tasks(
    db: Session,
    user_id: int,
    status: str | None = None,
    priority: str | None = None,
    q: str | None = None,
    overdue: bool | None = None,
    sort: str | None = "created_at",
    skip: int = 0,
    limit: int = 100,
):
    query = db.query(Task).filter(Task.user_id == user_id)

    if status:
        query = query.filter(Task.status == status)
    if priority:
        query = query.filter(Task.priority == priority)
    if q:
        like = f"%{q}%"
        query = query.filter((Task.title.ilike(like)) | (Task.description.ilike(like)))
    if overdue:
        today = date.today()
        query = query.filter(Task.due_date < today, Task.status != "done")

    if sort == "priority":
        from sqlalchemy import case

        order = case(
            (Task.priority == "high", 0),
            (Task.priority == "medium", 1),
            (Task.priority == "low", 2),
            else_=3,
        )
        query = query.order_by(order, Task.created_at.desc())
    elif sort == "due_date":
        query = query.order_by(Task.due_date.asc(), Task.created_at.desc())
    else:
        query = query.order_by(Task.created_at.desc())

    return query.offset(skip).limit(limit).all()


def get_task_by_id_for_user(db: Session, task_id: int, user_id: int) -> Task | None:
    return db.query(Task).filter(Task.id == task_id, Task.user_id == user_id).first()


def get_today_tasks(db: Session, user_id: int):
    from datetime import date, timedelta

    today = date.today()
    tomorrow = today + timedelta(days=1)
    return (
        db.query(Task)
        .filter(
            Task.user_id == user_id,
            Task.due_date.isnot(None),
            Task.status != "done",
            Task.due_date <= tomorrow,
        )
        .order_by(Task.due_date.asc())
        .all()
    )


def get_task_counts(db: Session, user_id: int) -> dict:
    """Sidebar counters.

    ``today`` intentionally includes overdue active tasks (Todoist-style):
    anything that needs attention today or earlier.
    """
    today = date.today()
    base = db.query(Task).filter(Task.user_id == user_id)
    active = base.filter(Task.status != "done")

    return {
        "all": base.count(),
        "today": active.filter(
            Task.due_date.isnot(None), Task.due_date <= today
        ).count(),
        "upcoming": active.filter(
            Task.due_date.isnot(None), Task.due_date > today
        ).count(),
        "overdue": active.filter(
            Task.due_date.isnot(None), Task.due_date < today
        ).count(),
        "completed": base.filter(Task.status == "done").count(),
    }


def update_task(db: Session, task: Task, data) -> Task:
    if data.title is not None:
        task.title = data.title.strip()
    if data.description is not None:
        task.description = data.description
    if data.status is not None:
        task.status = data.status
    if data.priority is not None:
        task.priority = data.priority
    if data.due_date is not None:
        task.due_date = data.due_date
    db.commit()
    db.refresh(task)
    return task


def delete_task(db: Session, task: Task):
    db.delete(task)
    db.commit()
