"""Integração financeira: centavos, pagamentos parciais e orçamento alterado."""
import pytest
from app.models import Pagamento, Parcela, PlanoTratamento


@pytest.fixture
def plan(authenticated, patient):
    response = authenticated.post(f'/pacientes/{patient.id}/planos-tratamento', json={
        'procedimentos': '  Avaliacao  ', 'valor_total_centavos': 1000, 'numero_parcelas': 3})
    assert response.status_code == 201
    return response.json()


def test_partial_payment_and_reversal(authenticated, plan):
    installment = plan['parcelas'][0]['id']
    url = f'/parcelas/{installment}/pagamentos'
    response = authenticated.post(url, json={'valor_centavos': 100, 'forma': 'pix'})
    assert response.status_code == 201
    updated = response.json()
    assert updated['valor_pago_centavos'] == 100
    assert updated['parcelas_pagas'] == 0
    assert authenticated.post(url, json={'valor_centavos': 235}).status_code == 422
    assert authenticated.post(url, json={'valor_centavos': 234}).json()['parcelas_pagas'] == 1
    payment = updated['parcelas'][0]['pagamentos'][0]['id']
    undone = authenticated.delete(f'/pagamentos/{payment}').json()
    assert undone['valor_pago_centavos'] == 234
    assert undone['parcelas_pagas'] == 0


def test_budget_preserves_paid_installments(authenticated, plan):
    installment = plan['parcelas'][0]['id']
    authenticated.post(f'/parcelas/{installment}/pagamentos', json={'valor_centavos': 100})
    url = f"/planos-tratamento/{plan['id']}/orcamento"
    assert authenticated.put(url, json={'valor_total_centavos': 333, 'numero_parcelas': 2}).status_code == 422
    updated = authenticated.put(url, json={'valor_total_centavos': 1500, 'numero_parcelas': 2}).json()
    assert updated['parcelas'][0]['id'] == installment
    assert updated['valor_pago_centavos'] == 100
    assert [p['valor_centavos'] for p in updated['parcelas']] == [334, 583, 583]
    updated = authenticated.put(url, json={'valor_total_centavos': 334, 'numero_parcelas': 1}).json()
    assert len(updated['parcelas']) == 1


def test_plan_edit_list_and_cascade(authenticated, db, patient, plan):
    url = f"/planos-tratamento/{plan['id']}"
    assert authenticated.get(url).json()['procedimentos'] == 'Avaliacao'
    response = authenticated.put(url, json={'status': 'concluido', 'procedimentos': 'Retorno'})
    assert response.json()['status'] == 'concluido'
    assert len(authenticated.get(f'/pacientes/{patient.id}/planos-tratamento').json()) == 1
    authenticated.post(f"/parcelas/{plan['parcelas'][0]['id']}/pagamentos", json={'valor_centavos': 100})
    assert authenticated.delete(url).status_code == 204
    for model in [PlanoTratamento, Parcela, Pagamento]:
        assert db.query(model).count() == 0


@pytest.mark.parametrize('method,url,payload', [
    ('get', '/pacientes/999/planos-tratamento', None),
    ('post', '/pacientes/999/planos-tratamento', {'procedimentos': 'Teste', 'valor_total_centavos': 100, 'numero_parcelas': 1}),
    ('get', '/planos-tratamento/999', None),
    ('post', '/parcelas/999/pagamentos', {'valor_centavos': 1}),
    ('delete', '/pagamentos/999', None),
])
def test_missing_financial_resources(authenticated, method, url, payload):
    assert authenticated.request(method, url, json=payload).status_code == 404
