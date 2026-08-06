from collections.abc import AsyncIterator

from app.ai.models.base import ChatMessage, LLMProvider, LLMResult


class MockLLMProvider(LLMProvider):
    """Canned, deterministic responses. Lets /api/chat work end-to-end
    (LOCAL_LLM_PROVIDER=mock, the default) before any real model server is
    running. Never used for FrontierLLM - only ever a stand-in for the
    local model during development/tests.
    """

    name = "mock-llm"

    async def generate(
        self,
        messages: list[ChatMessage],
        *,
        temperature: float = 0.2,
        max_tokens: int | None = None,
    ) -> LLMResult:
        last_user = next((m for m in reversed(messages) if m.role == "user"), None)
        preview = (last_user.content[:120] if last_user else "").strip()
        content = (
            "[mock-llm] Das ist eine Platzhalterantwort des lokalen Mock-Modells. "
            f"Eingegangene Nachricht (gekuerzt): {preview!r}"
        )
        return LLMResult(content=content, model=self.name, provider=self.name)

    async def stream(
        self,
        messages: list[ChatMessage],
        *,
        temperature: float = 0.2,
        max_tokens: int | None = None,
    ) -> AsyncIterator[str]:
        result = await self.generate(messages, temperature=temperature, max_tokens=max_tokens)
        for word in result.content.split(" "):
            yield word + " "

    async def health_check(self) -> bool:
        return True
