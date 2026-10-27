"""Tool registry: tools are n8n webhook declarations, not live integrations.

WIRING-SEAM OWNER: B1 owns tool execution (this module). B2's adapter
consumes it by wiring scouts to execute_tool; it does not re-implement
HTTP tool calls, retries, or URL validation.

TRUST (B1-4, F-B1-2, F-B1-5): env vars are OPERATOR-CONTROLLED TRUSTED
INPUT. Only the service operator may write the process environment;
anyone who can set N8N_TOOL_*_URL can already redirect tools, so env
values are validated (never blindly trusted) but env write access is
the control — it is not a substitute for validation, and validation is
not a substitute for restricting env write access. Tool auth values
(N8N_TOOL_<NAME>_AUTH) live in env only, are sent as an Authorization
header, and are NEVER logged.

URL validation (F-B1-2, R-B1-1, R-B1-2): https only; the allowlist
is REQUIRED, not optional — registry_from_env parses N8N_ALLOWED_HOSTS
and every tool it builds carries it; execute_tool refuses
allowed_hosts=None (fail closed) instead of allowing all. After DNS
resolution, a NON-allowlisted host must resolve ONLY to global
addresses (ip.is_global) — that single requirement covers 10/8,
172.16/12, 192.168/16, 127/8, 169.254.169.254, AND the 100.64.0.0/10
shared address space the old category enumeration missed. An
ALLOWLISTED host bypasses the global check (this is what lets n8n be
reached over Tailscale 100.x / private ranges: explicitly approved
hosts only) but still may never resolve to loopback, link-local
(incl. cloud metadata 169.254.169.254), multicast, or unspecified
addresses. DNS failure fails closed.

TOCTOU RESIDUAL (R-B1-2, recorded honestly, NOT fixed): validation DNS
and httpx connect DNS are two independent resolutions — a hostile DNS
answer could return a public IP at validation time and a private IP at
connect time. IP pinning (connect to the validated IP with TLS/SNI
preserved) is NOT implemented: httpx offers no supported path for it
without a custom transport, and an untested custom transport would be
a claim, not a control. Compensations: the allowlist (only approved
hosts, whose DNS is operator-controlled), per-tool auth, and
private-network-only deployment. IP pinning is a named wiring
hardening item for the wiring leg.

IDEMPOTENCY (F-B1-4, R-B1-3): nothing in this repo evidences that an
n8n webhook target honours X-Idempotency-Key for dedupe. Retries —
timeouts AND 5xx — are therefore allowed ONLY for tools flagged
idempotent (N8N_TOOL_<NAME>_IDEMPOTENT=true, verified per tool by the
operator with the webhook owner). A timeout on a non-idempotent tool
raises immediately: after a timeout the server-side outcome is
unknown, and a retry could double-execute a side effect. A 5xx on a
non-idempotent tool likewise fails fast (logged as a warning — the
log is the alert channel available in this skeleton; there is no
Slack integration here): a 5xx CAN follow a server-side side effect
that executed before the error response, so the old "5xx proves
non-success" theory is withdrawn.

Each tool is a named n8n webhook call: a URL from env, an input schema
(validated, not decorative), a timeout, and retries ONLY on 5xx
responses and (idempotent-only) timeouts — never on 4xx.
"""

import ipaddress
import logging
import os
import socket
import time
from dataclasses import dataclass, field
from typing import Any, Callable

import httpx

logger = logging.getLogger("b1_service.tools")

IDEMPOTENCY_HEADER = "X-Idempotency-Key"

#: Primitive JSON-schema types the minimal payload validator understands.
_TYPE_CHECKS: dict[str, Callable[[Any], bool]] = {
    "string": lambda v: isinstance(v, str),
    "integer": lambda v: isinstance(v, int) and not isinstance(v, bool),
    "number": lambda v: isinstance(v, (int, float)) and not isinstance(v, bool),
    "boolean": lambda v: isinstance(v, bool),
    "object": lambda v: isinstance(v, dict),
    "array": lambda v: isinstance(v, list),
}


