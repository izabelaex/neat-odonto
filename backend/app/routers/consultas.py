"""Histórico e cadastro de consultas com rastreabilidade de esterilização."""

import uuid
from datetime import date
from pathlib import Path

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from fastapi.responses import FileResponse
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, joinedload, selectinload

from app.config import settings
from app.database import get_db
from app.models.consulta import Consulta, RegistroEsterilizacao
from app.models.paciente import Paciente
from app.schemas.consulta import ConsultaOut, EsterilizacaoOut

router = APIRouter(tags=["consultas"])
TIPOS_FOTO = {"image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp"}


def _consulta(db: Session, consulta_id: int) -> Consulta:
    consulta = db.get(Consulta, consulta_id)
    if not consulta:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Consulta não encontrada")
    return consulta


def _saida(consulta: Consulta) -> ConsultaOut:
    registro = next(iter(consulta.registros_esterilizacao), None)
    esterilizacao = None
    if registro:
        esterilizacao = EsterilizacaoOut(
            id=registro.id,
            identificacao_pacote=registro.identificacao_pacote,
            tem_foto=bool(registro.foto_pacote_caminho),
            ciclo=registro.ciclo,
            data_ciclo=registro.data_ciclo,
            responsavel=registro.responsavel,
        )
    return ConsultaOut(
        id=consulta.id,
        paciente_id=consulta.paciente_id,
        paciente_nome=consulta.paciente.nome,
        data=consulta.data,
        procedimentos_realizados=consulta.procedimentos_realizados,
        observacoes=consulta.observacoes,
        google_event_id=consulta.google_event_id,
        esterilizacao=esterilizacao,
    )


def _listagem(db: Session, paciente_id: int | None = None, data: date | None = None):
    query = db.query(Consulta).options(
        joinedload(Consulta.paciente), selectinload(Consulta.registros_esterilizacao)
    )
    if paciente_id is not None:
        query = query.filter(Consulta.paciente_id == paciente_id)
    if data is not None:
        query = query.filter(Consulta.data == data)
    return [_saida(item) for item in query.order_by(Consulta.data.desc(), Consulta.id.desc()).all()]


@router.get("/consultas", response_model=list[ConsultaOut])
def listar_consultas(data: date | None = None, db: Session = Depends(get_db)):
    return _listagem(db, data=data)


@router.get("/pacientes/{paciente_id}/consultas", response_model=list[ConsultaOut])
def consultas_do_paciente(
    paciente_id: int, data: date | None = None, db: Session = Depends(get_db)
):
    if not db.get(Paciente, paciente_id):
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Paciente não encontrado")
    return _listagem(db, paciente_id, data)


@router.get("/consultas/{consulta_id}", response_model=ConsultaOut)
def obter_consulta(consulta_id: int, db: Session = Depends(get_db)):
    return _saida(_consulta(db, consulta_id))
