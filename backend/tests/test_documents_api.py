"""Arquivos só são escritos no diretório temporário de cada teste."""
from pathlib import Path
import pytest
from app.config import settings


@pytest.mark.parametrize('delete_patient', [False, True])
def test_upload_download_and_remove(authenticated, patient, delete_patient):
    url = f'/pacientes/{patient.id}/documentos'
    response = authenticated.post(url, data={'tipo': 'foto', 'descricao': 'Imagem ficticia'},
        files={'arquivo': ('fixture.png', b'fixture-only', 'image/png')})
    assert response.status_code == 201
    document_id = response.json()['id']
    download = authenticated.get(f'{url}/{document_id}/arquivo')
    assert download.status_code == 200
    assert download.content == b'fixture-only'
    assert list(Path(settings.upload_dir).rglob('*.png'))
    target = f'/pacientes/{patient.id}' if delete_patient else f'{url}/{document_id}'
    assert authenticated.delete(target).status_code == 204
    assert not list(Path(settings.upload_dir).rglob('*.png'))
    assert authenticated.get(f'{url}/{document_id}/arquivo').status_code == 404


def test_document_cannot_be_read_from_another_patient(authenticated, patient):
    other = authenticated.post('/pacientes', json={'nome': 'Outro Paciente'}).json()['id']
    document = authenticated.post(f'/pacientes/{patient.id}/documentos', data={'tipo': 'foto'},
        files={'arquivo': ('fixture.png', b'fixture-only', 'image/png')}).json()
    assert authenticated.get(f"/pacientes/{other}/documentos/{document['id']}/arquivo").status_code == 404
    assert authenticated.delete(f"/pacientes/{other}/documentos/{document['id']}").status_code == 404


@pytest.mark.parametrize('patient_id,kind,code', [(9999, 'foto', 404), (1, 'outro', 422)])
def test_invalid_upload(authenticated, patient, patient_id, kind, code):
    response = authenticated.post(f'/pacientes/{patient_id}/documentos', data={'tipo': kind},
        files={'arquivo': ('fixture.png', b'fixture-only', 'image/png')})
    assert response.status_code == code
    assert not Path(settings.upload_dir).exists()
