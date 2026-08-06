import json
from collections.abc import AsyncIterator

import httpx

from app.ai.models.base import ChatMessage, LLMProvider, LLMResult
from app.core.logging import get_logger

logger = get_logger(__name__)


class LocalLLMProvider(LLMProvider):
    """Talks to any OpenAI-compatible /chat/completions endpoint - vLLM,
    services/local-llm, Ollama, ... Swapping the underlying model (an
    8B general model today, a fine-tuned PsyCoPref model later) is just
    LOCAL_LLM_BASE_URL / LOCAL_LLM_MODEL changing, nothing here.
    """

    name = "local-llm"

    def __init__(self, base_url: str, model: str, timeout: float = 60.0) -> None:
        self._base_url = base_url.rstrip("/")
        self._model = model
        self._client = httpx.AsyncClient(base_url=self._base_url, timeout=timeout)

    async def generate(
        self,
        messages: list[ChatMessage],
        *,
        temperature: float = 0.2,
        max_tokens: int | None = None,
    ) -> LLMResult:
        payload: dict = {
            "model": self._model,
            "messages": [{"role": m.role, "content": m.content} for m in messages],
            "temperature": temperature,
        }
        if max_tokens is not None:
            payload["max_tokens"] = max_tokens

        try:
            response = await self._client.post("/chat/completions", json=payload)
        except httpx.HTTPError as exc:
            raise RuntimeError(
                f"{self.name}: failed to reach {self._base_url} ({exc})"
            ) from exc

        if response.status_code >= 400:
            raise RuntimeError(
                f"{self.name}: {response.status_code} {response.text[:500]}"
            )

        data = response.json()
        choice = (data.get("choices") or [{}])[0]
        content = (choice.get("message") or {}).get("content")
        if not content:
            raise RuntimeError(f"{self.name}: response contained no message content")

        return LLMResult(
            content=content,
            model=self._model,
            provider=self.name,
            usage=data.get("usage") or {},
            raw=data,
        )

    async def stream(
        self,
        messages: list[ChatMessage],
        *,
        temperature: float = 0.2,
        max_tokens: int | None = None,
    ) -> AsyncIterator[str]:
        payload: dict = {
            "model": self._model,
            "messages": [{"role": m.role, "content": m.content} for m in messages],
            "temperature": temperature,
            "stream": True,
        }
        if max_tokens is not None:
            payload["max_tokens"] = max_tokens

        async with self._client.stream("POST", "/chat/completions", json=payload) as response:
            if response.status_code >= 400:
                body = await response.aread()
                raise RuntimeError(f"{self.name}: {response.status_code} {body[:500]!r}")

            async for line in response.aiter_lines():
                if not line.startswith("data: "):
                    continue
                chunk = line.removeprefix("data: ").strip()
                if chunk == "[DONE]":
                    break
                delta = json.loads(chunk)["choices"][0].get("delta", {})
                token = delta.get("content")
                if token:
                    yield token

    async def health_check(self) -> bool:
        try:
            response = await self._client.get("/models")
            return response.status_code < 400
        except httpx.HTTPError:
            return False
