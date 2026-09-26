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


def formulario_consulta(
    data: date = Form(...),
    procedimentos_realizados: str = Form(...),
    observacoes: str | None = Form(None),
    identificacao_pacote: str | None = Form(None),
    foto_pacote: UploadFile | None = File(None),
    ciclo: str = Form(..., max_length=60),
    data_ciclo: date = Form(...),
    responsavel: str = Form(..., max_length=120),
    remover_foto: bool = Form(False),
):
    return {
        "data": data,
        "procedimentos_realizados": procedimentos_realizados,
        "observacoes": observacoes,
        "identificacao_pacote": identificacao_pacote,
        "foto_pacote": foto_pacote,
        "ciclo": ciclo,
        "data_ciclo": data_ciclo,
        "responsavel": responsavel,
        "remover_foto": remover_foto,
    }


def _gravar(db: Session, consulta: Consulta, paciente_id: int, dados: dict) -> ConsultaOut:
    if not db.get(Paciente, paciente_id):
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Paciente não encontrado")
    procedimentos = dados["procedimentos_realizados"].strip()
    foto = dados["foto_pacote"]
    if foto and dados["remover_foto"]:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, "Escolha entre trocar ou remover a foto")
    if foto and foto.content_type not in TIPOS_FOTO:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, "Use uma foto JPG, PNG ou WebP")
    registro = next(iter(consulta.registros_esterilizacao), None)
    identificacao = (dados["identificacao_pacote"] or "").strip() or None
    ciclo = dados["ciclo"].strip()
    responsavel = dados["responsavel"].strip()
    foto_anterior = registro.foto_pacote_caminho if registro else None
    if not procedimentos or not ciclo or not responsavel:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, "Complete os procedimentos e a esterilização")
    if not (identificacao or foto or (foto_anterior and not dados["remover_foto"])):
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, "Identifique o pacote por texto ou foto")

    consulta.paciente_id = paciente_id
    consulta.data = dados["data"]
    consulta.procedimentos_realizados = procedimentos
    consulta.observacoes = (dados["observacoes"] or "").strip() or None
    db.add(consulta)
    nova_foto = None
    apagar_foto = None
    try:
        db.flush()
        if foto:
            pasta = Path(settings.upload_dir) / "consultas" / str(consulta.id)
            pasta.mkdir(parents=True, exist_ok=True)
            nova_foto = pasta / f"{uuid.uuid4().hex}{TIPOS_FOTO[foto.content_type]}"
            with nova_foto.open("wb") as destino:
                while trecho := foto.file.read(1024 * 1024):
                    destino.write(trecho)
        if not registro:
            registro = RegistroEsterilizacao(consulta_id=consulta.id)
            db.add(registro)
        registro.identificacao_pacote = identificacao
        registro.foto_pacote_caminho = str(nova_foto) if nova_foto else (
            None if dados["remover_foto"] else foto_anterior
        )
        registro.ciclo = ciclo
        registro.data_ciclo = dados["data_ciclo"]
        registro.responsavel = responsavel
        if foto_anterior and (nova_foto or dados["remover_foto"]):
            apagar_foto = Path(foto_anterior)
        db.commit()
    except IntegrityError:
        db.rollback()
        if nova_foto:
            nova_foto.unlink(missing_ok=True)
        raise HTTPException(status.HTTP_409_CONFLICT, "Agendamento já registrado como consulta")
    except Exception:
        db.rollback()
        if nova_foto:
            nova_foto.unlink(missing_ok=True)
        raise

    if apagar_foto:
        apagar_foto.unlink(missing_ok=True)
    return _saida(_consulta(db, consulta.id))


@router.post(
    "/pacientes/{paciente_id}/consultas",
    response_model=ConsultaOut,
    status_code=status.HTTP_201_CREATED,
)
def criar_consulta(
    paciente_id: int,
    google_event_id: str | None = Form(None, max_length=1024, pattern=r"^[A-Za-z0-9_-]+$"),
    dados: dict = Depends(formulario_consulta), db: Session = Depends(get_db),
):
    return _gravar(db, Consulta(google_event_id=google_event_id), paciente_id, dados)


@router.put("/consultas/{consulta_id}", response_model=ConsultaOut)
def atualizar_consulta(
    consulta_id: int,
    paciente_id: int = Form(...),
    dados: dict = Depends(formulario_consulta),
    db: Session = Depends(get_db),
):
    return _gravar(db, _consulta(db, consulta_id), paciente_id, dados)


@router.get("/consultas/{consulta_id}/esterilizacao/foto")
def foto_esterilizacao(consulta_id: int, db: Session = Depends(get_db)):
    registro = next(iter(_consulta(db, consulta_id).registros_esterilizacao), None)
    if not registro or not registro.foto_pacote_caminho:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Foto não encontrada")
    caminho = Path(registro.foto_pacote_caminho)
    if not caminho.is_file():
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Foto não encontrada")
    return FileResponse(caminho)
