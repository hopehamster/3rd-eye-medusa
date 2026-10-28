"""Security re-review residuals (R-B1-1..R-B1-5), written TDD-first.

These tests FAILED against the pre-fix code (allowlist unparsed,
100.64/10 admitted, 5xx retried for non-idempotent tools, _events never
pruned, wait without timeout, no proxy artifact). No live services.
"""

from pathlib import Path

import httpx
import pytest

from app.runs import InMemoryRunStore
from app.tools import ToolDefinition, execute_tool, registry_from_env, validate_tool_url

PUBLIC_IP = "93.184.216.34"


def _resolver_public(host: str, port: int) -> list[str]:
    return [PUBLIC_IP]


def _tool(**overrides) -> ToolDefinition:
    base = {
        "name": "notify",
        "webhook_url": "https://n8n.example.invalid/webhook/notify",
        "timeout_seconds": 10.0,
        "max_retries": 2,
        "allowed_hosts": {"n8n.example.invalid"},
    }
    base.update(overrides)
    return ToolDefinition(**base)


# --- R-B1-1: allowlist wired, fail closed ---

def test_registry_parses_allowed_hosts_and_rejects_unlisted(monkeypatch) -> None:
    monkeypatch.setenv("N8N_ALLOWED_HOSTS", "n8n.example.invalid")
    monkeypatch.setenv("N8N_TOOL_EVIL_URL", "https://evil.example.invalid/webhook/x")
    with pytest.raises(ValueError, match="allowlist"):
        registry_from_env()


def test_registry_with_allowlist_registers_listed_tool(monkeypatch) -> None:
    monkeypatch.setenv("N8N_ALLOWED_HOSTS", "n8n.example.invalid")
    monkeypatch.setenv("N8N_TOOL_NOTIFY_URL", "https://n8n.example.invalid/webhook/notify")
    registry = registry_from_env()
    assert registry["notify"].allowed_hosts == {"n8n.example.invalid"}


def test_registry_without_allowed_hosts_fails_closed(monkeypatch) -> None:
    monkeypatch.delenv("N8N_ALLOWED_HOSTS", raising=False)
    monkeypatch.setenv("N8N_TOOL_NOTIFY_URL", "https://n8n.example.invalid/webhook/notify")
    with pytest.raises(ValueError, match="N8N_ALLOWED_HOSTS"):
        registry_from_env()


def test_execute_tool_without_allowlist_refuses_before_http() -> None:
    calls = {"n": 0}

    def handler(request: httpx.Request) -> httpx.Response:
        calls["n"] += 1
        return httpx.Response(200, json={"ok": True})

    client = httpx.Client(transport=httpx.MockTransport(handler))
    with pytest.raises(ValueError, match="allowlist"):
        execute_tool(_tool(allowed_hosts=None), {}, "k-no-allow",
                     http_client=client, resolver=_resolver_public,
                     allowed_hosts=None)
    assert calls["n"] == 0


# --- R-B1-2: global address required; allowlist exception for Tailscale ---

def test_shared_address_space_rejected_when_not_allowlisted() -> None:
    def resolver(host: str, port: int) -> list[str]:
        return ["100.64.0.1"]

    # Direct-helper check (allowed_hosts=None = no allowlist layer here):
    # the global-address requirement itself must reject 100.64/10. In
    # the execute_tool path an unlisted host is rejected even earlier,
    # by the allowlist check, before DNS is consulted.
    with pytest.raises(ValueError, match="global"):
        validate_tool_url("https://n8n.example.invalid/webhook/x",
                          allowed_hosts=None,
                          resolver=resolver)


def test_allowlisted_host_may_resolve_to_shared_address_space() -> None:
    def resolver(host: str, port: int) -> list[str]:
        return ["100.64.0.1"]

    # Tailscale n8n hosts live in 100.64/10: explicitly approved hosts
    # bypass the global check (private/shared ranges only — see next test).
    validate_tool_url("https://n8n.example.invalid/webhook/x",
                      allowed_hosts={"n8n.example.invalid"},
                      resolver=resolver)


def test_allowlisted_host_still_cannot_resolve_to_metadata_or_loopback() -> None:
    for bad_ip in ("169.254.169.254", "127.0.0.1", "::1"):
        def resolver(host: str, port: int, _ip: str = bad_ip) -> list[str]:
            return [_ip]

        with pytest.raises(ValueError):
            validate_tool_url("https://n8n.example.invalid/webhook/x",
                              allowed_hosts={"n8n.example.invalid"},
                              resolver=resolver)


# --- R-B1-3: 5xx retries gated on idempotency ---

def test_5xx_not_retried_for_non_idempotent_tool() -> None:
    calls = {"n": 0}
    sleeps: list[float] = []

    def handler(request: httpx.Request) -> httpx.Response:
        calls["n"] += 1
        return httpx.Response(503, json={"error": "busy"})

    client = httpx.Client(transport=httpx.MockTransport(handler))
    with pytest.raises(httpx.HTTPStatusError):
        execute_tool(_tool(idempotent=False), {}, "k-5xx-nonidem",
                     http_client=client, resolver=_resolver_public,
                     sleep=sleeps.append)
    assert calls["n"] == 1  # fail fast: a 5xx can follow a side effect
    assert sleeps == []


def test_5xx_retried_for_idempotent_tool() -> None:
    calls = {"n": 0}

    def handler(request: httpx.Request) -> httpx.Response:
        calls["n"] += 1
        if calls["n"] < 3:
            return httpx.Response(503, json={"error": "busy"})
        return httpx.Response(200, json={"ok": True})

    client = httpx.Client(transport=httpx.MockTransport(handler))
    assert execute_tool(_tool(idempotent=True), {}, "k-5xx-idem",
                        http_client=client, resolver=_resolver_public,
                        sleep=lambda _: None) == {"ok": True}
    assert calls["n"] == 3


# --- R-B1-4: bounded run store + proxy artifact ---

def test_completed_run_events_are_pruned() -> None:
    store = InMemoryRunStore()
    store.create_or_get("run-1", {}, lambda: {"ok": True})
    assert store.pending_event_count() == 0


def test_waiting_duplicate_times_out_instead_of_blocking_forever() -> None:
    import threading

    store = InMemoryRunStore(wait_timeout_seconds=0.2)
    release = threading.Event()

    def slow() -> dict:
        release.wait(timeout=10)
        return {"slow": True}

    outcome: list = []
    t = threading.Thread(
        target=lambda: outcome.append(
            store.create_or_get("run-slow", {}, slow)))
    t.start()
    # Give the owner time to claim, then wait as a duplicate: must time out.
    import time as _time
    _time.sleep(0.05)
    with pytest.raises(TimeoutError):
        store.create_or_get("run-slow", {}, lambda: {"other": True})
    release.set()
    t.join(timeout=10)
    assert outcome[0][1]["result"] == {"slow": True}


def test_reverse_proxy_example_ships_with_rate_and_body_limits() -> None:
    proxy = Path(__file__).resolve().parent.parent / "deploy" / "nginx.conf.example"
    assert proxy.exists(), "deploy/nginx.conf.example must ship with the service"
    text = proxy.read_text()
    assert "limit_req" in text
    assert "client_max_body_size" in text
    assert "EXAMPLE" in text  # labelled example-to-adapt, not a deployed control
