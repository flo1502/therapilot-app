import httpx

from app.main import create_app


async def test_health_endpoint_reports_mock_local_llm_as_healthy():
    app = create_app()
    transport = httpx.ASGITransport(app=app)

    async with app.router.lifespan_context(app):
        async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
            response = await client.get("/api/health")

    assert response.status_code == 200
    body = response.json()
    assert body["local_llm"] is True  # LOCAL_LLM_PROVIDER defaults to "mock"
    assert body["frontier_llm"] is False  # FRONTIER_LLM_ENABLED defaults to false
