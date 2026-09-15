"""Paciente e seus documentos clínicos."""

from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Paciente(Base):
    __tablename__ = "pacientes"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    nome: Mapped[str] = mapped_column(String(160), nullable=False, index=True)
    telefone: Mapped[str | None] = mapped_column(String(20))
    # CPF guardado apenas com dígitos, sem pontuação. Dado sensível:
    # não logar, não expor em URL.
    cpf: Mapped[str | None] = mapped_column(String(11), unique=True, index=True)
    endereco: Mapped[str | None] = mapped_column(String(255))
    # Anamnese: a queixa principal, em texto livre, como a dentista registra hoje.
    queixa_principal: Mapped[str | None] = mapped_column(Text)

    criado_em: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    atualizado_em: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), onupdate=func.now()
    )

    documentos: Mapped[list["DocumentoPaciente"]] = relationship(
        back_populates="paciente", cascade="all, delete-orphan"
    )
    consultas: Mapped[list["Consulta"]] = relationship(
        back_populates="paciente",
        cascade="all, delete-orphan",
        order_by="Consulta.data.desc()",
    )
    planos_tratamento: Mapped[list["PlanoTratamento"]] = relationship(
        back_populates="paciente", cascade="all, delete-orphan"
    )


class DocumentoPaciente(Base):
    """Fotos e radiografias. O arquivo fica em disco; o banco guarda o caminho."""

    __tablename__ = "documentos_paciente"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    paciente_id: Mapped[int] = mapped_column(
        ForeignKey("pacientes.id", ondelete="CASCADE"), nullable=False, index=True
    )
    # "foto" ou "radiografia"
    tipo: Mapped[str] = mapped_column(String(20), nullable=False)
    caminho_arquivo: Mapped[str] = mapped_column(String(500), nullable=False)
    descricao: Mapped[str | None] = mapped_column(String(255))
    criado_em: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    paciente: Mapped["Paciente"] = relationship(back_populates="documentos")
