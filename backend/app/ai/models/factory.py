from app.ai.models.base import LLMProvider
from app.ai.models.frontier_llm import FrontierLLMProvider
from app.ai.models.local_llm import LocalLLMProvider
from app.ai.models.mock_llm import MockLLMProvider
from app.core.config import Settings


def build_local_llm(settings: Settings) -> LLMProvider:
    if settings.local_llm_provider == "mock":
        return MockLLMProvider()
    return LocalLLMProvider(base_url=settings.local_llm_base_url, model=settings.local_llm_model)


def build_frontier_llm(settings: Settings) -> FrontierLLMProvider:
    return FrontierLLMProvider(
        base_url=settings.frontier_llm_base_url,
        model=settings.frontier_llm_model,
        api_key=settings.frontier_llm_api_key if settings.frontier_llm_enabled else None,
    )
