"""Simula HTTP, mantendo o serviço real de tokens e Calendar sob teste."""
import asyncio
from urllib.parse import parse_qs
import httpx
import pytest
from fastapi import HTTPException
from app.auth.google import token_cipher
from app.services.google_calendar import access_token, calendar_request, check_response


@pytest.fixture
def transport(monkeypatch):
    original = httpx.AsyncClient
    def install(handler):
        monkeypatch.setattr(httpx, 'AsyncClient', lambda **kwargs: original(
            **kwargs, transport=httpx.MockTransport(handler)))
    return install


def test_refresh_token_is_decrypted_and_rotated(db, user, transport):
    user.google_refresh_token = token_cipher().encrypt(b'old-refresh').decode()
    db.commit()
    def handler(request):
        assert request.url.path == '/token'
        assert parse_qs(request.content.decode())['refresh_token'] == ['old-refresh']
        return httpx.Response(200, json={'access_token': 'new-access', 'refresh_token': 'new-refresh'})
    transport(handler)
    assert asyncio.run(access_token(user, db)) == 'new-access'
    db.refresh(user)
    assert token_cipher().decrypt(user.google_refresh_token.encode()) == b'new-refresh'


@pytest.mark.parametrize('stored', [None, 'invalid-ciphertext'])
def test_missing_or_invalid_refresh_token_requires_reconnection(db, user, stored):
    user.google_refresh_token = stored
    with pytest.raises(HTTPException) as error:
        asyncio.run(access_token(user, db))
    assert error.value.status_code == 409


def test_revoked_grant_clears_stored_token(db, user, transport):
    user.google_refresh_token = token_cipher().encrypt(b'revoked').decode()
    db.commit()
    transport(lambda request: httpx.Response(400, json={'error': 'invalid_grant'}))
    with pytest.raises(HTTPException) as error:
        asyncio.run(access_token(user, db))
    assert error.value.status_code == 409
    db.refresh(user)
    assert user.google_refresh_token is None


def test_retry_returns_existing_event_instead_of_duplicate(transport):
    calls = []
    def handler(request):
        calls.append(request.method)
        assert request.headers['Authorization'] == 'Bearer fake-access'
        if request.method == 'POST':
            return httpx.Response(409, json={})
        assert request.url.path.endswith('/events/stable-id')
        return httpx.Response(200, json={'id': 'stable-id'})
    transport(handler)
    result = asyncio.run(calendar_request('POST', 'fake-access', json={'id': 'stable-id'}))
    assert result == {'id': 'stable-id'}
    assert calls == ['POST', 'GET']


@pytest.mark.parametrize('status', [204, 404, 410])
def test_delete_accepts_already_absent_event(transport, status):
    transport(lambda request: httpx.Response(status))
    assert asyncio.run(calendar_request('DELETE', 'fake-access', event_id='gone')) is None


@pytest.mark.parametrize('remote,local', [(401, 409), (403, 409), (429, 503), (500, 502)])
def test_google_status_translation(remote, local):
    with pytest.raises(HTTPException) as error:
        check_response(httpx.Response(remote))
    assert error.value.status_code == local
