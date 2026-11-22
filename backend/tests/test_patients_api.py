"""API real + SQLite: cadastro, busca, atualização e exclusão."""
import pytest
from app.models import Paciente


def test_patient_lifecycle(authenticated, db):
    response = authenticated.post('/pacientes', json={"nome": "  Paciente Alfa  ",
        "cpf": "123.456.789-09", "queixa_principal": "Retorno"})
    assert response.status_code == 201
    patient = response.json()
    assert patient['cpf'] == '12345678909'
    assert authenticated.get(f"/pacientes/{patient['id']}").json()['nome'] == 'Paciente Alfa'
    assert authenticated.get('/pacientes', params={'nome': 'alfa'}).json()[0]['id'] == patient['id']
    assert authenticated.post('/pacientes/busca', json={'termo': '123.456'}).json()[0]['id'] == patient['id']
    assert authenticated.post('/pacientes/busca', json={'termo': 'ausente'}).json() == []
    response = authenticated.put(f"/pacientes/{patient['id']}", json={'nome': 'Paciente Beta'})
    assert response.status_code == 200
    assert response.json()['queixa_principal'] == 'Retorno'
    assert authenticated.delete(f"/pacientes/{patient['id']}").status_code == 204
    assert db.query(Paciente).count() == 0


def test_duplicate_cpf_on_create_and_update(authenticated, patient):
    payload = {'nome': 'Paciente Alfa', 'cpf': '12345678909'}
    assert authenticated.post('/pacientes', json=payload).status_code == 201
    assert authenticated.post('/pacientes', json=payload).status_code == 409
    assert authenticated.put(f'/pacientes/{patient.id}', json=payload).status_code == 409
    assert authenticated.get(f'/pacientes/{patient.id}').json()['cpf'] is None


@pytest.mark.parametrize('method', ['get', 'put', 'delete'])
def test_missing_patient(authenticated, method):
    kwargs = {'json': {'nome': 'Paciente Ficticio'}} if method == 'put' else {}
    assert getattr(authenticated, method)('/pacientes/9999', **kwargs).status_code == 404


def test_invalid_patient_does_not_persist(authenticated, db):
    assert authenticated.post('/pacientes', json={'nome': '  '}).status_code == 422
    assert db.query(Paciente).count() == 0
