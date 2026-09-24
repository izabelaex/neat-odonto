"""Ponto de entrada da API do Neat Odonto.

Cada responsável por uma área cria seu router em app/routers/ e registra aqui.
Mantenha este arquivo pequeno: ele é tocado por todo mundo e é onde os conflitos
de merge aparecem.
"""

import logging

from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.sessions import SessionMiddleware

from app.auth.middleware import RedactCallback, private_responses
from app.auth.sessions import get_current_user
from app.config import settings

app = FastAPI(title="Neat Odonto", version="0.1.0")
logging.getLogger("uvicorn.access").addFilter(RedactCallback())
app.middleware("http")(private_responses)
app.add_middleware(SessionMiddleware, secret_key=settings.secret_key,
                   session_cookie="neat_oauth", max_age=600,
                   same_site="lax", https_only=settings.cookie_secure)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_url.rstrip("/")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/saude")
def saude():
    return {"status": "ok"}


# Registre os routers de cada área abaixo, um por linha:
from app.routers import auth, calendar, pacientes

app.include_router(auth.router)
app.include_router(calendar.router)
app.include_router(pacientes.router, dependencies=[Depends(get_current_user)])
