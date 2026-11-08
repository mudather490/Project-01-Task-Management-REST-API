import os

os.environ["DATABASE_URL"] = "sqlite:///./test_model.db"

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.db.database import Base
from app.db.models import Task, TaskPriority, TaskStatus, User


TEST_DATABASE_URL = "sqlite:///./test_model.db"

engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
)

TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base.metadata.drop_all(bind=engine)
Base.metadata.create_all(bind=engine)

db = TestingSessionLocal()

user = User(email="test@example.com", hashed_password="hashed")
db.add(user)
db.commit()
db.refresh(user)

assert user.id is not None
assert user.language == "en"
assert user.created_at is not None

task = Task(user_id=user.id, title="My first task")
db.add(task)
db.commit()
db.refresh(task)

assert task.status == TaskStatus.TODO
assert task.priority == TaskPriority.MEDIUM
assert task.due_date is None

# check ownership isolation
found = db.query(Task).filter(Task.user_id == user.id).all()
assert len(found) == 1

# check CASCADE delete
db.delete(user)
db.commit()

remaining = db.query(Task).count()
assert remaining == 0

db.close()
Base.metadata.drop_all(bind=engine)
engine.dispose()

import time
time.sleep(0.2)

if os.path.exists("test_model.db"):
    try:
        os.remove("test_model.db")
    except PermissionError:
        pass

print("All model tests passed")
