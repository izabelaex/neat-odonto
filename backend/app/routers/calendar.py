"""Agenda externa: agendamentos não criam atendimentos clínicos no banco."""
from datetime import timedelta

from fastapi import APIRouter, Depends, HTTPException, Path, Query, Response
from httpx import HTTPError
from pydantic import AwareDatetime
from sqlalchemy.orm import Session

from app.auth.sessions import get_current_user
from app.database import get_db
from app.schemas.calendar import CalendarEventCreate
from app.services.google_calendar import access_token, calendar_request, public_event

router = APIRouter(prefix="/agenda", tags=["agenda"])


@router.get("/eventos")
async def list_events(
    start: AwareDatetime, end: AwareDatetime,
    page_token: str | None = Query(default=None, max_length=4096),
    user=Depends(get_current_user), db: Session = Depends(get_db),
):
    if end <= start or end - start > timedelta(days=32):
        raise HTTPException(422, "Selecione um intervalo de até 32 dias, com início antes do fim.")
    try:
        token = await access_token(user, db)
        params = {"timeMin": start.isoformat(), "timeMax": end.isoformat(),
                  "singleEvents": "true", "orderBy": "startTime", "maxResults": 100}
        if page_token:
            params["pageToken"] = page_token
        data = await calendar_request("GET", token, params=params)
        return {"items": [public_event(e) for e in data.get("items", [])
                          if e.get("status") != "cancelled"],
                "next_page_token": data.get("nextPageToken")}
    except (HTTPError, ValueError, KeyError):
        raise HTTPException(502, "O Google não respondeu. Tente novamente.")


@router.post("/eventos", status_code=201)
async def create_event(draft: CalendarEventCreate, user=Depends(get_current_user),
                       db: Session = Depends(get_db)):
    try:
        token = await access_token(user, db)
        event = await calendar_request("POST", token, json={
            "id": draft.request_id.hex, "summary": draft.title,
            "start": {"dateTime": draft.start.isoformat()},
            "end": {"dateTime": draft.end.isoformat()},
        })
        return public_event(event)
    except (HTTPError, ValueError, KeyError):
        raise HTTPException(502, "Não foi possível confirmar o agendamento. Tente novamente.")


@router.delete("/eventos/{event_id}", status_code=204)
async def delete_event(
    event_id: str = Path(min_length=1, max_length=1024, pattern=r"^[A-Za-z0-9_-]+$"),
    user=Depends(get_current_user), db: Session = Depends(get_db),
):
    try:
        token = await access_token(user, db)
        await calendar_request("DELETE", token, event_id=event_id,
                               params={"sendUpdates": "none"})
        return Response(status_code=204)
    except (HTTPError, ValueError, KeyError):
        raise HTTPException(502, "Não foi possível confirmar a exclusão. Atualize a agenda e tente novamente.")