@dataclass
class ToolDefinition:
    """One tool = one n8n webhook the agent may call."""

    name: str
    webhook_url: str
    input_schema: dict[str, Any] = field(default_factory=dict)
    timeout_seconds: float = 30.0
    max_retries: int = 2
    # Authorization header value from env (e.g. "Bearer ..."), or None.
    # Never logged. Absent auth means the webhook URL itself is the only
    # credential — do not use such a tool outside the private network.
    auth: str | None = None
    # True ONLY when the operator has verified with the webhook owner
    # that the target honours X-Idempotency-Key for dedupe. Gates
    # timeout retries (F-B1-4). Default False = timeouts never retried.
    idempotent: bool = False
    # Base backoff between retries; actual delay is backoff * 2**attempt.
    backoff_seconds: float = 0.5
    # Hosts this tool may call, from N8N_ALLOWED_HOSTS via
    # registry_from_env (R-B1-1). None means "no allowlist known":
    # execute_tool refuses such a tool fail-closed. A caller that
    # builds a ToolDefinition by hand must set this or pass
    # allowed_hosts to execute_tool explicitly.
    allowed_hosts: set[str] | None = None


def _default_resolver(host: str, port: int) -> list[str]:
    """Resolve a host to IP strings via the system resolver."""
    infos = socket.getaddrinfo(host, port, proto=socket.IPPROTO_TCP)
    return [info[4][0] for info in infos]


def validate_tool_url(
    url: str,
    allowed_hosts: set[str] | None = None,
    resolver: Callable[[str, int], list[str]] | None = None,
    check_dns: bool = True,
) -> None:
    """Validate a tool URL before any HTTP is sent. Raises ValueError.

    Checks: https scheme, host present, host on the allowlist when one
    is supplied, and (when check_dns=True) every DNS-resolved address.
    A non-allowlisted host must resolve ONLY to global addresses
    (is_global) — that covers private, loopback, link-local, multicast,
    reserved, unspecified, AND shared address space (100.64.0.0/10).
    An allowlisted host bypasses the global check (Tailscale/private
    n8n hosts) but still may never resolve to loopback, link-local
    (incl. cloud metadata 169.254.169.254), multicast, or unspecified.
    Registry build passes check_dns=False so startup never depends on
    DNS; execute_tool always checks DNS. NOTE: passing
    allowed_hosts=None here means "no allowlist check at this layer" —
    execute_tool never does that (it refuses None fail-closed); call
    this helper directly only with an explicit allowlist.
    """
    from urllib.parse import urlparse

    parsed = urlparse(url)
    if parsed.scheme != "https":
        raise ValueError(f"tool URL must use https, got scheme {parsed.scheme!r}")
    host = parsed.hostname
    if not host:
        raise ValueError(f"tool URL has no host: {url!r}")
    allowlisted = allowed_hosts is not None and \
        host.lower() in {h.lower() for h in allowed_hosts}
    if allowed_hosts is not None and not allowlisted:
        raise ValueError(f"tool host {host!r} is not on the allowed-hosts allowlist")
    if not check_dns:
        return
    resolve = resolver or _default_resolver
    try:
        addresses = resolve(host, 443)
    except Exception as exc:  # noqa: BLE001 - DNS failure must fail closed
        raise ValueError(f"tool host {host!r} did not resolve: {exc}") from None
    if not addresses:
        raise ValueError(f"tool host {host!r} resolved to no addresses")
    for raw in addresses:
        try:
            ip = ipaddress.ip_address(raw)
        except ValueError:
            raise ValueError(f"tool host {host!r} resolved to non-IP {raw!r}") from None
        if allowlisted:
            if (ip.is_loopback or ip.is_link_local or ip.is_multicast
                    or ip.is_unspecified):
                raise ValueError(
                    f"tool host {host!r} resolves to blocked address {raw} "
                    "(loopback/link-local/metadata/multicast/unspecified — "
                    "blocked even for allowlisted hosts)"
                )
        elif not ip.is_global:
            raise ValueError(
                f"tool host {host!r} resolves to non-global address {raw} "
                "(private/loopback/link-local/metadata/reserved/shared — "
                "not a global address)"
            )


