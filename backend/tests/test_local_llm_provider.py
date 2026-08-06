import httpx
import pytest
import respx

from app.ai.models.base import ChatMessage
from app.ai.models.local_llm import LocalLLMProvider


@pytest.mark.respx(base_url="http://local-llm.test/v1")
async def test_generate_parses_openai_compatible_response(respx_mock):
    respx_mock.post("/chat/completions").mock(
        return_value=httpx.Response(
            200,
            json={
                "choices": [{"message": {"content": "Hallo, wie kann ich helfen?"}}],
                "usage": {"total_tokens": 42},
            },
        )
    )
    provider = LocalLLMProvider(base_url="http://local-llm.test/v1", model="local-therapy-llm")

    result = await provider.generate([ChatMessage(role="user", content="Hallo")])

    assert result.content == "Hallo, wie kann ich helfen?"
    assert result.provider == "local-llm"
    assert result.usage == {"total_tokens": 42}


@pytest.mark.respx(base_url="http://local-llm.test/v1")
async def test_generate_raises_on_non_ok_response(respx_mock):
    respx_mock.post("/chat/completions").mock(return_value=httpx.Response(500, text="boom"))
    provider = LocalLLMProvider(base_url="http://local-llm.test/v1", model="local-therapy-llm")

    with pytest.raises(RuntimeError, match="500"):
        await provider.generate([ChatMessage(role="user", content="Hallo")])


@pytest.mark.respx(base_url="http://local-llm.test/v1")
async def test_health_check_reflects_endpoint_status(respx_mock):
    respx_mock.get("/models").mock(return_value=httpx.Response(200, json={"data": []}))
    provider = LocalLLMProvider(base_url="http://local-llm.test/v1", model="local-therapy-llm")

    assert await provider.health_check() is True
