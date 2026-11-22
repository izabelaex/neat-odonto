"""Integração das rotas com sessão e SQLite reais; somente o Google é simulado."""
from unittest.mock import AsyncMock
from datetime import date
from uuid import uuid4
import pytest
import httpx
from app.routers import calendar
from app.models import Consulta


def event(identifier, patient_id, owned=True):
    return {'id': identifier, 'summary': 'Avaliacao', 'start': {}, 'end': {},
        'extendedProperties': {'private': {'neat_odonto': 'appointment' if owned else '',
                                          'patient_id': str(patient_id)}}}


@pytest.fixture
def google(monkeypatch):
    request = AsyncMock()
    monkeypatch.setattr(calendar, 'access_token', AsyncMock(return_value='fake-access'))
    monkeypatch.setattr(calendar, 'calendar_request', request)
    return request


def test_list_filters_external_and_completed(authenticated, db, patient, google):
    db.add(Consulta(paciente_id=patient.id, data=date(2026, 10, 1),
                    procedimentos_realizados='Avaliacao', google_event_id='completed'))
    db.commit()
    google.return_value = {'items': [event('pending', patient.id), event('external', patient.id, False),
        event('completed', patient.id)], 'nextPageToken': 'next-page'}
    response = authenticated.get('/agenda/eventos', params={'start': '2026-10-01T00:00:00Z',
        'end': '2026-10-08T00:00:00Z', 'page_token': 'previous-page'})
    assert response.status_code == 200
    assert [item['id'] for item in response.json()['items']] == ['pending']
    assert response.json()['items'][0]['patient_name'] == patient.nome
    assert response.json()['next_page_token'] == 'next-page'
    assert google.call_args.kwargs['params']['privateExtendedProperty'] == 'neat_odonto=appointment'
    assert google.call_args.kwargs['params']['pageToken'] == 'previous-page'


def test_create_validates_patient_and_marks_event(authenticated, patient, google):
    payload = {'request_id': str(uuid4()), 'patient_id': patient.id, 'title': 'Avaliacao',
               'start': '2026-10-01T10:00:00Z'}
    google.return_value = event('created', patient.id)
    response = authenticated.post('/agenda/eventos', json=payload)
    assert response.status_code == 201
    sent = google.call_args.kwargs['json']
    assert sent['id'] == payload['request_id'].replace('-', '')
    assert sent['end']['dateTime'] == '2026-10-01T11:00:00+00:00'
    assert sent['extendedProperties']['private']['patient_id'] == str(patient.id)
    google.reset_mock()
    assert authenticated.post('/agenda/eventos', json=payload | {'patient_id': 999}).status_code == 404
    google.assert_not_called()


def test_get_and_delete_only_neat_events(authenticated, patient, google):
    google.return_value = event('owned', patient.id)
    assert authenticated.get('/agenda/eventos/owned').json()['patient_name'] == patient.nome
    assert authenticated.delete('/agenda/eventos/owned').status_code == 204
    assert google.call_args.args[0] == 'DELETE'
    google.return_value = event('external', patient.id, False)
    assert authenticated.get('/agenda/eventos/external').status_code == 404
    google.reset_mock()
    assert authenticated.delete('/agenda/eventos/external').status_code == 404
    assert google.call_count == 1


@pytest.mark.parametrize('end', ['2026-10-01T00:00:00Z', '2026-12-01T00:00:00Z'])
def test_invalid_interval_never_calls_google(authenticated, google, end):
    assert authenticated.get('/agenda/eventos', params={'start': '2026-10-01T00:00:00Z', 'end': end}).status_code == 422
    google.assert_not_called()


def test_google_network_failure_is_translated(authenticated, google):
    google.side_effect = httpx.ConnectError('fake network error')
    assert authenticated.get('/agenda/eventos/owned').status_code == 502
