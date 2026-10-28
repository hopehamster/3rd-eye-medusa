"""Shared-secret auth: constant-time compare, 401 on bad/missing secret, no secret in logs."""

import logging
import uuid

from app.security import verify_shared_secret


def test_verify_accepts_exact_match() -> None:
    assert verify_shared_secret("test-secret-placeholder", "test-secret-placeholder") is True


def test_verify_rejects_wrong_secret() -> None:
    assert verify_shared_secret("wrong-secret", "test-secret-placeholder") is False


def test_verify_rejects_empty_or_missing() -> None:
    assert verify_shared_secret("", "test-secret-placeholder") is False
    assert verify_shared_secret(None, "test-secret-placeholder") is False
    assert verify_shared_secret("test-secret-placeholder", "") is False


def test_bad_secret_returns_401(client, caplog) -> None:
    with caplog.at_level(logging.WARNING):
        resp = client.post(
            "/agent/run",
            headers={"X-Agent-Shared-Secret": "wrong-secret"},
            json={"run_id": str(uuid.uuid4()), "input": {}},
        )
    assert resp.status_code == 401
    # The attempt is logged, the secret value never is.
    assert "wrong-secret" not in caplog.text
    assert "test-secret-placeholder" not in caplog.text


def test_missing_secret_returns_401(client) -> None:
    resp = client.post("/agent/run", json={"run_id": str(uuid.uuid4()), "input": {}})
    assert resp.status_code == 401


def test_good_secret_is_not_401(client, auth_headers) -> None:
    resp = client.post(
        "/agent/run", headers=auth_headers, json={"run_id": str(uuid.uuid4()), "input": {}}
    )
    assert resp.status_code != 401


def test_non_ascii_presented_secret_returns_false() -> None:
    # hmac.compare_digest on str raises TypeError for non-ASCII input; the
    # verifier must fail closed (False) instead of raising.
    assert verify_shared_secret("sécret-üñïcode", "test-secret-placeholder") is False


def test_non_ascii_expected_secret_returns_false() -> None:
    assert verify_shared_secret("test-secret-placeholder", "sécret-üñïcode") is False


def test_non_ascii_presented_secret_returns_401(client) -> None:
    # Sent as raw latin-1 bytes, as a real non-ASCII header arrives on the
    # wire; the server decodes it to non-ASCII text, which must 401, not 500.
    resp = client.post(
        "/agent/run",
        headers={b"X-Agent-Shared-Secret": "sécret-üñïcode".encode("latin-1")},
        json={"run_id": str(uuid.uuid4()), "input": {}},
    )
    assert resp.status_code == 401
