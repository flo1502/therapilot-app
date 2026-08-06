"""Requires a running Postgres+pgvector (docker compose up postgres) with
migrations applied (alembic upgrade head). Excluded from the default test
run - see pytest.ini. Run explicitly with: pytest -m integration
"""
import pytest
import pytest_asyncio
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.ai.rag.embeddings import MockEmbeddingProvider
from app.ai.rag.retriever import VectorRetriever
from app.core.config import get_settings
from app.db.models.document import Document, DocumentChunk

pytestmark = pytest.mark.integration


@pytest_asyncio.fixture
async def db_session():
    settings = get_settings()
    engine = create_async_engine(settings.database_url)
    try:
        async with engine.connect():
            pass
    except Exception as exc:
        pytest.skip(f"Postgres not reachable at {settings.database_url}: {exc}")

    session_factory = async_sessionmaker(engine, expire_on_commit=False)
    async with session_factory() as session:
        yield session
        await session.rollback()
    await engine.dispose()


async def test_vector_search_returns_nearest_chunk_first(db_session: AsyncSession):
    embeddings = MockEmbeddingProvider(dim=get_settings().embedding_dim)
    [vec_a] = await embeddings.embed(["Angststörung und kognitive Verhaltenstherapie"])
    [vec_b] = await embeddings.embed(["Ernährungsempfehlungen bei Diabetes"])

    doc = Document(source="test", title="Test Doc", document_type="guideline")
    db_session.add(doc)
    await db_session.flush()
    db_session.add_all(
        [
            DocumentChunk(document_id=doc.id, chunk_index=0, content="chunk A", embedding=vec_a),
            DocumentChunk(document_id=doc.id, chunk_index=1, content="chunk B", embedding=vec_b),
        ]
    )
    await db_session.flush()

    retriever = VectorRetriever()
    results = await retriever.vector_search(db_session, vec_a, top_k=1)

    assert len(results) == 1
    assert results[0].content == "chunk A"
