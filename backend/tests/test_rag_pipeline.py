import uuid

from app.ai.rag.pipeline import chunk_text
from app.ai.rag.reranker import NoopReranker
from app.ai.rag.retriever import RetrievedChunk, _reciprocal_rank_fusion


def test_chunk_text_splits_with_overlap():
    text = "x" * 3000
    chunks = chunk_text(text, chunk_size=1200, overlap=150)

    assert len(chunks) == 3
    assert chunks[0][-150:] == chunks[1][:150]


def test_chunk_text_empty_input_returns_no_chunks():
    assert chunk_text("   ") == []


async def test_noop_reranker_truncates_without_reordering():
    chunks = [
        RetrievedChunk(uuid.uuid4(), uuid.uuid4(), f"chunk {i}", "title", "source", score=1.0 - i * 0.1)
        for i in range(5)
    ]

    result = await NoopReranker().rerank("query", chunks, top_k=2)

    assert result == chunks[:2]


def test_reciprocal_rank_fusion_favors_items_ranked_high_in_both_lists():
    shared = RetrievedChunk(uuid.uuid4(), uuid.uuid4(), "shared", "t", "s", 0.9)
    vector_only = RetrievedChunk(uuid.uuid4(), uuid.uuid4(), "vector-only", "t", "s", 0.8)
    keyword_only = RetrievedChunk(uuid.uuid4(), uuid.uuid4(), "keyword-only", "t", "s", 0.0)

    fused = _reciprocal_rank_fusion([[shared, vector_only], [shared, keyword_only]], top_k=3)

    assert fused[0] is shared
    assert {c.content for c in fused} == {"shared", "vector-only", "keyword-only"}
