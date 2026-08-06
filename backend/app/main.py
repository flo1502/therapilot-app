from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.dependencies import build_container
from app.api.routes import chat, documents, health, patients, sessions
from app.core.config import get_settings
from app.core.logging import configure_logging, get_logger

logger = get_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    configure_logging()
    app.state.container = build_container()
    logger.info("startup complete")
    yield


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(title="Therapilot AI Backend", lifespan=lifespan)

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(health.router, prefix="/api")
    app.include_router(chat.router, prefix="/api")
    app.include_router(sessions.router, prefix="/api")
    app.include_router(patients.router, prefix="/api")
    app.include_router(documents.router, prefix="/api")

    return app


app = create_app()
