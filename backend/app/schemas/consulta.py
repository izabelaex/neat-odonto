"""Dados exibidos nas consultas e nos registros de esterilização."""

from datetime import date

from pydantic import BaseModel


class EsterilizacaoOut(BaseModel):
    id: int
    identificacao_pacote: str | None
    tem_foto: bool
    ciclo: str
    data_ciclo: date
    responsavel: str


class ConsultaOut(BaseModel):
    id: int
    paciente_id: int
    paciente_nome: str
    data: date
    procedimentos_realizados: str
    observacoes: str | None
    google_event_id: str | None
    esterilizacao: EsterilizacaoOut | None
