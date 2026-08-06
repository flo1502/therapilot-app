def build_rag_context_block(chunks: list[str]) -> str:
    if not chunks:
        return ""
    joined = "\n\n".join(f"[{i + 1}] {c}" for i, c in enumerate(chunks))
    return f"RELEVANTER FACHLICHER KONTEXT:\n{joined}"


def build_memory_context_block(memories: list[str]) -> str:
    if not memories:
        return ""
    joined = "\n".join(f"- {m}" for m in memories)
    return f"BEKANNTE INFORMATIONEN ZUR PATIENTIN/ZUM PATIENTEN:\n{joined}"
