import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models.chat import ChatSession


class SessionService:
    async def create(
        self, db: AsyncSession, *, tenant_id: str, patient_id: uuid.UUID | None
    ) -> ChatSession:
        session = ChatSession(tenant_id=tenant_id, patient_id=patient_id)
        db.add(session)
        await db.commit()
        await db.refresh(session)
        return session

    async def get(
        self, db: AsyncSession, *, tenant_id: str, session_id: uuid.UUID
    ) -> ChatSession | None:
        stmt = select(ChatSession).where(
            ChatSession.id == session_id, ChatSession.tenant_id == tenant_id
        )
        return (await db.execute(stmt)).scalar_one_or_none()

    async def get_or_create(
        self, db: AsyncSession, *, tenant_id: str, session_id: uuid.UUID | None, patient_id: uuid.UUID | None
    ) -> ChatSession:
        if session_id is not None:
            existing = await self.get(db, tenant_id=tenant_id, session_id=session_id)
            if existing is not None:
                return existing
        return await self.create(db, tenant_id=tenant_id, patient_id=patient_id)
