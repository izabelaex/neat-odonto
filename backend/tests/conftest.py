"""Isolamento antes de importar a aplicação: sem banco, uploads ou chaves reais."""
import os

from cryptography.fernet import Fernet

for key, value in {
    "DATABASE_URL": "sqlite://", "UPLOAD_DIR": "unused-test-uploads",
    "SECRET_KEY": "test-only-secret-key-not-for-production",
    "ACCESS_TOKEN_EXPIRE_MINUTES": "480", "COOKIE_SECURE": "false",
    "FRONTEND_URL": "http://testserver", "GOOGLE_CLIENT_ID": "test-client",
    "GOOGLE_CLIENT_SECRET": "test-secret", "GOOGLE_TOKEN_KEY": Fernet.generate_key().decode(),
    "GOOGLE_REDIRECT_URI": "http://testserver/auth/google/callback",
    "ALLOWED_GOOGLE_EMAILS": "dentist@example.test", "ALLOWED_GOOGLE_EMAIL": "",
    "GOOGLE_CALENDAR_ID": "primary", "GOOGLE_CALENDAR_EMBED_URL": "",
}.items():
    os.environ[key] = value

import httpx
import pytest
from datetime import timedelta
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker
from app import database
from app.auth.sessions import COOKIE, session_hash, utc_now
from app.config import settings
from app.main import app
from app.models import AuthSession, Paciente, Usuario


@pytest.fixture(autouse=True)
def no_external_http(monkeypatch):
    def blocked(*args, **kwargs):
        raise AssertionError("HTTP externo deve ser simulado nos testes")
    monkeypatch.setattr(httpx.HTTPTransport, "handle_request", blocked)
    monkeypatch.setattr(httpx.AsyncHTTPTransport, "handle_async_request", blocked)


@pytest.fixture
def db(tmp_path, monkeypatch):
    engine = create_engine(f"sqlite:///{tmp_path / 'test.db'}",
                           connect_args={"check_same_thread": False})
    @event.listens_for(engine, "connect")
    def enable_foreign_keys(connection, record):
        connection.execute("PRAGMA foreign_keys=ON")
    database.Base.metadata.create_all(engine)
    factory = sessionmaker(bind=engine)
    monkeypatch.setattr(database, "SessionLocal", factory)
    monkeypatch.setattr(settings, "upload_dir", str(tmp_path / "uploads"))
    with factory() as session:
        yield session
    engine.dispose()


@pytest.fixture
def client(db):
    with TestClient(app, follow_redirects=False) as browser:
        yield browser


@pytest.fixture
def user(db):
    account = Usuario(nome="Test Dentist", email="dentist@example.test", google_subject="subject-test")
    db.add(account)
    db.commit()
    return account


@pytest.fixture
def authenticated(client, db, user):
    db.add(AuthSession(token_hash=session_hash("test-session"), user_id=user.id,
                       expires_at=utc_now() + timedelta(hours=1)))
    db.commit()
    client.cookies.set(COOKIE, "test-session")
    client.headers["Origin"] = settings.frontend_url
    return client


@pytest.fixture
def patient(db):
    item = Paciente(nome="Paciente Ficticio")
    db.add(item)
    db.commit()
    return item
