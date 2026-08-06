import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from app.ai.rag.embeddings import EmbeddingProvider
from app.db.models.memory import MemoryItem


class MemoryService:
    """Write side of patient memory. Strictly separate from RagPipeline
    (general clinical knowledge) - every row here is scoped to exactly one
    patient_id and never mixed into the document/chunk tables.
    """

    def __init__(self, embeddings: EmbeddingProvider) -> None:
        self._embeddings = embeddings

    async def add_memory(
        self,
        db: AsyncSession,
        *,
        tenant_id: str,
        patient_id: uuid.UUID,
        category: str,
        content: str,
        source_session_id: uuid.UUID | None = None,
    ) -> MemoryItem:
        [vector] = await self._embeddings.embed([content])
        item = MemoryItem(
            tenant_id=tenant_id,
            patient_id=patient_id,
            category=category,
            content=content,
            embedding=vector,
            source_session_id=source_session_id,
        )
        db.add(item)
        await db.commit()
        await db.refresh(item)
        return item
