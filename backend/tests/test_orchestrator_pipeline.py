import uuid

from app.ai.models.frontier_llm import FrontierLLMProvider
from app.ai.orchestrator.context_builder import ContextBuilder
from app.ai.orchestrator.orchestrator import AIOrchestrator, _SAFE_FALLBACK_MESSAGE
from app.ai.orchestrator.router import RuleBasedRouter
from app.ai.orchestrator.schemas import OrchestratorInput
from app.ai.prompts.crisis import CRISIS_RESPONSE_DE
from app.ai.rag.retriever import RetrievedChunk
from app.ai.safety.policy import HeuristicPolicyChecker
from app.ai.safety.response_checker import ResponseChecker
from app.ai.safety.risk_detector import KeywordRiskDetector

from tests.conftest import FakeLLMProvider


class FakeRagPipeline:
    def __init__(self, chunks: list[RetrievedChunk]) -> None:
        self.chunks = chunks
        self.queried = False

    async def query(self, db, query_text, *, top_k, rerank_top_k):
        self.queried = True
        return self.chunks


class FakeMemoryRetriever:
    async def retrieve(self, db, *, patient_id, query_text, top_k):
        return []


def _build_orchestrator(
    *, local_llm: FakeLLMProvider, rag_chunks: list[RetrievedChunk] | None = None
) -> tuple[AIOrchestrator, FakeRagPipeline]:
    rag_pipeline = FakeRagPipeline(rag_chunks or [])
    orchestrator = AIOrchestrator(
        local_llm=local_llm,
        frontier_llm=FrontierLLMProvider(base_url="http://frontier.test/v1", model="gpt", api_key=None),
        risk_detector=KeywordRiskDetector(),
        router=RuleBasedRouter(),
        rag_pipeline=rag_pipeline,
        memory_retriever=FakeMemoryRetriever(),
        response_checker=ResponseChecker(KeywordRiskDetector(), HeuristicPolicyChecker()),
        context_builder=ContextBuilder(),
        rag_top_k=8,
        rerank_top_k=4,
    )
    return orchestrator, rag_pipeline


async def test_crisis_message_short_circuits_before_any_llm_call():
    local_llm = FakeLLMProvider(name="fake-local", responses=["should never be returned"])
    orchestrator, _ = _build_orchestrator(local_llm=local_llm)

    output = await orchestrator.execute(
        OrchestratorInput(
            user_message="Ich denke oft an Suizid.",
            patient_id=None,
            session_id=uuid.uuid4(),
            tenant_id="default",
        ),
        db=None,
    )

    assert output.message == CRISIS_RESPONSE_DE
    assert output.model_used == "crisis-safe-response"
    assert output.risk_level == "critical"
    assert local_llm.calls == []


async def test_clinical_question_uses_rag_and_local_model():
    chunk = RetrievedChunk(
        chunk_id=uuid.uuid4(),
        document_id=uuid.uuid4(),
        content="Leitlinie: KVT ist first-line bei Angststörungen.",
        title="S3-Leitlinie Angst",
        source="AWMF",
        score=0.95,
    )
    local_llm = FakeLLMProvider(name="fake-local", responses=["Laut Leitlinie wird KVT empfohlen."])
    orchestrator, rag_pipeline = _build_orchestrator(local_llm=local_llm, rag_chunks=[chunk])

    output = await orchestrator.execute(
        OrchestratorInput(
            user_message="Was empfiehlt die Leitlinie bei Angststörung?",
            patient_id=None,
            session_id=uuid.uuid4(),
            tenant_id="default",
        ),
        db=None,
    )

    assert rag_pipeline.queried is True
    assert output.rag_used is True
    assert output.sources[0].title == "S3-Leitlinie Angst"
    assert output.message == "Laut Leitlinie wird KVT empfohlen."
    assert output.model_used == "fake-local:fake-local"
    assert len(local_llm.calls) == 1
    assert "Leitlinie: KVT" in local_llm.calls[0][0].content  # system message carries the RAG block


async def test_repeatedly_rejected_response_falls_back_to_safe_message():
    local_llm = FakeLLMProvider(name="fake-local", responses=["Sie haben eindeutig die Diagnose Depression."])
    orchestrator, _ = _build_orchestrator(local_llm=local_llm)

    output = await orchestrator.execute(
        OrchestratorInput(
            user_message="Wie geht es mir?",
            patient_id=None,
            session_id=uuid.uuid4(),
            tenant_id="default",
        ),
        db=None,
    )

    assert output.message == _SAFE_FALLBACK_MESSAGE
    assert output.model_used == "safety-fallback:none"
    # one initial attempt + one retry, both rejected
    assert len(local_llm.calls) == 2
