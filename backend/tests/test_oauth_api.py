"""Contrato do callback: simula Authlib; não testa assinatura de tokens Google."""
from unittest.mock import AsyncMock
import pytest
from authlib.integrations.base_client.errors import OAuthError
from starlette.responses import RedirectResponse
from app.auth.google import oauth, CALENDAR_SCOPE, token_cipher
from app.config import settings
from app.models import AuthSession, Usuario


@pytest.fixture
def provider(monkeypatch):
    token = AsyncMock(return_value={'userinfo': {'email': 'dentist@example.test',
        'email_verified': True, 'sub': 'subject-test', 'name': 'Test Dentist'}})
    redirect = AsyncMock(return_value=RedirectResponse('https://accounts.example.test'))
    monkeypatch.setattr(oauth.google, 'authorize_access_token', token)
    monkeypatch.setattr(oauth.google, 'authorize_redirect', redirect)
    return token, redirect


def test_login_callback_creates_revocable_cookie(client, db, provider):
    assert client.get('/auth/google/login').status_code == 307
    response = client.get('/auth/google/callback')
    assert response.status_code == 303
    assert response.headers['location'] == 'http://testserver/agenda'
    cookie = response.headers['set-cookie'].lower()
    assert 'httponly' in cookie and 'samesite=lax' in cookie
    assert client.get('/auth/me').json()['email'] == 'dentist@example.test'
    assert db.query(AuthSession).count() == 1


def test_calendar_callback_encrypts_refresh_token(authenticated, db, user, provider):
    provider[0].return_value.update(scope=CALENDAR_SCOPE, refresh_token='fake-refresh-token')
    assert authenticated.get('/auth/google/calendar').status_code == 307
    assert provider[1].call_args.kwargs['access_type'] == 'offline'
    assert authenticated.get('/auth/google/callback').status_code == 303
    db.refresh(user)
    assert user.google_refresh_token != 'fake-refresh-token'
    assert token_cipher().decrypt(user.google_refresh_token.encode()) == b'fake-refresh-token'
    assert authenticated.get('/auth/me').json()['calendar_connected'] is True


def test_calendar_denied_scope_does_not_store_token(authenticated, db, user, provider):
    provider[0].return_value.update(scope='openid', refresh_token='fake-refresh-token')
    authenticated.get('/auth/google/calendar')
    response = authenticated.get('/auth/google/callback')
    assert 'error=account_denied' in response.headers['location']
    db.refresh(user)
    assert user.google_refresh_token is None


def test_failed_login_rolls_back(client, db, provider):
    provider[0].side_effect = OAuthError(error='mismatching_state')
    response = client.get('/auth/google/callback')
    assert response.headers['location'].endswith('error=expired_attempt')
    assert db.query(Usuario).count() == 0
    assert db.query(AuthSession).count() == 0


def test_configuration_and_redirect_failure(client, authenticated, monkeypatch, provider):
    assert client.get('/auth/status').json()['configured'] is True
    provider[1].side_effect = OAuthError(error='access_denied')
    assert 'error=consent_denied' in client.get('/auth/google/login').headers['location']
    monkeypatch.setattr(settings, 'google_client_id', '')
    assert client.get('/auth/status').json()['configured'] is False
    assert 'error=configuration' in client.get('/auth/google/login').headers['location']
    assert 'error=configuration' in authenticated.get('/auth/google/calendar').headers['location']
