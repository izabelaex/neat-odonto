"""Plano de tratamento, orçamento, parcelas e pagamentos (história 8)."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.paciente import Paciente
from app.models.tratamento import Pagamento, Parcela, PlanoTratamento
from app.schemas.tratamento import (
    PagamentoCreate,
    PlanoTratamentoCreate,
    PlanoTratamentoOut,
    PlanoTratamentoUpdate,
)

router = APIRouter(tags=["tratamento"])


def dividir_em_parcelas(total_centavos: int, numero_parcelas: int) -> list[int]:
    """Divide o total em parcelas iguais; os centavos que sobram vão para as primeiras.

    Ex.: 1000 em 3 -> [334, 333, 333]. A soma é sempre exatamente o total.
    """
    base, resto = divmod(total_centavos, numero_parcelas)
    return [base + 1 if i < resto else base for i in range(numero_parcelas)]


@router.post(
    "/pacientes/{paciente_id}/planos-tratamento",
    response_model=PlanoTratamentoOut,
    status_code=status.HTTP_201_CREATED,
)
def criar_plano(paciente_id: int, dados: PlanoTratamentoCreate, db: Session = Depends(get_db)):
    if not db.get(Paciente, paciente_id):
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Paciente não encontrado")
    if dados.numero_parcelas > dados.valor_total_centavos:
        raise HTTPException(
            status.HTTP_422_UNPROCESSABLE_ENTITY, "Mais parcelas do que centavos no orçamento"
        )

    plano = PlanoTratamento(
        paciente_id=paciente_id,
        procedimentos=dados.procedimentos,
        valor_total_centavos=dados.valor_total_centavos,
    )
    valores = dividir_em_parcelas(dados.valor_total_centavos, dados.numero_parcelas)
    plano.parcelas = [
        Parcela(numero=numero, valor_centavos=valor)
        for numero, valor in enumerate(valores, start=1)
    ]
    db.add(plano)
    db.commit()
    db.refresh(plano)
    return plano


@router.get(
    "/pacientes/{paciente_id}/planos-tratamento", response_model=list[PlanoTratamentoOut]
)
def listar_planos(paciente_id: int, db: Session = Depends(get_db)):
    """Planos do paciente, do mais recente para o mais antigo."""
    if not db.get(Paciente, paciente_id):
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Paciente não encontrado")
    return (
        db.query(PlanoTratamento)
        .filter(PlanoTratamento.paciente_id == paciente_id)
        .order_by(PlanoTratamento.criado_em.desc(), PlanoTratamento.id.desc())
        .all()
    )


def obter_plano_ou_404(plano_id: int, db: Session) -> PlanoTratamento:
    plano = db.get(PlanoTratamento, plano_id)
    if not plano:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Plano de tratamento não encontrado")
    return plano


@router.get("/planos-tratamento/{plano_id}", response_model=PlanoTratamentoOut)
def obter_plano(plano_id: int, db: Session = Depends(get_db)):
    return obter_plano_ou_404(plano_id, db)


@router.put("/planos-tratamento/{plano_id}", response_model=PlanoTratamentoOut)
def atualizar_plano(plano_id: int, dados: PlanoTratamentoUpdate, db: Session = Depends(get_db)):
    """Edita procedimentos e status. O orçamento e as parcelas não mudam aqui."""
    plano = obter_plano_ou_404(plano_id, db)
    for campo, valor in dados.model_dump(exclude_none=True).items():
        setattr(plano, campo, valor)
    db.commit()
    db.refresh(plano)
    return plano


@router.post(
    "/parcelas/{parcela_id}/pagamentos",
    response_model=PlanoTratamentoOut,
    status_code=status.HTTP_201_CREATED,
)
def registrar_pagamento(parcela_id: int, dados: PagamentoCreate, db: Session = Depends(get_db)):
    """Registra dinheiro que entrou numa parcela. Aceita pagamento parcial.

    Devolve o plano inteiro, já com os totais recalculados, para a tela atualizar.
    """
    parcela = db.get(Parcela, parcela_id)
    if not parcela:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Parcela não encontrada")
    restante = parcela.valor_centavos - parcela.valor_pago_centavos
    if dados.valor_centavos > restante:
        raise HTTPException(
            status.HTTP_422_UNPROCESSABLE_ENTITY,
            "Pagamento maior do que o valor que falta nesta parcela",
        )
    db.add(Pagamento(parcela_id=parcela_id, **dados.model_dump()))
    db.commit()
    plano = parcela.plano
    db.refresh(plano)
    return plano


@router.delete("/planos-tratamento/{plano_id}", status_code=status.HTTP_204_NO_CONTENT)
def remover_plano(plano_id: int, db: Session = Depends(get_db)):
    """Remove o plano junto com suas parcelas e pagamentos."""
    db.delete(obter_plano_ou_404(plano_id, db))
    db.commit()


@router.delete("/pagamentos/{pagamento_id}", response_model=PlanoTratamentoOut)
def remover_pagamento(pagamento_id: int, db: Session = Depends(get_db)):
    """Desfaz um pagamento lançado por engano. Devolve o plano atualizado."""
    pagamento = db.get(Pagamento, pagamento_id)
    if not pagamento:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Pagamento não encontrado")
    plano = pagamento.parcela.plano
    db.delete(pagamento)
    db.commit()
    db.refresh(plano)
    return plano
