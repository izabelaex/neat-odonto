"""Modelos do domínio Neat Odonto.

Decisões registradas (ver AGENTS.md):
- Um único dentista usa o sistema. Não há coluna de "dono" nas tabelas.
- Autenticação local (e-mail + senha). A agenda do Google entra por link, não por API.
- Valores monetários são inteiros em centavos. Nunca float.
"""

from app.models.usuario import Usuario
from app.models.paciente import Paciente, DocumentoPaciente
from app.models.consulta import Consulta, RegistroEsterilizacao
from app.models.tratamento import PlanoTratamento, Parcela, Pagamento

__all__ = [
    "Usuario",
    "Paciente",
    "DocumentoPaciente",
    "Consulta",
    "RegistroEsterilizacao",
    "PlanoTratamento",
    "Parcela",
    "Pagamento",
]