def _parse_bool(raw: str) -> bool:
    return raw.strip().lower() in ("1", "true", "yes", "on")


def parse_allowed_hosts_from_env() -> set[str]:
    """Parse N8N_ALLOWED_HOSTS (comma-separated, R-B1-1).

    REQUIRED: an unset or empty value raises ValueError (fail closed)
    instead of registering tools with no allowlist. Hosts are
    lowercased; matching in validate_tool_url is case-insensitive.
    """
    raw = os.environ.get("N8N_ALLOWED_HOSTS", "")
    hosts = {h.strip().lower() for h in raw.split(",") if h.strip()}
    if not hosts:
        raise ValueError(
            "N8N_ALLOWED_HOSTS is not set or empty; refusing to register "
            "tools without an allowlist (fail closed). Set it to the "
            "comma-separated approved n8n hosts."
        )
    return hosts


def registry_from_env() -> dict[str, ToolDefinition]:
    """Build the registry from N8N_TOOL_<NAME>_URL env vars.

    Companion vars per tool: N8N_TOOL_<NAME>_AUTH (Authorization header
    value, env only, never logged) and N8N_TOOL_<NAME>_IDEMPOTENT
    ("true" when the target is verified to honour the idempotency key).
    N8N_ALLOWED_HOSTS is parsed first and enforced as the default for
    EVERY tool (R-B1-1): an unlisted host URL fails closed here
    (ValueError), and each built tool carries the allowlist so a caller
    that uses registry tools never needs to pass allowed_hosts again.
    A non-https URL fails closed here (ValueError) instead of registering
    an unguarded tool. No tool is registered unless its env var is set.
    """
    allowed_hosts = parse_allowed_hosts_from_env()
    registry: dict[str, ToolDefinition] = {}
    prefix = "N8N_TOOL_"
    suffix = "_URL"
    for key, value in os.environ.items():
        if key.startswith(prefix) and key.endswith(suffix) and value:
            name = key[len(prefix) : -len(suffix)].lower()
            # scheme/host/allowlist only; DNS at call time
            validate_tool_url(value, allowed_hosts=allowed_hosts, check_dns=False)
            registry[name] = ToolDefinition(
                name=name,
                webhook_url=value,
                auth=os.environ.get(f"{prefix}{name.upper()}_AUTH"),
                idempotent=_parse_bool(
                    os.environ.get(f"{prefix}{name.upper()}_IDEMPOTENT", "")
                ),
                allowed_hosts=set(allowed_hosts),
            )
    return registry


def validate_tool_payload(tool: ToolDefinition, payload: dict[str, Any]) -> None:
    """Validate a payload against the tool's input_schema (B1-5).

    Only `required` and per-property primitive `type` are enforced; the
    schema is otherwise advisory. An empty schema validates everything.
    Raises ValueError naming the offending field.
    """
    schema = tool.input_schema or {}
    for required_field in schema.get("required", []):
        if required_field not in payload:
            raise ValueError(
                f"tool {tool.name!r}: missing required field {required_field!r}"
            )
    for prop, prop_schema in (schema.get("properties") or {}).items():
        if prop not in payload:
            continue
        expected = prop_schema.get("type") if isinstance(prop_schema, dict) else None
        check = _TYPE_CHECKS.get(expected) if expected else None
        if check is not None and not check(payload[prop]):
            raise ValueError(
                f"tool {tool.name!r}: field {prop!r} must be {expected}, "
                f"got {type(payload[prop]).__name__}"
            )


