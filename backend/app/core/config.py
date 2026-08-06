from functools import lru_cache
from typing import Literal

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    app_env: Literal["development", "test", "production"] = "development"
    log_level: str = "INFO"
    api_key: str | None = None
    cors_origins: list[str] = ["http://localhost:5173"]

    # Internal AI routing/model metadata (model_used, rag_used, sources) is
    # useful to a therapist-facing caller but shouldn't necessarily reach a
    # patient-facing surface. Flip to False for that deployment shape - see
    # api/routes/chat.py.
    expose_internal_ai_metadata: bool = True

    local_llm_provider: Literal["http", "mock"] = "mock"
    local_llm_base_url: str = "http://localhost:8000/v1"
    local_llm_model: str = "local-therapy-llm"

    frontier_llm_enabled: bool = False
    frontier_llm_base_url: str = "https://api.openai.com/v1"
    frontier_llm_api_key: str | None = None
    frontier_llm_model: str = "gpt-4o-mini"

    embedding_provider: Literal["http", "mock"] = "mock"
    embedding_base_url: str = "http://localhost:8000/v1"
    embedding_model: str = "nomic-embed-text"
    embedding_dim: int = 768

    rag_top_k: int = 8
    rerank_top_k: int = 4

    database_url: str = (
        "postgresql+asyncpg://therapilot:therapilot@localhost:5433/therapilot_backend"
    )

    @property
    def sync_database_url(self) -> str:
        """Alembic runs migrations synchronously; swap the async driver for psycopg2."""
        return self.database_url.replace("postgresql+asyncpg://", "postgresql+psycopg2://")


@lru_cache
def get_settings() -> Settings:
    return Settings()
