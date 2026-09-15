"""Plano de tratamento, orçamento, parcelas combinadas e pagamentos.

Três níveis distintos, como a cliente descreveu:
  plano -> parcelas combinadas (o que foi acordado) -> pagamentos (o que entrou).
Uma parcela pode receber mais de um pagamento, então o pagamento parcial funciona
sem mudança de schema.

Todo valor é inteiro, em centavos.
"""

from datetime import date, datetime

from sqlalchemy import Date, DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class PlanoTratamento(Base):
    __tablename__ = "planos_tratamento"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    paciente_id: Mapped[int] = mapped_column(
        ForeignKey("pacientes.id", ondelete="CASCADE"), nullable=False, index=True
    )
    procedimentos: Mapped[str] = mapped_column(Text, nullable=False)
    valor_total_centavos: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    # "em_andamento" | "concluido" | "cancelado"
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="em_andamento")
    criado_em: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    paciente: Mapped["Paciente"] = relationship(back_populates="planos_tratamento")
    parcelas: Mapped[list["Parcela"]] = relationship(
        back_populates="plano", cascade="all, delete-orphan", order_by="Parcela.numero"
    )


class Parcela(Base):
    """Uma parcela combinada com o paciente. Combinada, não necessariamente paga."""

    __tablename__ = "parcelas"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    plano_id: Mapped[int] = mapped_column(
        ForeignKey("planos_tratamento.id", ondelete="CASCADE"), nullable=False, index=True
    )
    numero: Mapped[int] = mapped_column(Integer, nullable=False)
    valor_centavos: Mapped[int] = mapped_column(Integer, nullable=False)
    vencimento: Mapped[date | None] = mapped_column(Date)
    criado_em: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    plano: Mapped["PlanoTratamento"] = relationship(back_populates="parcelas")
    pagamentos: Mapped[list["Pagamento"]] = relationship(
        back_populates="parcela", cascade="all, delete-orphan"
    )

    @property
    def valor_pago_centavos(self) -> int:
        return sum(p.valor_centavos for p in self.pagamentos)

    @property
    def quitada(self) -> bool:
        return self.valor_pago_centavos >= self.valor_centavos


class Pagamento(Base):
    """Dinheiro que efetivamente entrou para uma parcela."""

    __tablename__ = "pagamentos"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    parcela_id: Mapped[int] = mapped_column(
        ForeignKey("parcelas.id", ondelete="CASCADE"), nullable=False, index=True
    )
    valor_centavos: Mapped[int] = mapped_column(Integer, nullable=False)
    data_pagamento: Mapped[date] = mapped_column(Date, nullable=False)
    # "dinheiro" | "pix" | "cartao" | "transferencia" | "outro"
    forma: Mapped[str | None] = mapped_column(String(20))
    criado_em: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    parcela: Mapped["Parcela"] = relationship(back_populates="pagamentos")
