from datetime import date, datetime

from pydantic import BaseModel, Field


class TaskCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    description: str | None = Field(default=None, max_length=5000)
    status: str = Field(default="todo", pattern=r"^(todo|in_progress|done)$")
    priority: str = Field(default="medium", pattern=r"^(low|medium|high)$")
    due_date: date | None = None


class TaskUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=200)
    description: str | None = Field(default=None, max_length=5000)
    status: str | None = Field(default=None, pattern=r"^(todo|in_progress|done)$")
    priority: str | None = Field(default=None, pattern=r"^(low|medium|high)$")
    due_date: date | None = None


class TaskRead(BaseModel):
    id: int
    user_id: int
    title: str
    description: str | None
    status: str
    priority: str
    due_date: date | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class TaskCounts(BaseModel):
    all: int
    today: int
    upcoming: int
    overdue: int
    completed: int
