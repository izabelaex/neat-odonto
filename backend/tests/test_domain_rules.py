"""Testes unitários: regras sem navegador e sem persistência."""
from datetime import timedelta
from uuid import uuid4

import pytest
from pydantic import ValidationError
from app.config import Settings
from app.schemas.calendar import CalendarEventCreate
from app.schemas.paciente import PacienteCreate
from app.schemas.tratamento import OrcamentoPlano, PlanoTratamentoCreate
from app.routers.tratamento import dividir_em_parcelas, gerar_parcelas
from fastapi import HTTPException


@pytest.mark.parametrize("total,count,expected", [(1000, 3, [334, 333, 333]),
    (120000, 3, [40000]*3), (1, 1, [1]), (5, 3, [2, 2, 1])])
def test_installments_preserve_every_cent(total, count, expected):
    assert dividir_em_parcelas(total, count) == expected
    assert sum(expected) == total


def test_installments_cannot_exceed_cents():
    with pytest.raises(HTTPException) as error:
        gerar_parcelas(OrcamentoPlano(valor_total_centavos=1, numero_parcelas=2))
    assert error.value.status_code == 422


@pytest.mark.parametrize("name", ["", "   ", "Pessoa 123"])
def test_invalid_patient_names(name):
    with pytest.raises(ValidationError):
        PacienteCreate(nome=name)


@pytest.mark.parametrize("cpf", ["123", "11111111111", "00000000000", "12345678900"])
def test_invalid_cpf(cpf):
    with pytest.raises(ValidationError):
        PacienteCreate(nome="Paciente Ficticio", cpf=cpf)


def test_patient_normalization():
    patient = PacienteCreate(nome="  Paciente Ficticio  ", cpf="123.456.789-09")
    assert patient.nome == "Paciente Ficticio"
    assert patient.cpf == "12345678909"


@pytest.mark.parametrize("values", [dict(valor_total_centavos=0, numero_parcelas=1),
    dict(valor_total_centavos=100, numero_parcelas=49)])
def test_invalid_budget(values):
    with pytest.raises(ValidationError):
        OrcamentoPlano(**values)


def test_blank_procedure_rejected():
    with pytest.raises(ValidationError):
        PlanoTratamentoCreate(procedimentos="  ", valor_total_centavos=100, numero_parcelas=1)


def appointment(**changes):
    return CalendarEventCreate(request_id=uuid4(), patient_id=1,
        **({"title": " Avaliacao ", "start": "2026-10-01T10:00:00-03:00"} | changes))


def test_default_duration_and_title():
    item = appointment()
    assert item.end - item.start == timedelta(hours=1)
    assert item.title == "Avaliacao"


@pytest.mark.parametrize("changes", [{"end": "2026-10-01T10:00:00-03:00"},
    {"end": "2026-10-01T09:00:00-03:00"}, {"start": "2026-10-01T10:00:00"}, {"title": " "}])
def test_invalid_appointment(changes):
    with pytest.raises(ValidationError):
        appointment(**changes)


def test_allowlist_normalizes_and_takes_precedence():
    config = Settings(_env_file=None, allowed_google_emails=" A@EXAMPLE.TEST, b@example.test, ",
                      allowed_google_email="legacy@example.test")
    assert config.allowed_google_accounts() == {"a@example.test", "b@example.test"}
    config.allowed_google_emails = ""
    assert config.allowed_google_accounts() == {"legacy@example.test"}
