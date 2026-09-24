"""Authlib valida assinatura, emissor, audience, expiração e nonce do ID token."""
from authlib.integrations.starlette_client import OAuth
from cryptography.fernet import Fernet
from fastapi import HTTPException

from app.config import settings
from app.tls import tls_context

CALENDAR_SCOPE = "https://www.googleapis.com/auth/calendar.events.owned"
LOGIN_SCOPE = "openid email profile"
oauth = OAuth()
oauth.register(
    name="google", client_id=settings.google_client_id,
    client_secret=settings.google_client_secret,
    server_metadata_url="https://accounts.google.com/.well-known/openid-configuration",
    client_kwargs={"scope": LOGIN_SCOPE, "code_challenge_method": "S256",
                   "timeout": 15, "verify": tls_context},
)


def login_configured():
    return bool(settings.google_client_id and settings.google_client_secret
                and settings.allowed_google_email.strip() and len(settings.secret_key) >= 32
                and settings.secret_key not in {"troque-esta-chave-em-producao",
                                                "gere-uma-chave-aleatoria-aqui"})


def token_cipher():
    try:
        return Fernet(settings.google_token_key.encode())
    except (ValueError, TypeError):
        raise HTTPException(503, "A conexão com a agenda ainda não foi configurada.")


def calendar_configured():
    try:
        token_cipher()
        return login_configured()
    except HTTPException:
        return False
