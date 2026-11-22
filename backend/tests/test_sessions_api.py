"""Exercita o cookie e a autenticação reais, sem sobrescrever get_current_user."""
from datetime import timedelta
import pytest
from app.auth.sessions import COOKIE, session_hash, utc_now
from app.config import settings
from app.models import AuthSession


@pytest.mark.parametrize('url', ['/pacientes', '/consultas', '/agenda/eventos',
    '/pacientes/1/planos-tratamento', '/pacientes/1/documentos/1/arquivo'])
def test_private_routes_require_session(client, url):
    assert client.get(url).status_code == 401


def test_valid_session_and_logout(authenticated, db, user):
    response = authenticated.get('/auth/me')
    assert response.json()['email'] == user.email
    assert response.headers['cache-control'] == 'no-store'
    assert response.headers['referrer-policy'] == 'no-referrer'
    assert authenticated.post('/auth/logout').status_code == 204
    assert db.query(AuthSession).count() == 0
    assert authenticated.get('/auth/me').status_code == 401
    authenticated.cookies.set(COOKIE, 'test-session')
    assert authenticated.get('/auth/me').status_code == 401


def test_expired_session(authenticated, db):
    session = db.get(AuthSession, session_hash('test-session'))
    session.expires_at = utc_now() - timedelta(seconds=1)
    db.commit()
    assert authenticated.get('/auth/me').status_code == 401


def test_removed_allowlist_account(authenticated, monkeypatch):
    monkeypatch.setattr(settings, 'allowed_google_emails', 'other@example.test')
    assert authenticated.get('/auth/me').status_code == 401


@pytest.mark.parametrize('origin', [None, 'https://untrusted.example.test'])
def test_writes_reject_missing_or_foreign_origin(authenticated, origin):
    authenticated.headers.pop('origin')
    if origin:
        authenticated.headers['origin'] = origin
    assert authenticated.post('/pacientes', json={'nome': 'Paciente Ficticio'}).status_code == 403
    assert authenticated.get('/pacientes').json() == []


def test_unknown_cookie(client):
    client.cookies.set(COOKIE, 'unknown-session')
    assert client.get('/auth/me').status_code == 401
