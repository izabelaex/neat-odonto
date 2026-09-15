"""Usuário do sistema.

Existe um único dentista usando o sistema nesta versão. A tabela permite mais de
uma linha para não travar um segundo acesso no futuro, mas nenhuma outra tabela
referencia o usuário: os dados não são particionados por dono.
"""

from datetime import datetime

from sqlalchemy import DateTime, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class Usuario(Base):
    __tablename__ = "usuarios"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    nome: Mapped[str] = mapped_column(String(120), nullable=False)
    email: Mapped[str] = mapped_column(String(180), nullable=False, unique=True, index=True)
    senha_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    criado_em: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
