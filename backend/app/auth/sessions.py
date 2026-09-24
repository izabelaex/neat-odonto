"""Cookie opaco, expiração no servidor e verificação de origem nas escritas."""
import hashlib
import secrets
from datetime import datetime, timedelta, timezone

from fastapi import Depends, HTTPException, Request
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.models.auth_session import AuthSession
from app.models.usuario import Usuario

COOKIE = "neat_session"


def utc_now():
    return datetime.now(timezone.utc).replace(tzinfo=None)


def session_hash(token):
    return hashlib.sha256(token.encode()).hexdigest()


def revoke_session(request, db):
    token = request.cookies.get(COOKIE, "")
    db.query(AuthSession).filter_by(token_hash=session_hash(token)).delete()


def create_session(request, response, user, db):
    revoke_session(request, db)
    db.query(AuthSession).filter(AuthSession.expires_at <= utc_now()).delete()
    token = secrets.token_urlsafe(32)
    seconds = settings.access_token_expire_minutes * 60
    db.add(AuthSession(token_hash=session_hash(token), user_id=user.id,
                       expires_at=utc_now() + timedelta(seconds=seconds)))
    db.commit()
    response.set_cookie(COOKIE, token, max_age=seconds, httponly=True,
                        secure=settings.cookie_secure, samesite="lax", path="/")


def get_current_user(request: Request, db: Session = Depends(get_db)):
    token = request.cookies.get(COOKIE, "")
    session = db.get(AuthSession, session_hash(token)) if token else None
    if not session or session.expires_at <= utc_now():
        raise HTTPException(401, "Sua sessão expirou. Entre novamente.")
    user = db.get(Usuario, session.user_id)
    if not user or user.email.casefold() != settings.allowed_google_email.strip().casefold():
        raise HTTPException(401, "Conta não autorizada.")
    if request.method not in {"GET", "HEAD", "OPTIONS"}:
        if request.headers.get("origin") != settings.frontend_url.rstrip("/"):
            raise HTTPException(403, "Origem da solicitação não autorizada.")
    return user
