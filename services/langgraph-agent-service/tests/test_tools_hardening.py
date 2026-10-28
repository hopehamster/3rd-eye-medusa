"""Tool hardening (B1-4, F-B1-2, F-B1-4, F-B1-5, B1-5, F-B1-7).

URL allowlist + private/IP block after DNS resolution, per-tool auth,
timeout retries only for proven-idempotent tools, backoff, non-JSON 2xx,
client close, payload schema validation. Written first; must FAIL
against the old tools module."""

import httpx
import pytest

from app.tools import (
    ToolDefinition,
    build_tool_call,
    execute_tool,
    validate_tool_payload,
    validate_tool_url,
)

PUBLIC_IP = "93.184.216.34"  # documentation-range public address, fake resolver only


def _resolver_public(host: str, port: int) -> list[str]:
    return [PUBLIC_IP]


def _tool(**overrides) -> ToolDefinition:
    base = {
        "name": "notify",
        "webhook_url": "https://n8n.example.invalid/webhook/notify",
        "timeout_seconds": 10.0,
        "max_retries": 2,
        # R-B1-1: execute_tool refuses allowed_hosts=None fail-closed.
        "allowed_hosts": {"n8n.example.invalid"},
    }
    base.update(overrides)
    return ToolDefinition(**base)


def test_http_scheme_rejected() -> None:
    with pytest.raises(ValueError, match="https"):
        validate_tool_url("http://n8n.example.invalid/webhook/x", resolver=_resolver_public)


def test_private_ip_after_dns_blocked() -> None:
    def resolver(host: str, port: int) -> list[str]:
        return ["10.1.2.3"]

    with pytest.raises(ValueError, match="private|loopback|link-local|reserved"):
        validate_tool_url("https://n8n.example.invalid/webhook/x", resolver=resolver)


def test_loopback_and_metadata_blocked() -> None:
    for bad_ip in ("127.0.0.1", "169.254.169.254", "::1"):
        def resolver(host: str, port: int, _ip: str = bad_ip) -> list[str]:
            return [_ip]

        with pytest.raises(ValueError):
            validate_tool_url("https://n8n.example.invalid/webhook/x", resolver=resolver)


def test_allowlist_rejects_unlisted_host() -> None:
    with pytest.raises(ValueError, match="allowlist"):
        validate_tool_url(
            "https://evil.example.invalid/webhook/x",
            allowed_hosts={"n8n.example.invalid"},
            resolver=_resolver_public,
        )
    # Listed host passes.
    validate_tool_url(
        "https://n8n.example.invalid/webhook/x",
        allowed_hosts={"n8n.example.invalid"},
        resolver=_resolver_public,
    )


def test_per_tool_auth_header_sent() -> None:
    tool = _tool(auth="Bearer test-token-placeholder")
    _, headers, _ = build_tool_call(tool, {"m": "hi"}, "k-1")
    assert headers["Authorization"] == "Bearer test-token-placeholder"
    # Without auth configured, no Authorization header is invented.
    _, headers2, _ = build_tool_call(_tool(), {"m": "hi"}, "k-1")
    assert "Authorization" not in headers2


def test_timeout_not_retried_for_non_idempotent_tool() -> None:
    calls = {"n": 0}

    def handler(request: httpx.Request) -> httpx.Response:
        calls["n"] += 1
        raise httpx.TimeoutException("slow")

    client = httpx.Client(transport=httpx.MockTransport(handler))
    with pytest.raises(httpx.TimeoutException):
        execute_tool(_tool(idempotent=False), {}, "k-timeout", http_client=client,
                     resolver=_resolver_public)
    assert calls["n"] == 1


def test_timeout_retried_for_proven_idempotent_tool() -> None:
    calls = {"n": 0}

    def handler(request: httpx.Request) -> httpx.Response:
        calls["n"] += 1
        if calls["n"] == 1:
            raise httpx.TimeoutException("slow")
        return httpx.Response(200, json={"ok": True})

    client = httpx.Client(transport=httpx.MockTransport(handler))
    assert execute_tool(_tool(idempotent=True), {}, "k-timeout-idem",
                        http_client=client, resolver=_resolver_public) == {"ok": True}
    assert calls["n"] == 2


def test_retry_backoff_sleep_called() -> None:
    sleeps: list[float] = []

    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(503, json={"error": "busy"})

    client = httpx.Client(transport=httpx.MockTransport(handler))
    with pytest.raises(httpx.HTTPStatusError):
        # R-B1-3: 5xx retries are idempotent-only.
        execute_tool(_tool(max_retries=2, backoff_seconds=0.5, idempotent=True), {}, "k-backoff",
                     http_client=client, resolver=_resolver_public,
                     sleep=sleeps.append)
    assert sleeps == [0.5, 1.0]


def test_non_json_2xx_returns_raw_text() -> None:
    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(200, text="plain acknowledgment")

    client = httpx.Client(transport=httpx.MockTransport(handler))
    result = execute_tool(_tool(), {}, "k-raw", http_client=client, resolver=_resolver_public)
    assert result == {"raw_text": "plain acknowledgment"}


def test_created_client_is_closed(monkeypatch) -> None:
    closed = {"n": 0}

    class FakeClient:
        def __init__(self, *args, **kwargs) -> None:
            pass

        def post(self, *args, **kwargs) -> httpx.Response:
            request = httpx.Request("POST", "https://n8n.example.invalid/webhook/notify")
            return httpx.Response(200, json={"ok": True}, request=request)

        def close(self) -> None:
            closed["n"] += 1

    monkeypatch.setattr(httpx, "Client", FakeClient)
    execute_tool(_tool(), {}, "k-close", resolver=_resolver_public)
    assert closed["n"] == 1


def test_payload_schema_validated() -> None:
    tool = _tool(input_schema={
        "type": "object",
        "required": ["message"],
        "properties": {"message": {"type": "string"}, "count": {"type": "integer"}},
    })
    validate_tool_payload(tool, {"message": "hi", "count": 2})
    with pytest.raises(ValueError, match="message"):
        validate_tool_payload(tool, {"count": 2})
    with pytest.raises(ValueError, match="count"):
        validate_tool_payload(tool, {"message": "hi", "count": "two"})


def test_registry_reads_auth_and_idempotent_flags(monkeypatch) -> None:
    from app.tools import registry_from_env

    monkeypatch.setenv("N8N_ALLOWED_HOSTS", "n8n.example.invalid")
    monkeypatch.setenv("N8N_TOOL_NOTIFY_URL", "https://n8n.example.invalid/webhook/notify")
    monkeypatch.setenv("N8N_TOOL_NOTIFY_AUTH", "Bearer test-token-placeholder")
    monkeypatch.setenv("N8N_TOOL_NOTIFY_IDEMPOTENT", "true")
    registry = registry_from_env()
    assert registry["notify"].auth == "Bearer test-token-placeholder"
    assert registry["notify"].idempotent is True


def test_registry_rejects_non_https_url(monkeypatch) -> None:
    from app.tools import registry_from_env

    monkeypatch.setenv("N8N_ALLOWED_HOSTS", "n8n.example.invalid")
    monkeypatch.setenv("N8N_TOOL_NOTIFY_URL", "http://n8n.example.invalid/webhook/notify")
    with pytest.raises(ValueError, match="https"):
        registry_from_env()
