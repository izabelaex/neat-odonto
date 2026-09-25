"""Credenciais Google nunca são enviadas para o navegador."""
from urllib.parse import quote

import httpx
from cryptography.fernet import InvalidToken
from fastapi import HTTPException

from app.auth.google import token_cipher
from app.config import settings
from app.tls import tls_context


async def access_token(user, db):
    if not user.google_refresh_token:
        raise HTTPException(409, "Conecte sua agenda do Google para continuar.")
    try:
        refresh = token_cipher().decrypt(user.google_refresh_token.encode()).decode()
    except InvalidToken:
        raise HTTPException(409, "Reconecte a agenda: a chave de proteção foi alterada.")
    async with httpx.AsyncClient(timeout=15, verify=tls_context) as client:
        response = await client.post("https://oauth2.googleapis.com/token", data={
            "client_id": settings.google_client_id, "client_secret": settings.google_client_secret,
            "refresh_token": refresh, "grant_type": "refresh_token",
        })
    if response.status_code == 400 and response.json().get("error") == "invalid_grant":
        user.google_refresh_token = None
        db.commit()
        raise HTTPException(409, "A autorização do Google expirou. Reconecte sua agenda.")
    check_response(response)
    data = response.json()
    if data.get("refresh_token"):
        user.google_refresh_token = token_cipher().encrypt(data["refresh_token"].encode()).decode()
        db.commit()
    return data["access_token"]


def check_response(response):
    if response.status_code in {401, 403}:
        raise HTTPException(409, "Verifique a permissão da agenda e reconecte sua conta.")
    if response.status_code == 429:
        raise HTTPException(503, "O Google atingiu o limite de solicitações. Tente mais tarde.")
    if response.status_code >= 400:
        raise HTTPException(502, "Não foi possível acessar a agenda do Google.")


async def calendar_request(method, token, event_id=None, **kwargs):
    calendar_id = quote(settings.google_calendar_id, safe="")
    url = f"https://www.googleapis.com/calendar/v3/calendars/{calendar_id}/events"
    if event_id:
        url += f"/{quote(event_id, safe='')}"
    async with httpx.AsyncClient(timeout=15, verify=tls_context) as client:
        response = await client.request(method, url, headers={"Authorization": f"Bearer {token}"}, **kwargs)
    # Um ID estável permite repetir a criação após falha de rede sem duplicar o evento.
    if method == "POST" and response.status_code == 409:
        async with httpx.AsyncClient(timeout=15, verify=tls_context) as client:
            response = await client.get(f"{url}/{kwargs['json']['id']}",
                                        headers={"Authorization": f"Bearer {token}"})
    if method == "DELETE" and response.status_code in {204, 404, 410}:
        return None
    check_response(response)
    return response.json()


def public_event(event):
    return {"id": event["id"], "title": event.get("summary", "Sem título"),
            "start": event.get("start", {}), "end": event.get("end", {}),
            "status": event.get("status", "confirmed")}
