"""Schemas Pydantic de entrada e saída para pacientes e seus documentos."""

import re
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator

TIPOS_DOCUMENTO = ("foto", "radiografia")


class PacienteBase(BaseModel):
    nome: str = Field(min_length=1, max_length=160)
    telefone: str | None = Field(default=None, max_length=20)
    cpf: str | None = None
    endereco: str | None = Field(default=None, max_length=255)
    queixa_principal: str | None = None

    @field_validator("nome")
    @classmethod
    def _nome_sem_espacos_nas_pontas(cls, valor: str) -> str:
        valor = valor.strip()
        if not valor:
            raise ValueError("nome não pode ficar em branco")
        return valor

    @field_validator("cpf")
    @classmethod
    def _cpf_so_digitos(cls, valor: str | None) -> str | None:
        if not valor:
            return None
        digitos = re.sub(r"\D", "", valor)
        if len(digitos) != 11:
            raise ValueError("CPF deve ter 11 dígitos")
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
