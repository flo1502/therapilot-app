from sqlalchemy.ext.asyncio import AsyncSession

from app.ai.models.base import ChatMessage, LLMProvider, LLMResult
from app.ai.models.frontier_llm import FrontierLLMProvider
from app.ai.orchestrator.context_builder import ContextBuilder
from app.ai.orchestrator.router import Router
from app.ai.orchestrator.schemas import OrchestratorInput, OrchestratorOutput, SourceRef
from app.ai.prompts.crisis import CRISIS_RESPONSE_DE
from app.ai.rag.pipeline import RagPipeline
from app.ai.memory.memory_retriever import MemoryRetriever
from app.ai.safety.response_checker import ResponseChecker
from app.ai.safety.risk_detector import RiskDetector
from app.core.logging import get_logger

logger = get_logger(__name__)

_SAFE_FALLBACK_MESSAGE = (
    "Ich kann diese Anfrage gerade nicht in einer verlässlichen Form "
    "beantworten. Bitte formuliere sie anders oder wende dich an deine "
    "Therapeutin/deinen Therapeuten."
)
_MEMORY_TOP_K = 5


class AIOrchestrator:
    def __init__(
        self,
        *,
        local_llm: LLMProvider,
        frontier_llm: FrontierLLMProvider,
        risk_detector: RiskDetector,
        router: Router,
        rag_pipeline: RagPipeline,
        memory_retriever: MemoryRetriever,
        response_checker: ResponseChecker,
        context_builder: ContextBuilder,
        rag_top_k: int,
        rerank_top_k: int,
    ) -> None:
        self._local_llm = local_llm
        self._frontier_llm = frontier_llm
        self._risk_detector = risk_detector
        self._router = router
        self._rag_pipeline = rag_pipeline
        self._memory_retriever = memory_retriever
        self._response_checker = response_checker
        self._context_builder = context_builder
        self._rag_top_k = rag_top_k
        self._rerank_top_k = rerank_top_k

    async def execute(self, request: OrchestratorInput, db: AsyncSession) -> OrchestratorOutput:
        risk = await self._risk_detector.assess(request.user_message)

        if risk.requires_special_flow:
            logger.info("crisis_route session_id=%s risk_level=%s", request.session_id, risk.risk_level)
            return OrchestratorOutput(
                message=CRISIS_RESPONSE_DE,
                model_used="crisis-safe-response",
                rag_used=False,
                sources=[],
                risk_level=risk.risk_level,
            )

        route = self._router.route(
            message=request.user_message,
            risk=risk,
            frontier_available=self._frontier_llm.is_configured,
        )

        memory_items: list[str] = []
        if request.patient_id is not None:
            memories = await self._memory_retriever.retrieve(
                db,
                patient_id=request.patient_id,
                query_text=request.user_message,
                top_k=_MEMORY_TOP_K,
            )
            memory_items = [m.content for m in memories]

        rag_chunks: list[str] = []
        sources: list[SourceRef] = []
        if route.use_rag:
            hits = await self._rag_pipeline.query(
                db,
                request.user_message,
                top_k=self._rag_top_k,
                rerank_top_k=self._rerank_top_k,
            )
            rag_chunks = [h.content for h in hits]
            sources = [
                SourceRef(document_id=h.document_id, chunk_id=h.chunk_id, title=h.title, source=h.source)
                for h in hits
            ]

        messages = self._context_builder.build(
            user_message=request.user_message,
            rag_chunks=rag_chunks,
            memory_items=memory_items,
            conversation_history=request.conversation_history,
        )

        primary = self._frontier_llm if route.target == "frontier" else self._local_llm
        result = await self._generate_with_fallback(primary, messages)

        logger.info(
            "chat_response session_id=%s route=%s model=%s rag_used=%s risk_level=%s",
            request.session_id, route.target, result.model, bool(rag_chunks), risk.risk_level,
        )

        return OrchestratorOutput(
            message=result.content,
            model_used=f"{result.provider}:{result.model}",
            rag_used=bool(rag_chunks),
            sources=sources,
            risk_level=risk.risk_level,
        )

    async def _generate_with_fallback(
        self, primary: LLMProvider, messages: list[ChatMessage]
    ) -> LLMResult:
        for provider in self._candidate_providers(primary):
            try:
                result = await provider.generate(messages, temperature=0.2)
            except Exception:
                logger.exception("llm_generation_failed provider=%s", provider.name)
                continue

            validation = await self._response_checker.check(result.content)
            if validation.accepted:
                return result

            logger.warning(
                "response_rejected provider=%s risk_level=%s violations=%s",
                provider.name, validation.risk.risk_level, validation.violations,
            )
            # One retry with the same provider before moving to the next.
            try:
                retry = await provider.generate(messages, temperature=0.2)
            except Exception:
                logger.exception("llm_retry_failed provider=%s", provider.name)
                continue
            retry_validation = await self._response_checker.check(retry.content)
            if retry_validation.accepted:
                return retry

        return LLMResult(content=_SAFE_FALLBACK_MESSAGE, model="none", provider="safety-fallback")

    def _candidate_providers(self, primary: LLMProvider) -> list[LLMProvider]:
        candidates = [primary]
        if primary is not self._local_llm:
            candidates.append(self._local_llm)
        return candidates
