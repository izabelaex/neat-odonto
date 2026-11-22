"""Upload, substituição e remoção de foto sem perder identificação do pacote."""
from pathlib import Path
import pytest
from app.config import settings


@pytest.fixture
def form():
    return {'data': '2026-10-01', 'procedimentos_realizados': 'Avaliacao',
        'ciclo': 'Ciclo teste', 'data_ciclo': '2026-10-01', 'responsavel': 'Pessoa Ficticia'}


def test_photo_lifecycle(authenticated, patient, form):
    response = authenticated.post(f'/pacientes/{patient.id}/consultas', data=form,
        files={'foto_pacote': ('fixture.png', b'first-fixture', 'image/png')})
    assert response.status_code == 201
    item = response.json()
    assert item['esterilizacao']['tem_foto'] is True
    assert item['esterilizacao']['identificacao_pacote'] is None
    url = f"/consultas/{item['id']}"
    photo = f'{url}/esterilizacao/foto'
    assert authenticated.get(photo).content == b'first-fixture'
    old_file = next(Path(settings.upload_dir).rglob('*.png'))
    updated_form = form | {'paciente_id': patient.id}
    assert authenticated.put(url, data=updated_form).status_code == 200
    assert authenticated.put(url, data=updated_form | {'remover_foto': 'true'}).status_code == 422
    assert old_file.exists()
    response = authenticated.put(url, data=updated_form,
        files={'foto_pacote': ('replacement.png', b'second-fixture', 'image/png')})
    assert response.status_code == 200
    assert not old_file.exists()
    assert authenticated.get(photo).content == b'second-fixture'
    response = authenticated.put(url, data=updated_form | {
        'remover_foto': 'true', 'identificacao_pacote': 'Lote por texto'})
    assert response.status_code == 200
    assert response.json()['esterilizacao']['tem_foto'] is False
    assert not list(Path(settings.upload_dir).rglob('*.png'))
    assert authenticated.get(photo).status_code == 404


@pytest.mark.parametrize('mime,extra', [('text/plain', {}), ('image/png', {'remover_foto': 'true'})])
def test_invalid_photo_operation(authenticated, patient, form, mime, extra):
    response = authenticated.post(f'/pacientes/{patient.id}/consultas', data=form | extra,
        files={'foto_pacote': ('fixture.png', b'fixture', mime)})
    assert response.status_code == 422
    assert not Path(settings.upload_dir).exists()
