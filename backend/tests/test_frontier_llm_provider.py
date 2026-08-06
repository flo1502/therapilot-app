import httpx
import pytest

from app.ai.models.base import ChatMessage
from app.ai.models.frontier_llm import FrontierLLMProvider


async def test_not_configured_without_api_key():
    provider = FrontierLLMProvider(base_url="http://frontier.test/v1", model="gpt-4o-mini", api_key=None)

    assert provider.is_configured is False
    assert await provider.health_check() is False
    with pytest.raises(RuntimeError, match="not set"):
        await provider.generate([ChatMessage(role="user", content="hi")])


@pytest.mark.respx(base_url="http://frontier.test/v1")
async def test_sends_bearer_token_when_configured(respx_mock):
    route = respx_mock.post("/chat/completions").mock(
        return_value=httpx.Response(200, json={"choices": [{"message": {"content": "hi there"}}]})
    )
    provider = FrontierLLMProvider(
        base_url="http://frontier.test/v1", model="gpt-4o-mini", api_key="secret-key"
    )

    result = await provider.generate([ChatMessage(role="user", content="hi")])

    assert result.content == "hi there"
    assert result.provider == "frontier-llm"
    assert route.calls.last.request.headers["Authorization"] == "Bearer secret-key"
