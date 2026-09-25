"""Schemas Pydantic do plano de tratamento, parcelas e pagamentos (história 8).

Todo valor monetário trafega como inteiro em centavos — nunca float.
"""

from typing import Literal

from pydantic import BaseModel, Field, field_validator

StatusPlano = Literal["em_andamento", "concluido", "cancelado"]


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
