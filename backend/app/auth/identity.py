"""Autoriza uma única conta; usa o sub Google como identidade estável."""
from fastapi import HTTPException

from app.config import settings
from app.models.usuario import Usuario


def identify_user(claims, db):
    email = str(claims.get("email", "")).casefold()
    subject = claims.get("sub")
    allowed = settings.allowed_google_email.strip().casefold()
    if not allowed or email != allowed or claims.get("email_verified") is not True or not subject:
        raise HTTPException(403, "Conta não autorizada.")
    user = db.query(Usuario).filter_by(google_subject=subject).first()
    if user is None:
        user = db.query(Usuario).filter(Usuario.email == email).first()
    if user and user.google_subject not in {None, subject}:
        raise HTTPException(403, "Conta não autorizada.")
    if user is None:
        user = Usuario(email=email)
        db.add(user)
    user.google_subject = subject
    user.email = email
    user.nome = str(claims.get("name") or email)[:120]
    db.flush()
    return user
