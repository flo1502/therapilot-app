from abc import ABC, abstractmethod

from app.ai.rag.retriever import RetrievedChunk


class Reranker(ABC):
    name: str

    @abstractmethod
    async def rerank(
        self, query: str, chunks: list[RetrievedChunk], top_k: int
    ) -> list[RetrievedChunk]: ...


class NoopReranker(Reranker):
    """MVP default: trust the retriever's ordering, just truncate. Swap in
    a cross-encoder implementation later without touching pipeline.py.
    """

    name = "noop-reranker"

    async def rerank(
        self, query: str, chunks: list[RetrievedChunk], top_k: int
    ) -> list[RetrievedChunk]:
        return chunks[:top_k]
