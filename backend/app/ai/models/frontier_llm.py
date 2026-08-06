from collections.abc import AsyncIterator

import httpx

from app.ai.models.base import ChatMessage, LLMProvider, LLMResult
from app.ai.models.local_llm import LocalLLMProvider


class FrontierLLMProvider(LLMProvider):
    """Optional, stronger external model (GPT/Claude/Gemini) for complex
    reasoning the local model can't handle. Talks to an OpenAI-compatible
    endpoint by default; a provider whose API isn't OpenAI-shaped (e.g. the
    native Anthropic Messages API) just needs its own LLMProvider
    implementation swapped in here - the orchestrator only knows this
    interface, not which vendor is behind it.

    Reuses LocalLLMProvider's request/response handling (identical
    OpenAI-compatible wire format), adding only the Authorization header
    and an explicit "not configured" failure mode so the router can fall
    back to the local model instead of crashing.
    """

    name = "frontier-llm"

    def __init__(self, base_url: str, model: str, api_key: str | None, timeout: float = 60.0) -> None:
        self._api_key = api_key
        self._delegate = LocalLLMProvider(base_url=base_url, model=model, timeout=timeout)
        if api_key:
            self._delegate._client.headers["Authorization"] = f"Bearer {api_key}"

    @property
    def is_configured(self) -> bool:
        return bool(self._api_key)

    async def generate(
        self,
        messages: list[ChatMessage],
        *,
        temperature: float = 0.2,
        max_tokens: int | None = None,
    ) -> LLMResult:
        if not self.is_configured:
            raise RuntimeError(f"{self.name}: FRONTIER_LLM_API_KEY is not set")
        result = await self._delegate.generate(
            messages, temperature=temperature, max_tokens=max_tokens
        )
        return LLMResult(
            content=result.content,
            model=result.model,
            provider=self.name,
            usage=result.usage,
            raw=result.raw,
        )

    def stream(
        self,
        messages: list[ChatMessage],
        *,
        temperature: float = 0.2,
        max_tokens: int | None = None,
    ) -> AsyncIterator[str]:
        if not self.is_configured:
            raise RuntimeError(f"{self.name}: FRONTIER_LLM_API_KEY is not set")
        return self._delegate.stream(messages, temperature=temperature, max_tokens=max_tokens)

    async def health_check(self) -> bool:
        if not self.is_configured:
            return False
        try:
            return await self._delegate.health_check()
        except httpx.HTTPError:
            return False
