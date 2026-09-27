"""Schemas Pydantic de entrada e saída para pacientes e seus documentos."""

import re
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator

TIPOS_DOCUMENTO = ("foto", "radiografia")


def _cpf_valido(digitos: str) -> bool:
    """Confere os dígitos verificadores do CPF (algoritmo padrão da Receita)."""
    if len(digitos) != 11 or len(set(digitos)) == 1:
        return False

    def digito_verificador(parcial: str) -> str:
        pesos = range(len(parcial) + 1, 1, -1)
        soma = sum(int(d) * peso for d, peso in zip(parcial, pesos))
        resto = (soma * 10) % 11
        return str(resto) if resto < 10 else "0"

    d1 = digito_verificador(digitos[:9])
    d2 = digito_verificador(digitos[:9] + d1)
    return digitos[-2:] == d1 + d2


class PacienteBase(BaseModel):
    nome: str = Field(min_length=1, max_length=160)
    telefone: str | None = Field(default=None, max_length=20)
    cpf: str | None = None
    endereco: str | None = Field(default=None, max_length=255)
    queixa_principal: str | None = None

    @field_validator("nome")
    @classmethod
    def _validar_nome(cls, valor: str) -> str:
        valor = valor.strip()
        if not valor:
            raise ValueError("nome não pode ficar em branco")
        if re.search(r"\d", valor):
            raise ValueError("nome não pode conter números")
        return valor

    @field_validator("cpf")
    @classmethod
    def _validar_cpf(cls, valor: str | None) -> str | None:
        if not valor:
            return None
        digitos = re.sub(r"\D", "", valor)
        if not _cpf_valido(digitos):
            raise ValueError("CPF inválido")
        return digitos


class PacienteCreate(PacienteBase):
    pass


class PacienteUpdate(PacienteBase):
    pass


class PacienteResumo(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    nome: str
    telefone: str | None


class BuscaPacientes(BaseModel):
    """Corpo da busca rápida por nome ou CPF — POST para o termo nunca ir em URL."""

    termo: str = Field(min_length=1, max_length=160)


class DocumentoPacienteOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    tipo: str
    descricao: str | None
    criado_em: datetime


class PacienteDetalhe(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    nome: str
    telefone: str | None
    cpf: str | None
    endereco: str | None
    queixa_principal: str | None
    criado_em: datetime
    atualizado_em: datetime
    documentos: list[DocumentoPacienteOut] = []
