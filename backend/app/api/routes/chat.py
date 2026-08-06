from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies import Container, get_chat_service, get_container
from app.core.security import Principal, get_current_principal
from app.db.database import get_db
from app.schemas.chat import ChatRequest, ChatResponse, SourceOut
from app.services.chat_service import ChatService

router = APIRouter()


@router.post("/chat")
async def chat(
    body: ChatRequest,
    db: AsyncSession = Depends(get_db),
    chat_service: ChatService = Depends(get_chat_service),
    container: Container = Depends(get_container),
    principal: Principal = Depends(get_current_principal),
) -> dict:
    session_id, result = await chat_service.handle_message(
        db,
        tenant_id=principal.tenant_id,
        patient_id=body.patient_id,
        session_id=body.session_id,
        user_message=body.message,
    )

    full = ChatResponse(
        session_id=session_id,
        message=result.message,
        model_used=result.model_used,
        rag_used=result.rag_used,
        sources=[
            SourceOut(document_id=s.document_id, chunk_id=s.chunk_id, title=s.title, source=s.source)
            for s in result.sources
        ],
        risk_level=result.risk_level,
    )

    if container.settings.expose_internal_ai_metadata:
        return full.model_dump(mode="json")

    # Patient-facing deployment shape: drop internal routing/model details,
    # keep only what's needed to render the conversation and react to risk.
    return {
        "session_id": full.session_id,
        "message": full.message,
        "risk_level": full.risk_level,
    }
