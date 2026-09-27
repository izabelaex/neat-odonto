"""Agenda externa: agendamentos não criam atendimentos clínicos no banco."""
from datetime import timedelta

from fastapi import APIRouter, Depends, HTTPException, Path, Query, Response
from httpx import HTTPError
from pydantic import AwareDatetime
from sqlalchemy.orm import Session

from app.auth.sessions import get_current_user
from app.database import get_db
from app.models.consulta import Consulta
from app.models.paciente import Paciente
from app.schemas.calendar import CalendarEventCreate
from app.services.google_calendar import access_token, calendar_request, public_event

router = APIRouter(prefix="/agenda", tags=["agenda"])


def events_with_patients(events, db):
    items = [public_event(event) for event in events]
    patient_ids = {item["patient_id"] for item in items if item["patient_id"]}
    names = dict(db.query(Paciente.id, Paciente.nome).filter(Paciente.id.in_(patient_ids)).all()) if patient_ids else {}
    for item in items:
        item["patient_name"] = names.get(item["patient_id"])
    return items


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
                  "singleEvents": "true", "orderBy": "startTime", "maxResults": 100,
                  "privateExtendedProperty": "neat_odonto=appointment"}
        if page_token:
            params["pageToken"] = page_token
        data = await calendar_request("GET", token, params=params)
        items = [e for e in data.get("items", []) if e.get("status") != "cancelled"
                 and public_event(e)["can_register"]]
        ids = [e["id"] for e in items]
        completed = {row[0] for row in db.query(Consulta.google_event_id)
                     .filter(Consulta.google_event_id.in_(ids)).all()} if ids else set()
        return {"items": events_with_patients([e for e in items if e["id"] not in completed], db),
                "next_page_token": data.get("nextPageToken")}
    except (HTTPError, ValueError, KeyError):
        raise HTTPException(502, "O Google não respondeu. Tente novamente.")


@router.post("/eventos", status_code=201)
async def create_event(draft: CalendarEventCreate, user=Depends(get_current_user),
                       db: Session = Depends(get_db)):
    patient = db.get(Paciente, draft.patient_id)
    if not patient:
        raise HTTPException(404, "Paciente não encontrado.")
    try:
        token = await access_token(user, db)
        event = await calendar_request("POST", token, json={
            "id": draft.request_id.hex, "summary": draft.title,
            "start": {"dateTime": draft.start.isoformat()},
            "end": {"dateTime": draft.end.isoformat()},
            "extendedProperties": {"private": {"neat_odonto": "appointment",
                                                   "patient_id": str(patient.id)}},
        })
        return events_with_patients([event], db)[0]
    except (HTTPError, ValueError, KeyError):
        raise HTTPException(502, "Não foi possível confirmar o agendamento. Tente novamente.")


@router.get("/eventos/{event_id}")
async def get_event(
    event_id: str = Path(min_length=1, max_length=1024, pattern=r"^[A-Za-z0-9_-]+$"),
    user=Depends(get_current_user), db: Session = Depends(get_db),
):
    if db.query(Consulta.id).filter_by(google_event_id=event_id).first():
        raise HTTPException(409, "Agendamento já registrado como consulta.")
    try:
        event = events_with_patients([
            await calendar_request("GET", await access_token(user, db), event_id=event_id)
        ], db)[0]
    except (HTTPError, ValueError, KeyError):
        raise HTTPException(502, "Não foi possível carregar o agendamento.")
    if not event["can_register"] or event["status"] == "cancelled":
        raise HTTPException(404, "Agendamento não criado no sistema.")
    return event


@router.delete("/eventos/{event_id}", status_code=204)
async def delete_event(
    event_id: str = Path(min_length=1, max_length=1024, pattern=r"^[A-Za-z0-9_-]+$"),
    user=Depends(get_current_user), db: Session = Depends(get_db),
):
    try:
        token = await access_token(user, db)
        event = public_event(await calendar_request("GET", token, event_id=event_id))
        if not event["can_register"]:
            raise HTTPException(404, "Agendamento não criado no sistema.")
        await calendar_request("DELETE", token, event_id=event_id,
                               params={"sendUpdates": "none"})
        return Response(status_code=204)
    except (HTTPError, ValueError, KeyError):
        raise HTTPException(502, "Não foi possível confirmar a exclusão. Atualize a agenda e tente novamente.")
