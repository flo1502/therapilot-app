"""Requires a running Postgres+pgvector with migrations applied. Excluded
from the default test run - see pytest.ini. Run with: pytest -m integration
"""
import uuid

import pytest
import pytest_asyncio
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.ai.memory.memory_retriever import MemoryRetriever
from app.ai.rag.embeddings import MockEmbeddingProvider
from app.core.config import get_settings
from app.db.models.memory import MemoryItem
from app.db.models.patient import Patient

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


async def test_memory_is_scoped_to_patient_id(db_session: AsyncSession):
    embeddings = MockEmbeddingProvider(dim=get_settings().embedding_dim)

    patient_a = Patient(tenant_id="t1", label="Patient A")
    patient_b = Patient(tenant_id="t1", label="Patient B")
    db_session.add_all([patient_a, patient_b])
    await db_session.flush()

    [vec] = await embeddings.embed(["Therapieziel: Angst im Alltag reduzieren"])
    db_session.add_all(
        [
            MemoryItem(
                tenant_id="t1", patient_id=patient_a.id, category="goal",
                content="Ziel von Patient A", embedding=vec,
            ),
            MemoryItem(
                tenant_id="t1", patient_id=patient_b.id, category="goal",
                content="Ziel von Patient B", embedding=vec,
            ),
        ]
    )
    await db_session.flush()

    retriever = MemoryRetriever(embeddings)
    results = await retriever.retrieve(
        db_session, patient_id=patient_a.id, query_text="Angst im Alltag", top_k=5
    )

    assert {r.content for r in results} == {"Ziel von Patient A"}
