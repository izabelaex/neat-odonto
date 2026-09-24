"""Login e conexão Calendar têm consentimentos separados."""
from authlib.integrations.base_client.errors import OAuthError
from joserfc.errors import JoseError
from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import RedirectResponse, Response
from httpx import HTTPError
from sqlalchemy.orm import Session

from app.auth.google import (CALENDAR_SCOPE, LOGIN_SCOPE, calendar_configured,
                             login_configured, oauth, token_cipher)
from app.auth.identity import identify_user
from app.auth.errors import login_error_code
from app.auth.sessions import COOKIE, create_session, get_current_user, revoke_session
from app.config import settings
from app.database import get_db

router = APIRouter(prefix="/auth", tags=["autenticação"])


@router.get("/status")
def auth_status():
    return {"configured": login_configured(), "calendar_configured": calendar_configured()}


@router.get("/me")
def me(user=Depends(get_current_user)):
    return {"id": user.id, "name": user.nome, "email": user.email,
            "calendar_connected": bool(user.google_refresh_token)}


@router.post("/logout", status_code=204)
def logout(request: Request, user=Depends(get_current_user), db: Session = Depends(get_db)):
    revoke_session(request, db)
    db.commit()
    request.session.clear()
    response = Response(status_code=204)
    response.delete_cookie(COOKIE, path="/")
    return response


@router.get("/google/login")
async def google_login(request: Request):
    if not login_configured():
        return RedirectResponse(f"{settings.frontend_url}/login?error=configuration")
    request.session.clear()
    try:
        return await oauth.google.authorize_redirect(
            request, settings.google_redirect_uri, scope=LOGIN_SCOPE, prompt="select_account")
    except (OAuthError, HTTPError) as error:
        return RedirectResponse(f"{settings.frontend_url}/login?error={login_error_code(error)}")


@router.get("/google/calendar")
async def connect_calendar(request: Request, user=Depends(get_current_user)):
    if not calendar_configured():
        return RedirectResponse(f"{settings.frontend_url}/agenda?error=configuration")
    request.session.clear()
    request.session["calendar_subject"] = user.google_subject
    try:
        return await oauth.google.authorize_redirect(
            request, settings.google_redirect_uri, scope=f"{LOGIN_SCOPE} {CALENDAR_SCOPE}",
            access_type="offline", prompt="consent", login_hint=user.email)
    except (OAuthError, HTTPError) as error:
        return RedirectResponse(f"{settings.frontend_url}/agenda?error={login_error_code(error)}")


@router.get("/google/callback")
async def callback(request: Request, db: Session = Depends(get_db)):
    calendar_subject = request.session.get("calendar_subject")
    destination = "/agenda" if calendar_subject else "/login"
    try:
        token = await oauth.google.authorize_access_token(request)
        user = identify_user(token.get("userinfo", {}), db)
        if calendar_subject:
            current = get_current_user(request, db)
            if current.id != user.id or user.google_subject != calendar_subject:
                raise HTTPException(403, "Conta diferente da sessão.")
            if CALENDAR_SCOPE not in token.get("scope", "").split():
                raise HTTPException(403, "Permissão da agenda não concedida.")
            if token.get("refresh_token"):
                user.google_refresh_token = token_cipher().encrypt(token["refresh_token"].encode()).decode()
            if not user.google_refresh_token:
                raise HTTPException(403, "Reconecte a agenda.")
        response = RedirectResponse(f"{settings.frontend_url}/agenda", status_code=303)
        create_session(request, response, user, db)
    except (OAuthError, JoseError, HTTPError, HTTPException, ValueError, KeyError) as error:
        db.rollback()
        response = RedirectResponse(f"{settings.frontend_url}{destination}?error={login_error_code(error)}", status_code=303)
    finally:
        request.session.clear()
    return response
