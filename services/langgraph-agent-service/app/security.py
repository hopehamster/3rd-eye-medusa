"""Shared-secret authentication for the n8n webhook trigger.

The secret lives ONLY in the AGENT_SHARED_SECRET env var. It is never logged,
never returned in a response, and never written into code or tests except as
an obviously fake test placeholder.

TRUST BOUNDARY (F-B1-1): n8n is the SOLE secret holder and the service is
reachable ONLY on the private n8n↔service network. This single shared
secret is the whole auth story: there is no per-caller ownership, so
run_ids must be unguessable UUIDv4s (enforced in main.py) — a predictable
run_id is enumerable by any secret holder.
"""

import hmac


def verify_shared_secret(provided: str | None, expected: str | None) -> bool:
    """Constant-time comparison of the presented secret against the expected one.

    Returns False (never raises) for missing/empty values so a missing header
    and a wrong header are handled identically by the caller: 401.
    Non-ASCII input is compared as UTF-8 bytes, so it fails closed instead
    of raising (hmac.compare_digest on str rejects non-ASCII); anything
    unencodable still returns False.
    """
    if not provided or not expected:
        return False
    try:
        return hmac.compare_digest(
            provided.encode("utf-8"), expected.encode("utf-8")
        )
    except (TypeError, UnicodeEncodeError):
        return False
