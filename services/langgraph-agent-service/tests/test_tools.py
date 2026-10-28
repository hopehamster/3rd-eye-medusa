"""Tool registry: tools are n8n webhook declarations. Tests assert call
construction (URL, headers, payload, idempotency key) against a mock HTTP
client — never against a live webhook — and retry only on 5xx/timeouts."""

import httpx
import pytest

from app.tools import ToolDefinition, build_tool_call, execute_tool


def _resolver_public(host: str, port: int) -> list[str]:
    return ["93.184.216.34"]


def _tool(**overrides) -> ToolDefinition:
    base = {
        "name": "notify",
        "webhook_url": "https://n8n.example.invalid/webhook/notify",
        "input_schema": {"type": "object", "properties": {"message": {"type": "string"}}},
        "timeout_seconds": 10.0,
        "max_retries": 2,
        # R-B1-1: execute_tool refuses allowed_hosts=None fail-closed,
        # so the shared test tool carries the allowlist explicitly.
        "allowed_hosts": {"n8n.example.invalid"},
    }
    base.update(overrides)
    return ToolDefinition(**base)


def test_build_tool_call_construction() -> None:
    url, headers, payload = build_tool_call(_tool(), {"message": "hi"}, "run-123")
    assert url == "https://n8n.example.invalid/webhook/notify"
    assert headers["X-Idempotency-Key"] == "run-123"
    assert headers["Content-Type"] == "application/json"
    assert payload == {"message": "hi"}


def test_tool_registry_from_env(monkeypatch) -> None:
    from app.tools import registry_from_env

    monkeypatch.setenv("N8N_ALLOWED_HOSTS", "n8n.example.invalid")
    monkeypatch.setenv("N8N_TOOL_NOTIFY_URL", "https://n8n.example.invalid/webhook/notify")
    registry = registry_from_env()
    assert "notify" in registry
    assert registry["notify"].webhook_url == "https://n8n.example.invalid/webhook/notify"


def test_execute_tool_posts_to_mock_client() -> None:
    def handler(request: httpx.Request) -> httpx.Response:
        assert request.url.path == "/webhook/notify"
        assert request.headers["X-Idempotency-Key"] == "run-9"
        return httpx.Response(200, json={"delivered": True})

    client = httpx.Client(transport=httpx.MockTransport(handler))
    result = execute_tool(_tool(), {"message": "hi"}, "run-9", http_client=client, resolver=_resolver_public)
    assert result == {"delivered": True}


def test_execute_tool_retries_on_5xx_then_succeeds() -> None:
    calls = {"n": 0}

    def handler(request: httpx.Request) -> httpx.Response:
        calls["n"] += 1
        if calls["n"] < 3:
            return httpx.Response(503, json={"error": "busy"})
        return httpx.Response(200, json={"ok": True})

    client = httpx.Client(transport=httpx.MockTransport(handler))
    # R-B1-3: 5xx retries are idempotent-only, so this retrying tool
    # must be flagged idempotent (non-idempotent 5xx fails fast — see
    # test_5xx_not_retried_for_non_idempotent_tool).
    assert execute_tool(_tool(idempotent=True), {}, "run-5xx", http_client=client, resolver=_resolver_public) == {"ok": True}
    assert calls["n"] == 3


def test_execute_tool_retries_on_timeout_then_succeeds() -> None:
    # Timeout retries are idempotent-only (F-B1-4); this tool is flagged so.
    calls = {"n": 0}

    def handler(request: httpx.Request) -> httpx.Response:
        calls["n"] += 1
        if calls["n"] == 1:
            raise httpx.TimeoutException("slow")
        return httpx.Response(200, json={"ok": True})

    client = httpx.Client(transport=httpx.MockTransport(handler))
    tool = _tool(idempotent=True)
    assert execute_tool(tool, {}, "run-timeout", http_client=client, resolver=_resolver_public) == {"ok": True}
    assert calls["n"] == 2


def test_execute_tool_does_not_retry_on_4xx() -> None:
    calls = {"n": 0}

    def handler(request: httpx.Request) -> httpx.Response:
        calls["n"] += 1
        return httpx.Response(400, json={"error": "bad input"})

    client = httpx.Client(transport=httpx.MockTransport(handler))
    with pytest.raises(httpx.HTTPStatusError):
        execute_tool(_tool(), {}, "run-4xx", http_client=client, resolver=_resolver_public)
    assert calls["n"] == 1
