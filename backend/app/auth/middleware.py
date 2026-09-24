"""Evita cache de dados privados e códigos OAuth em logs de acesso."""
import logging


class RedactCallback(logging.Filter):
    def filter(self, record):
        if isinstance(record.args, tuple) and len(record.args) == 5:
            args = list(record.args)
            if str(args[2]).startswith("/auth/google/callback"):
                args[2] = "/auth/google/callback"
                record.args = tuple(args)
        return True


async def private_responses(request, call_next):
    response = await call_next(request)
    response.headers["Cache-Control"] = "no-store"
    response.headers["Referrer-Policy"] = "no-referrer"
    return response
