from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies import Container, get_container
from app.db.database import get_db

router = APIRouter()


@router.get("/health")
async def health(
    db: AsyncSession = Depends(get_db),
    container: Container = Depends(get_container),
) -> dict:
    try:
        await db.execute(text("SELECT 1"))
        db_ok = True
    except Exception:
        db_ok = False

    local_llm_ok = await container.local_llm.health_check()
    frontier_llm_ok = await container.frontier_llm.health_check()

    status = "ok" if db_ok and local_llm_ok else "degraded"
    return {
        "status": status,
        "database": db_ok,
        "local_llm": local_llm_ok,
        "frontier_llm": frontier_llm_ok,
    }
