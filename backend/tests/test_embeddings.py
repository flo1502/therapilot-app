from app.ai.rag.embeddings import MockEmbeddingProvider


async def test_mock_embeddings_are_deterministic_and_normalized():
    provider = MockEmbeddingProvider(dim=32)

    [vec_a] = await provider.embed(["hello"])
    [vec_a_again] = await provider.embed(["hello"])
    [vec_b] = await provider.embed(["something else"])

    assert vec_a == vec_a_again
    assert vec_a != vec_b
    assert len(vec_a) == 32
    norm = sum(v * v for v in vec_a) ** 0.5
    assert abs(norm - 1.0) < 1e-6
