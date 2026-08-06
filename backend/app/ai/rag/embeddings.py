import hashlib
from abc import ABC, abstractmethod

import httpx

from app.core.config import Settings


class EmbeddingProvider(ABC):
    name: str

    @abstractmethod
    async def embed(self, texts: list[str]) -> list[list[float]]: ...


class HttpEmbeddingProvider(EmbeddingProvider):
    """OpenAI-compatible /embeddings endpoint - same local-llm / vLLM server
    that serves chat completions, or a dedicated embedding server.
    """

    name = "http-embeddings"

    def __init__(self, base_url: str, model: str, dim: int, timeout: float = 30.0) -> None:
        self._model = model
        self._dim = dim
        self._client = httpx.AsyncClient(base_url=base_url.rstrip("/"), timeout=timeout)

    async def embed(self, texts: list[str]) -> list[list[float]]:
        response = await self._client.post(
            "/embeddings", json={"model": self._model, "input": texts}
        )
        if response.status_code >= 400:
            raise RuntimeError(f"{self.name}: {response.status_code} {response.text[:500]}")
        data = response.json()
        return [item["embedding"] for item in data["data"]]


class MockEmbeddingProvider(EmbeddingProvider):
    """Deterministic, dependency-free embeddings for dev/tests: hash each
    text into a fixed-size pseudo-random unit vector. Not semantically
    meaningful - only useful for exercising the RAG/memory plumbing without
    a real embedding model.
    """

    name = "mock-embeddings"

    def __init__(self, dim: int) -> None:
        self._dim = dim

    async def embed(self, texts: list[str]) -> list[list[float]]:
        return [self._embed_one(text) for text in texts]

    def _embed_one(self, text: str) -> list[float]:
        vector: list[float] = []
        seed = text.encode("utf-8")
        counter = 0
        while len(vector) < self._dim:
            digest = hashlib.sha256(seed + counter.to_bytes(4, "big")).digest()
            vector.extend(b / 127.5 - 1.0 for b in digest)
            counter += 1
        vector = vector[: self._dim]
        norm = sum(v * v for v in vector) ** 0.5 or 1.0
        return [v / norm for v in vector]


def build_embedding_provider(settings: Settings) -> EmbeddingProvider:
    if settings.embedding_provider == "mock":
        return MockEmbeddingProvider(dim=settings.embedding_dim)
    return HttpEmbeddingProvider(
        base_url=settings.embedding_base_url,
        model=settings.embedding_model,
        dim=settings.embedding_dim,
    )
