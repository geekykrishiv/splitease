from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# Allow DATABASE_URL to be overridden via environment variable (e.g., on Render with a mounted disk)
_default_db = f"sqlite:///{os.path.join(BASE_DIR, 'splitwise.db')}"
DATABASE_URL = os.environ.get("DATABASE_URL", _default_db)

# SQLite requires check_same_thread=False; other DBs don't need it
_connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}
engine = create_engine(DATABASE_URL, connect_args=_connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
