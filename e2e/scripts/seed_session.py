"""Cria o usuário e a sessão autenticada usados pelos testes E2E.

Roda contra o banco isolado de teste (ver support/env.js e global-setup.js),
com DATABASE_URL e E2E_TEST_EMAIL vindos do ambiente. Não existe bypass de
login no backend (ver SETUP.md) — este script cria a sessão direto no banco,
do mesmo jeito que auth/sessions.create_session faz depois do callback do
Google, sem precisar de uma conta Google real.

Precisa rodar com cwd=backend/, para o pacote "app" ser importável.
"""
import json
import os
import secrets
import sys
from datetime import timedelta

sys.path.insert(0, os.getcwd())

from app.auth.sessions import session_hash, utc_now  # noqa: E402
from app.database import SessionLocal  # noqa: E402
from app.models.auth_session import AuthSession  # noqa: E402
from app.models.usuario import Usuario  # noqa: E402

EMAIL = os.environ["E2E_TEST_EMAIL"]

db = SessionLocal()
try:
    usuario = db.query(Usuario).filter(Usuario.email == EMAIL).first()
    if usuario is None:
        usuario = Usuario(nome="Dentista de teste E2E", email=EMAIL)
        db.add(usuario)
        db.commit()
        db.refresh(usuario)

    db.query(AuthSession).filter(AuthSession.user_id == usuario.id).delete()
    token = secrets.token_urlsafe(32)
    db.add(AuthSession(
        token_hash=session_hash(token),
        user_id=usuario.id,
        expires_at=utc_now() + timedelta(hours=8),
    ))
    db.commit()
finally:
    db.close()

print(json.dumps({"token": token, "email": EMAIL}))
