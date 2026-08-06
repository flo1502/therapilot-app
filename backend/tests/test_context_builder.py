from app.ai.models.base import ChatMessage
from app.ai.orchestrator.context_builder import ContextBuilder


def test_build_includes_system_rag_memory_and_user_message():
    builder = ContextBuilder(max_context_tokens=6000)

    messages = builder.build(
        user_message="Wie geht es weiter?",
        rag_chunks=["Leitlinie XY empfiehlt KVT bei Angststörungen."],
        memory_items=["Therapieziel: Angst im Alltag reduzieren."],
        conversation_history=[
            ChatMessage(role="user", content="Hallo"),
            ChatMessage(role="assistant", content="Hallo, wie kann ich helfen?"),
        ],
    )

    assert messages[0].role == "system"
    assert "Leitlinie XY" in messages[0].content
    assert "Therapieziel" in messages[0].content
    assert messages[-1] == ChatMessage(role="user", content="Wie geht es weiter?")
    assert any(m.content == "Hallo" for m in messages)


def test_build_omits_empty_context_blocks():
    builder = ContextBuilder()

    messages = builder.build(
        user_message="Hallo",
        rag_chunks=[],
        memory_items=[],
        conversation_history=[],
    )

    assert "RELEVANTER FACHLICHER KONTEXT" not in messages[0].content
    assert "BEKANNTE INFORMATIONEN" not in messages[0].content


def test_history_is_truncated_to_fit_token_budget():
    builder = ContextBuilder(max_context_tokens=50)  # ~200 chars total budget
    long_history = [
        ChatMessage(role="user" if i % 2 == 0 else "assistant", content="x" * 100)
        for i in range(10)
    ]

    messages = builder.build(
        user_message="kurz",
        rag_chunks=[],
        memory_items=[],
        conversation_history=long_history,
    )

    kept_history = messages[1:-1]
    assert len(kept_history) < len(long_history)
