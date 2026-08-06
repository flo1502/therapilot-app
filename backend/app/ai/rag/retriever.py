import uuid
from dataclasses import dataclass

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models.document import Document, DocumentChunk


@dataclass(frozen=True)
class RetrievedChunk:
    chunk_id: uuid.UUID
    document_id: uuid.UUID
    content: str
    title: str
    source: str
    score: float


class VectorRetriever:
    """Vector similarity + optional keyword search over document_chunks,
    merged via reciprocal rank fusion. Swapping pgvector for another vector
    store means reimplementing this class against the same interface;
    nothing above it (pipeline.py, the orchestrator) changes.
    """

    async def vector_search(
        self, db: AsyncSession, embedding: list[float], top_k: int
    ) -> list[RetrievedChunk]:
        distance = DocumentChunk.embedding.cosine_distance(embedding)
        stmt = (
            select(DocumentChunk, Document, distance.label("distance"))
            .join(Document, Document.id == DocumentChunk.document_id)
            .order_by(distance)
            .limit(top_k)
        )
        rows = (await db.execute(stmt)).all()
        return [
            RetrievedChunk(
                chunk_id=chunk.id,
                document_id=doc.id,
                content=chunk.content,
                title=doc.title,
                source=doc.source,
                score=1.0 - dist,
            )
            for chunk, doc, dist in rows
        ]

    async def keyword_search(
        self, db: AsyncSession, query: str, top_k: int
    ) -> list[RetrievedChunk]:
        stmt = (
            select(DocumentChunk, Document)
            .join(Document, Document.id == DocumentChunk.document_id)
            .where(DocumentChunk.content.ilike(f"%{query}%"))
            .limit(top_k)
        )
        rows = (await db.execute(stmt)).all()
        return [
            RetrievedChunk(
                chunk_id=chunk.id,
                document_id=doc.id,
                content=chunk.content,
                title=doc.title,
                source=doc.source,
                score=0.0,
            )
            for chunk, doc in rows
        ]

    async def search(
        self, db: AsyncSession, query: str, embedding: list[float], top_k: int
    ) -> list[RetrievedChunk]:
        vector_hits = await self.vector_search(db, embedding, top_k)
        keyword_hits = await self.keyword_search(db, query, top_k)
        return _reciprocal_rank_fusion([vector_hits, keyword_hits], top_k)


def _reciprocal_rank_fusion(
    ranked_lists: list[list[RetrievedChunk]], top_k: int, k: int = 60
) -> list[RetrievedChunk]:
    scores: dict[uuid.UUID, float] = {}
    chunks: dict[uuid.UUID, RetrievedChunk] = {}
    for ranked in ranked_lists:
        for rank, chunk in enumerate(ranked):
            scores[chunk.chunk_id] = scores.get(chunk.chunk_id, 0.0) + 1.0 / (k + rank + 1)
            chunks[chunk.chunk_id] = chunk
    ordered = sorted(scores.items(), key=lambda kv: kv[1], reverse=True)[:top_k]
    return [chunks[chunk_id] for chunk_id, _ in ordered]
