from datetime import date

from sqlalchemy.ext.asyncio import AsyncSession

from app.ai.rag.embeddings import EmbeddingProvider
from app.ai.rag.reranker import Reranker
from app.ai.rag.retriever import RetrievedChunk, VectorRetriever
from app.db.models.document import Document, DocumentChunk


def chunk_text(text: str, chunk_size: int = 1200, overlap: int = 150) -> list[str]:
    text = text.strip()
    if not text:
        return []
    chunks: list[str] = []
    start = 0
    while start < len(text):
        end = start + chunk_size
        chunks.append(text[start:end])
        if end >= len(text):
            break
        start = end - overlap
    return chunks


class RagPipeline:
    def __init__(
        self,
        embeddings: EmbeddingProvider,
        retriever: VectorRetriever,
        reranker: Reranker,
    ) -> None:
        self._embeddings = embeddings
        self._retriever = retriever
        self._reranker = reranker

    async def ingest_document(
        self,
        db: AsyncSession,
        *,
        source: str,
        title: str,
        text: str,
        author: str | None = None,
        publication_date: date | None = None,
        document_type: str = "guideline",
        topic: str | None = None,
    ) -> Document:
        document = Document(
            source=source,
            title=title,
            author=author,
            publication_date=publication_date,
            document_type=document_type,
            topic=topic,
        )
        db.add(document)
        await db.flush()

        chunks = chunk_text(text)
        if chunks:
            vectors = await self._embeddings.embed(chunks)
            for index, (content, vector) in enumerate(zip(chunks, vectors)):
                db.add(
                    DocumentChunk(
                        document_id=document.id,
                        chunk_index=index,
                        content=content,
                        embedding=vector,
                    )
                )
        await db.commit()
        await db.refresh(document)
        return document

    async def query(
        self,
        db: AsyncSession,
        query_text: str,
        *,
        top_k: int,
        rerank_top_k: int,
    ) -> list[RetrievedChunk]:
        [query_embedding] = await self._embeddings.embed([query_text])
        candidates = await self._retriever.search(db, query_text, query_embedding, top_k)
        return await self._reranker.rerank(query_text, candidates, rerank_top_k)
