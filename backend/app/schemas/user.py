from pydantic import BaseModel, Field

from app.core.i18n import translate


class UserCreate(BaseModel):
    email: str = Field(..., min_length=3, max_length=255)
    password: str = Field(..., min_length=6, max_length=128)
    language: str = Field(default="en", pattern=r"^(en|ar)$")


class UserRead(BaseModel):
    id: int
    email: str
    language: str

    model_config = {"from_attributes": True}


class UserUpdate(BaseModel):
    language: str = Field(..., pattern=r"^(en|ar)$")
