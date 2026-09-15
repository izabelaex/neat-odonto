"""Ponto de entrada da API do Neat Odonto.

Cada responsável por uma área cria seu router em app/routers/ e registra aqui.
Mantenha este arquivo pequeno: ele é tocado por todo mundo e é onde os conflitos
de merge aparecem.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Neat Odonto", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/saude")
def saude():
    return {"status": "ok"}


# Registre os routers de cada área abaixo, um por linha:
# from app.routers import pacientes
# app.include_router(pacientes.router)
