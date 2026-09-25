"""Configuração da aplicação, lida de variáveis de ambiente."""

from functools import lru_cache
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = "sqlite:///./neat_odonto.db"

    # Sessão local após autenticação Google
    secret_key: str = "troque-esta-chave-em-producao"
    access_token_expire_minutes: int = 60 * 8

    # Pasta onde ficam fotos, radiografias e imagens de pacote de esterilização
    upload_dir: str = "./uploads"

    frontend_url: str = "http://localhost:5173"
    cookie_secure: bool = False
    google_client_id: str = ""
    google_client_secret: str = ""
    google_redirect_uri: str = "http://localhost:8000/auth/google/callback"
    allowed_google_email: str = ""
    google_token_key: str = ""
    # Somente calendário de propriedade da conta autorizada.
    google_calendar_id: str = "primary"
    # Compatibilidade com .env antigo; não utilizado pela integração nova.
    google_calendar_embed_url: str = ""

    class Config:
        env_file = ".env"


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
