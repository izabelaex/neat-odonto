"""Códigos públicos de erro, sem expor respostas, tokens ou segredos do Google."""
import logging

from fastapi import HTTPException
from httpx import HTTPError
from joserfc.errors import JoseError


def login_error_code(error):
    code = classify_error(error)
    logging.getLogger("uvicorn.error").warning("Google OAuth: %s (%s)", code, type(error).__name__)
    return code


def classify_error(error):
    code = getattr(error, "error", "")
    if code == "mismatching_state":
        return "expired_attempt"
    if code in {"invalid_client", "unauthorized_client"}:
        return "client_configuration"
    if code == "invalid_grant":
        return "invalid_code"
    if code == "access_denied":
        return "consent_denied"
    if isinstance(error, HTTPException) and error.status_code in {401, 403}:
        return "account_denied"
    if isinstance(error, JoseError):
        return "invalid_identity"
    if isinstance(error, HTTPError):
        return "google_connection"
    return "google"
