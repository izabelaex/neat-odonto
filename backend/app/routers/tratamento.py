"""Plano de tratamento, orçamento, parcelas e pagamentos (história 8)."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.paciente import Paciente
from app.models.tratamento import Parcela, PlanoTratamento
from app.schemas.tratamento import PlanoTratamentoCreate, PlanoTratamentoOut

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
