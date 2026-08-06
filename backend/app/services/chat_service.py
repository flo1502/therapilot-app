import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.ai.models.base import ChatMessage
from app.ai.orchestrator.orchestrator import AIOrchestrator
from app.ai.orchestrator.schemas import OrchestratorInput, OrchestratorOutput
from app.db.models.chat import Message
from app.services.session_service import SessionService

_HISTORY_LIMIT = 20


class ChatService:
    def __init__(self, orchestrator: AIOrchestrator, session_service: SessionService) -> None:
        self._orchestrator = orchestrator
        self._session_service = session_service

    async def handle_message(
        self,
        db: AsyncSession,
        *,
        tenant_id: str,
        patient_id: uuid.UUID | None,
        session_id: uuid.UUID | None,
        user_message: str,
    ) -> tuple[uuid.UUID, OrchestratorOutput]:
        session = await self._session_service.get_or_create(
            db, tenant_id=tenant_id, session_id=session_id, patient_id=patient_id
        )
        history = await self._load_history(db, session_id=session.id)

        db.add(Message(session_id=session.id, role="user", content=user_message))
        await db.commit()

        result = await self._orchestrator.execute(
            OrchestratorInput(
                user_message=user_message,
                patient_id=patient_id,
                session_id=session.id,
                tenant_id=tenant_id,
                conversation_history=history,
            ),
            db,
        )

        db.add(
            Message(
                session_id=session.id,
                role="assistant",
                content=result.message,
                model_used=result.model_used,
                risk_level=result.risk_level,
            )
        )
        await db.commit()

        return session.id, result

    async def _load_history(self, db: AsyncSession, *, session_id: uuid.UUID) -> list[ChatMessage]:
        stmt = (
            select(Message)
            .where(Message.session_id == session_id)
            .order_by(Message.created_at.desc())
            .limit(_HISTORY_LIMIT)
        )
        rows = list((await db.execute(stmt)).scalars())
        rows.reverse()
        return [ChatMessage(role=row.role, content=row.content) for row in rows]
