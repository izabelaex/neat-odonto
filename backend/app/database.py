"""Conexão com o banco e sessão do SQLAlchemy.

Desenvolvimento usa SQLite; produção usa PostgreSQL. A troca é feita apenas
pela variável DATABASE_URL — nenhum código de aplicação muda.
"""

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

from app.config import settings

connect_args = {"check_same_thread": False} if settings.database_url.startswith("sqlite") else {}

engine = create_engine(settings.database_url, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


def get_db():
    """Dependência do FastAPI: abre uma sessão por requisição e fecha ao final."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
