from collections.abc import AsyncIterator
from dataclasses import dataclass, field

import pytest

from app.ai.models.base import ChatMessage, LLMProvider, LLMResult


@dataclass
class FakeLLMProvider(LLMProvider):
    """Deterministic, in-memory stand-in for a real LLM backend. Configure
    `responses` to return canned content in order (repeats the last one
    once exhausted), or `raises` to simulate a backend failure.
    """

    name: str = "fake-llm"
    responses: list[str] = field(default_factory=lambda: ["ok"])
    raises: Exception | None = None
    calls: list[list[ChatMessage]] = field(default_factory=list)

    async def generate(
        self,
        messages: list[ChatMessage],
        *,
        temperature: float = 0.2,
        max_tokens: int | None = None,
    ) -> LLMResult:
        self.calls.append(messages)
        if self.raises is not None:
            raise self.raises
        index = min(len(self.calls) - 1, len(self.responses) - 1)
        return LLMResult(content=self.responses[index], model=self.name, provider=self.name)

    async def stream(
        self,
        messages: list[ChatMessage],
        *,
        temperature: float = 0.2,
        max_tokens: int | None = None,
    ) -> AsyncIterator[str]:
        result = await self.generate(messages, temperature=temperature, max_tokens=max_tokens)
        yield result.content

    async def health_check(self) -> bool:
        return self.raises is None


@pytest.fixture
def fake_local_llm() -> FakeLLMProvider:
    return FakeLLMProvider(name="fake-local")
