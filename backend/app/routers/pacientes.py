"""Cadastro, busca e documentos clínicos de pacientes (histórias 3, 4 e 5)."""

import os
import re
import uuid
from pathlib import Path

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from fastapi.responses import FileResponse
from sqlalchemy import or_
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.models.paciente import DocumentoPaciente, Paciente
from app.schemas.paciente import (
    TIPOS_DOCUMENTO,
    BuscaPacientes,
    DocumentoPacienteOut,
    PacienteCreate,
    PacienteDetalhe,
    PacienteResumo,
    PacienteUpdate,
)

router = APIRouter(prefix="/pacientes", tags=["pacientes"])


@router.post("", response_model=PacienteDetalhe, status_code=status.HTTP_201_CREATED)
def criar_paciente(dados: PacienteCreate, db: Session = Depends(get_db)):
    paciente = Paciente(**dados.model_dump())
    db.add(paciente)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status.HTTP_409_CONFLICT, "CPF já cadastrado para outro paciente")
    db.refresh(paciente)
    return paciente


@router.get("", response_model=list[PacienteResumo])
def listar_pacientes(nome: str | None = None, db: Session = Depends(get_db)):
    """Lista de pacientes com filtro opcional por nome (história 4)."""
    consulta = db.query(Paciente)
    if nome:
        consulta = consulta.filter(Paciente.nome.ilike(f"%{nome}%"))
    return consulta.order_by(Paciente.nome).all()


@router.post("/busca", response_model=list[PacienteResumo])
def buscar_pacientes(dados: BuscaPacientes, db: Session = Depends(get_db)):
    """Busca rápida por nome ou CPF (história 5).

    É POST, não GET: o termo pode ser um CPF, e CPF não pode aparecer em
    querystring de URL nem em log de acesso (ver AGENTS.md, seção 3).
    """
    termo = dados.termo.strip()
    digitos = re.sub(r"\D", "", termo)
    filtros = [Paciente.nome.ilike(f"%{termo}%")]
    if len(digitos) >= 3:
        filtros.append(Paciente.cpf.ilike(f"%{digitos}%"))
    return db.query(Paciente).filter(or_(*filtros)).order_by(Paciente.nome).all()


@router.get("/{paciente_id}", response_model=PacienteDetalhe)
def obter_paciente(paciente_id: int, db: Session = Depends(get_db)):
    paciente = db.get(Paciente, paciente_id)
    if not paciente:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Paciente não encontrado")
    return paciente


@router.put("/{paciente_id}", response_model=PacienteDetalhe)
def atualizar_paciente(paciente_id: int, dados: PacienteUpdate, db: Session = Depends(get_db)):
    paciente = db.get(Paciente, paciente_id)
    if not paciente:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Paciente não encontrado")
    for campo, valor in dados.model_dump().items():
        setattr(paciente, campo, valor)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status.HTTP_409_CONFLICT, "CPF já cadastrado para outro paciente")
    db.refresh(paciente)
    return paciente

