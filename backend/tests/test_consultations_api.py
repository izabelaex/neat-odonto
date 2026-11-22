"""Histórico clínico, esterilização obrigatória e edição sem duplicar registros."""
import pytest
from app.models import Consulta, RegistroEsterilizacao


@pytest.fixture
def consultation_data():
    return {'data': '2026-10-01', 'procedimentos_realizados': '  Avaliacao  ',
        'identificacao_pacote': 'Lote ficticio', 'ciclo': 'Ciclo teste',
        'data_ciclo': '2026-10-01', 'responsavel': 'Responsavel Ficticio'}


def test_history_is_ordered_and_filterable(authenticated, patient, consultation_data):
    url = f'/pacientes/{patient.id}/consultas'
    for day in ['2026-10-01', '2026-10-03', '2026-10-02']:
        assert authenticated.post(url, data=consultation_data | {'data': day}).status_code == 201
    history = authenticated.get(url).json()
    assert [c['data'] for c in history] == ['2026-10-03', '2026-10-02', '2026-10-01']
    assert history[0]['paciente_nome'] == patient.nome
    assert history[0]['procedimentos_realizados'] == 'Avaliacao'
    assert len(authenticated.get('/consultas', params={'data': '2026-10-02'}).json()) == 1
    assert authenticated.get(f"/consultas/{history[0]['id']}").json()['esterilizacao']['ciclo'] == 'Ciclo teste'


@pytest.mark.parametrize('field', ['procedimentos_realizados', 'ciclo', 'responsavel', 'identificacao_pacote'])
def test_required_fields_rejected_without_partial_save(authenticated, db, patient, consultation_data, field):
    response = authenticated.post(f'/pacientes/{patient.id}/consultas', data=consultation_data | {field: ' '})
    assert response.status_code == 422
    assert db.query(Consulta).count() == 0
    assert db.query(RegistroEsterilizacao).count() == 0


def test_edit_preserves_single_record(authenticated, db, patient, consultation_data):
    item = authenticated.post(f'/pacientes/{patient.id}/consultas', data=consultation_data).json()
    response = authenticated.put(f"/consultas/{item['id']}", data=consultation_data | {
        'paciente_id': patient.id, 'ciclo': 'Segundo ciclo', 'observacoes': ' Retorno '})
    assert response.status_code == 200
    assert response.json()['esterilizacao']['id'] == item['esterilizacao']['id']
    assert response.json()['esterilizacao']['ciclo'] == 'Segundo ciclo'
    assert response.json()['observacoes'] == 'Retorno'
    assert db.query(RegistroEsterilizacao).count() == 1


def test_same_event_cannot_create_two_consultations(authenticated, db, patient, consultation_data):
    url = f'/pacientes/{patient.id}/consultas'
    data = consultation_data | {'google_event_id': 'neat-event-test'}
    assert authenticated.post(url, data=data).status_code == 201
    assert authenticated.post(url, data=data).status_code == 409
    assert db.query(Consulta).count() == 1


def test_missing_consultation_resources(authenticated, consultation_data):
    for url in ['/consultas/999', '/pacientes/999/consultas', '/consultas/999/esterilizacao/foto']:
        assert authenticated.get(url).status_code == 404
    assert authenticated.post('/pacientes/999/consultas', data=consultation_data).status_code == 404