def build_tool_call(
    tool: ToolDefinition, payload: dict[str, Any], idempotency_key: str
) -> tuple[str, dict[str, str], dict[str, Any]]:
    """Return (url, headers, json payload) for a tool invocation.

    Pure construction — no HTTP happens here, which is what tests assert.
    Per-tool auth (F-B1-5) is added here; the auth value is never logged
    anywhere in this module.
    """
    headers = {
        "Content-Type": "application/json",
        IDEMPOTENCY_HEADER: idempotency_key,
    }
    if tool.auth:
        headers["Authorization"] = tool.auth
    return tool.webhook_url, headers, payload


def execute_tool(
    tool: ToolDefinition,
    payload: dict[str, Any],
    idempotency_key: str,
    http_client: httpx.Client | None = None,
    resolver: Callable[[str, int], list[str]] | None = None,
    allowed_hosts: set[str] | None = None,
    sleep: Callable[[float], None] = time.sleep,
) -> Any:
    """Call a tool's n8n webhook, retrying ONLY for tools flagged
    idempotent — timeouts and 5xx alike — never on 4xx, never for a
    non-idempotent tool (R-B1-3: a 5xx can follow a server-side side
    effect, so a non-idempotent 5xx fails fast with a warning log).

    Allowlist resolution (R-B1-1): the explicit argument wins, else the
    tool's own allowed_hosts (set by registry_from_env); if neither is
    set, refuse BEFORE any HTTP (fail closed) instead of allowing all.
    Validation runs before any HTTP: allowlist refusal, payload schema,
    then URL (scheme/allowlist/DNS-resolved IP block). A client created
    here is closed before returning (F-B1-7); a caller-passed client
    stays the caller's to close. Retries back off exponentially from
    tool.backoff_seconds. A non-JSON 2xx body is returned wrapped as
    {"raw_text": ...} instead of raising from response.json().
    """
    effective_hosts = allowed_hosts if allowed_hosts is not None \
        else tool.allowed_hosts
    if effective_hosts is None:
        raise ValueError(
            "tool execution refused: no allowed-hosts allowlist — "
            "pass allowed_hosts explicitly or build the tool via "
            "registry_from_env with N8N_ALLOWED_HOSTS set (fail closed)"
        )
    validate_tool_payload(tool, payload)
    validate_tool_url(tool.webhook_url, allowed_hosts=effective_hosts, resolver=resolver)
    url, headers, body = build_tool_call(tool, payload, idempotency_key)
    client = http_client or httpx.Client()
    owns_client = http_client is None
    attempts = tool.max_retries + 1
    last_error: Exception | None = None
    try:
        for attempt in range(attempts):
            try:
                response = client.post(
                    url, headers=headers, json=body, timeout=tool.timeout_seconds
                )
            except httpx.TimeoutException as exc:
                # F-B1-4: outcome unknown after a timeout; retry ONLY when
                # this tool is proven idempotent.
                if not tool.idempotent or attempt == attempts - 1:
                    raise
                last_error = exc
                sleep(tool.backoff_seconds * (2**attempt))
                continue
            if response.status_code >= 500:
                # R-B1-3: a 5xx can follow a server-side side effect, so
                # a non-idempotent tool fails fast — no retry, no sleep.
                # The warning log is the fail-fast alert available here.
                if not tool.idempotent:
                    logger.warning(
                        "tool %r: HTTP %s on non-idempotent tool — "
                        "failing fast without retry (server-side outcome "
                        "unknown; a retry could double-execute)",
                        tool.name, response.status_code,
                    )
                    response.raise_for_status()
                last_error = httpx.HTTPStatusError(
                    "server error", request=response.request, response=response
                )
                if attempt == attempts - 1:
                    response.raise_for_status()
                sleep(tool.backoff_seconds * (2**attempt))
                continue
            response.raise_for_status()
            if not response.content:
                return {}
            try:
                return response.json()
            except ValueError:
                return {"raw_text": response.text}
    finally:
        if owns_client:
            client.close()
    assert last_error is not None  # pragma: no cover - loop always sets it
    raise last_error
