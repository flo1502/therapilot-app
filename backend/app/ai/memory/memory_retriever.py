import uuid
from dataclasses import dataclass

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.ai.rag.embeddings import EmbeddingProvider
from app.db.models.memory import MemoryItem


@dataclass(frozen=True)
class RetrievedMemory:
    memory_id: uuid.UUID
    category: str
    content: str
    score: float


class MemoryRetriever:
    """Read side of patient memory. `patient_id` is a hard filter, never a
    ranking signal - a query must not be able to pull another patient's
    memory into context, regardless of semantic similarity.
    """

    def __init__(self, embeddings: EmbeddingProvider) -> None:
        self._embeddings = embeddings

    async def retrieve(
        self,
        db: AsyncSession,
        *,
        patient_id: uuid.UUID,
        query_text: str,
        top_k: int,
    ) -> list[RetrievedMemory]:
        [query_embedding] = await self._embeddings.embed([query_text])
        distance = MemoryItem.embedding.cosine_distance(query_embedding)
        stmt = (
            select(MemoryItem, distance.label("distance"))
            .where(MemoryItem.patient_id == patient_id)
            .order_by(distance)
            .limit(top_k)
        )
        rows = (await db.execute(stmt)).all()
        return [
            RetrievedMemory(
                memory_id=item.id,
                category=item.category,
                content=item.content,
                score=1.0 - dist,
            )
            for item, dist in rows
        ]
