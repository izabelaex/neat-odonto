"""Configuração da aplicação, lida de variáveis de ambiente."""

from functools import lru_cache
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = "sqlite:///./neat_odonto.db"

    # Autenticação local
    secret_key: str = "troque-esta-chave-em-producao"
    access_token_expire_minutes: int = 60 * 8

    # Pasta onde ficam fotos, radiografias e imagens de pacote de esterilização
    upload_dir: str = "./uploads"

    # Link público da agenda do Google, embutido via iframe na tela de agenda.
    # Não usamos a API do Google: a integração é por link.
    google_calendar_embed_url: str = ""

    class Config:
        env_file = ".env"


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
