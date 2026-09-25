"""Datas com fuso explícito; intervalos inválidos são recusados pela API."""
from uuid import UUID

from pydantic import AwareDatetime, BaseModel, Field, field_validator, model_validator


class CalendarEventCreate(BaseModel):
    request_id: UUID
    title: str = Field(min_length=1, max_length=160)
    start: AwareDatetime
    end: AwareDatetime

    @field_validator("title")
    @classmethod
    def trim_title(cls, value):
        if not value.strip():
            raise ValueError("Informe um título.")
        return value.strip()

    @model_validator(mode="after")
    def chronological(self):
        if self.end <= self.start:
            raise ValueError("O término deve ser posterior ao início.")
        return self
