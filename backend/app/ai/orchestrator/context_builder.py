from app.ai.models.base import ChatMessage
from app.ai.prompts.system import SAFETY_INSTRUCTIONS, SYSTEM_INSTRUCTIONS
from app.ai.prompts.therapy import build_memory_context_block, build_rag_context_block

# Character-based, not token-based - a conservative stand-in until a real
# tokenizer is wired in for the chosen model family. ~4 chars/token is a
# common rough estimate for English/German; this only needs to keep us
# safely under a model's context window, not be exact.
_CHARS_PER_TOKEN = 4


class ContextBuilder:
    def __init__(self, max_context_tokens: int = 6000) -> None:
        self._max_chars = max_context_tokens * _CHARS_PER_TOKEN

    def build(
        self,
        *,
        user_message: str,
        rag_chunks: list[str],
        memory_items: list[str],
        conversation_history: list[ChatMessage],
    ) -> list[ChatMessage]:
        system_parts = [SYSTEM_INSTRUCTIONS, SAFETY_INSTRUCTIONS]
        memory_block = build_memory_context_block(memory_items)
        if memory_block:
            system_parts.append(memory_block)
        rag_block = build_rag_context_block(rag_chunks)
        if rag_block:
            system_parts.append(rag_block)

        system_message = ChatMessage(role="system", content="\n\n".join(system_parts))
        history = self._fit_history(conversation_history, reserved=len(system_message.content) + len(user_message))

        return [system_message, *history, ChatMessage(role="user", content=user_message)]

    def _fit_history(
        self, history: list[ChatMessage], *, reserved: int
    ) -> list[ChatMessage]:
        budget = max(self._max_chars - reserved, 0)
        kept: list[ChatMessage] = []
        used = 0
        for turn in reversed(history):
            used += len(turn.content)
            if used > budget:
                break
            kept.append(turn)
        return list(reversed(kept))
