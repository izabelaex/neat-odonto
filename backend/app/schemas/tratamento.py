"""Schemas Pydantic do plano de tratamento, parcelas e pagamentos (história 8).

Todo valor monetário trafega como inteiro em centavos — nunca float.
"""

from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, computed_field, field_validator

StatusPlano = Literal["em_andamento", "concluido", "cancelado"]
FormaPagamento = Literal["dinheiro", "pix", "cartao", "transferencia", "outro"]


class PlanoTratamentoCreate(BaseModel):
    """O plano nasce já com o orçamento dividido em parcelas combinadas."""

    procedimentos: str = Field(min_length=1)
    valor_total_centavos: int = Field(gt=0)
    numero_parcelas: int = Field(ge=1, le=48)

    @field_validator("procedimentos")
    @classmethod
    def _procedimentos_preenchidos(cls, valor: str) -> str:
        valor = valor.strip()
        if not valor:
            raise ValueError("procedimentos não podem ficar em branco")
        return valor


class PlanoTratamentoUpdate(BaseModel):
    procedimentos: str | None = Field(default=None, min_length=1)
    status: StatusPlano | None = None


class PagamentoCreate(BaseModel):
    valor_centavos: int = Field(gt=0)
    data_pagamento: date = Field(default_factory=date.today)
    forma: FormaPagamento | None = None


class PagamentoOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    valor_centavos: int
    data_pagamento: date
    forma: str | None


class ParcelaOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    numero: int
    valor_centavos: int
    vencimento: date | None
    valor_pago_centavos: int
    quitada: bool
    pagamentos: list[PagamentoOut] = []


class PlanoTratamentoOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    paciente_id: int
    procedimentos: str
    valor_total_centavos: int
    status: str
    criado_em: datetime
    parcelas: list[ParcelaOut] = []

    @computed_field
    @property
    def parcelas_pagas(self) -> int:
        return sum(1 for p in self.parcelas if p.quitada)

    @computed_field
    @property
    def valor_pago_centavos(self) -> int:
        return sum(p.valor_pago_centavos for p in self.parcelas)
