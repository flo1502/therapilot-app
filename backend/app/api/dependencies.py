from dataclasses import dataclass

from fastapi import Request

from app.ai.memory.memory_retriever import MemoryRetriever
from app.ai.memory.memory_service import MemoryService
from app.ai.models.base import LLMProvider
from app.ai.models.factory import build_frontier_llm, build_local_llm
from app.ai.orchestrator.context_builder import ContextBuilder
from app.ai.orchestrator.orchestrator import AIOrchestrator
from app.ai.orchestrator.router import RuleBasedRouter
from app.ai.rag.embeddings import build_embedding_provider
from app.ai.rag.pipeline import RagPipeline
from app.ai.rag.reranker import NoopReranker
from app.ai.rag.retriever import VectorRetriever
from app.ai.safety.policy import HeuristicPolicyChecker
from app.ai.safety.response_checker import ResponseChecker
from app.ai.safety.risk_detector import KeywordRiskDetector
from app.core.config import Settings, get_settings
from app.services.chat_service import ChatService
from app.services.document_service import DocumentService
from app.services.patient_service import PatientService
from app.services.session_service import SessionService


@dataclass
class Container:
    settings: Settings
    local_llm: LLMProvider
    frontier_llm: LLMProvider
    orchestrator: AIOrchestrator
    chat_service: ChatService
    session_service: SessionService
    patient_service: PatientService
    document_service: DocumentService
    memory_service: MemoryService


def build_container(settings: Settings | None = None) -> Container:
    settings = settings or get_settings()

    local_llm = build_local_llm(settings)
    frontier_llm = build_frontier_llm(settings)
    embeddings = build_embedding_provider(settings)
    retriever = VectorRetriever()
    reranker = NoopReranker()
    rag_pipeline = RagPipeline(embeddings, retriever, reranker)
    memory_service = MemoryService(embeddings)
    memory_retriever = MemoryRetriever(embeddings)
    risk_detector = KeywordRiskDetector()
    policy_checker = HeuristicPolicyChecker()
    response_checker = ResponseChecker(risk_detector, policy_checker)
    router = RuleBasedRouter()
    context_builder = ContextBuilder()

    orchestrator = AIOrchestrator(
        local_llm=local_llm,
        frontier_llm=frontier_llm,
        risk_detector=risk_detector,
        router=router,
        rag_pipeline=rag_pipeline,
        memory_retriever=memory_retriever,
        response_checker=response_checker,
        context_builder=context_builder,
        rag_top_k=settings.rag_top_k,
        rerank_top_k=settings.rerank_top_k,
    )

    session_service = SessionService()

    return Container(
        settings=settings,
        local_llm=local_llm,
        frontier_llm=frontier_llm,
        orchestrator=orchestrator,
        chat_service=ChatService(orchestrator, session_service),
        session_service=session_service,
        patient_service=PatientService(),
        document_service=DocumentService(rag_pipeline),
        memory_service=memory_service,
    )


def get_container(request: Request) -> Container:
    return request.app.state.container


def get_chat_service(request: Request) -> ChatService:
    return get_container(request).chat_service


def get_session_service(request: Request) -> SessionService:
    return get_container(request).session_service


def get_patient_service(request: Request) -> PatientService:
    return get_container(request).patient_service


def get_document_service(request: Request) -> DocumentService:
    return get_container(request).document_service
