import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies import get_session_service
from app.core.security import Principal, get_current_principal
from app.db.database import get_db
from app.schemas.session import SessionCreate, SessionOut
from app.services.session_service import SessionService

router = APIRouter()


@router.post("/sessions", response_model=SessionOut)
async def create_session(
    body: SessionCreate,
    db: AsyncSession = Depends(get_db),
    session_service: SessionService = Depends(get_session_service),
    principal: Principal = Depends(get_current_principal),
) -> SessionOut:
    session = await session_service.create(
        db, tenant_id=principal.tenant_id, patient_id=body.patient_id
    )
    return SessionOut.model_validate(session)


@router.get("/sessions/{session_id}", response_model=SessionOut)
async def get_session(
    session_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    session_service: SessionService = Depends(get_session_service),
    principal: Principal = Depends(get_current_principal),
) -> SessionOut:
    session = await session_service.get(db, tenant_id=principal.tenant_id, session_id=session_id)
    if session is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")
    return SessionOut.model_validate(session)
