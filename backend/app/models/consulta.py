"""Consultas e a rastreabilidade de esterilização.

A esterilização é o diferencial do produto e existe por motivo sanitário.
O registro pode identificar o pacote de duas formas — foto ou texto — e pelo
menos uma delas é obrigatória (ver CheckConstraint abaixo).
"""

from datetime import date, datetime

from sqlalchemy import (
    CheckConstraint,
    Date,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Consulta(Base):
    __tablename__ = "consultas"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    paciente_id: Mapped[int] = mapped_column(
        ForeignKey("pacientes.id", ondelete="CASCADE"), nullable=False, index=True
    )
    data: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    # Texto livre: a dentista não quer preencher catálogo fechado durante o atendimento.
    procedimentos_realizados: Mapped[str] = mapped_column(Text, nullable=False)
    observacoes: Mapped[str | None] = mapped_column(Text)
    criado_em: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    paciente: Mapped["Paciente"] = relationship(back_populates="consultas")
    registros_esterilizacao: Mapped[list["RegistroEsterilizacao"]] = relationship(
        back_populates="consulta", cascade="all, delete-orphan"
    )


class RegistroEsterilizacao(Base):
    __tablename__ = "registros_esterilizacao"
    __table_args__ = (
        CheckConstraint(
            "identificacao_pacote IS NOT NULL OR foto_pacote_caminho IS NOT NULL",
            name="ck_esterilizacao_identificacao_presente",
        ),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    consulta_id: Mapped[int] = mapped_column(
        ForeignKey("consultas.id", ondelete="CASCADE"), nullable=False, index=True
    )

    # Identificação do pacote/lote: texto OU foto. Pelo menos uma das duas.
    identificacao_pacote: Mapped[str | None] = mapped_column(Text)
    foto_pacote_caminho: Mapped[str | None] = mapped_column(String(500))

    ciclo: Mapped[str] = mapped_column(String(60), nullable=False)
    data_ciclo: Mapped[date] = mapped_column(Date, nullable=False)
    responsavel: Mapped[str] = mapped_column(String(120), nullable=False)

    criado_em: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    consulta: Mapped["Consulta"] = relationship(back_populates="registros_esterilizacao")
