"""Tests for the v2 fulfilment-pipe logic mirror (no live calls).

Mirrors, in plain Python, the exact decisions the n8n v2 workflow nodes
must make: signature verification, dedupe, stock routing, idempotency,
dead-lettering, CJ envelope parsing, and workflow-JSON structural checks.
Every test here failed before fulfilment_logic.py existed (RED).
"""

from __future__ import annotations

import json
import os
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from fulfilment_logic import (  # noqa: E402
    BadSignatureThrottle,
    DeadLetter,
    DedupeStore,
    DuplicateAlertThrottle,
    build_cj_order_body,
    build_digest,
    evaluate_stock,
    evaluate_stock_keyed,
    idempotency_key,
    normalize_order,
    parse_cj_create_order,
    parse_cj_pay,
    parse_cj_stock,
    parse_cj_token,
    parse_cj_tracking,
    route_stock,
    should_record_order_id,
    stock_lookup_path,
    verify_signature,
    verify_signature_iterations,
)

HERE = Path(__file__).resolve().parent
WORKFLOW = HERE.parent / "3rd-eye-order-to-fulfilment-v2.json"


# --- 1. Webhook signature verification (constant-time, env secret) ---

def test_valid_signature_accepted() -> None:
    assert verify_signature("s3cret", "s3cret") is True


def test_bad_signature_dropped() -> None:
    assert verify_signature("wrong", "s3cret") is False


def test_empty_secret_never_valid() -> None:
    assert verify_signature("anything", "") is False
    assert verify_signature("", "") is False


def test_missing_header_dropped() -> None:
    assert verify_signature(None, "s3cret") is False


def test_signature_compare_is_fixed_length_loop() -> None:
    # F-A1-3: the workflow JS loops secret.length times, never
    # min(provided.length, secret.length) times, so iteration count cannot
    # leak the provided length. The harness mirrors that loop exactly in
    # _fixed_length_compare, which verify_signature delegates to.
    import inspect

    from fulfilment_logic import _fixed_length_compare

    src = inspect.getsource(_fixed_length_compare)
    assert "range(len(secret))" in src
    assert "range(len(provided))" not in src
    src_verify = inspect.getsource(verify_signature)
    assert "_fixed_length_compare" in src_verify
    for provided, secret, expected_iterations in (
            ("", "s3cret", 6), ("x", "s3cret", 6),
            ("s3cret", "s3cret", 6), ("x" * 100, "s3cret", 6)):
        assert verify_signature_iterations(provided, secret) == expected_iterations


def test_signature_fixed_length_still_rejects_wrong_and_empty() -> None:
    assert verify_signature("wrong", "s3cret") is False
    assert verify_signature("anything", "") is False
    assert verify_signature("", "") is False


# --- 2. Dedupe by order_id ---

def test_first_delivery_runs() -> None:
    store = DedupeStore()
    assert store.check("ord_1") is False  # not a duplicate


def test_duplicate_delivery_acked_never_rerun() -> None:
    store = DedupeStore()
    assert store.check("ord_1") is False
    assert store.check("ord_1") is True
    assert store.check("ord_1") is True


def test_different_orders_independent() -> None:
    store = DedupeStore()
    store.check("ord_1")
    assert store.check("ord_2") is False


def test_dedupe_cap_prunes_oldest() -> None:
    store = DedupeStore(cap=3)
    for oid in ("a", "b", "c"):
        store.check(oid)
    store.check("d")  # over cap: oldest ('a') pruned
    assert len(store) == 3
    assert store.check("a") is False  # pruned, so treated as new again
    # Re-adding "a" pushes the store back over cap, so the next-oldest
    # ("b") is pruned instead; "c" survives. (contains() probes without
    # re-adding, since check() itself would prune again.)
    assert store.contains("b") is False
    assert store.contains("c") is True


# --- 3. Stock-branch routing ---

def test_all_in_stock_routes_to_po() -> None:
    items = [{"sku": "SKU-1", "qty": 2}]
    stock = {"SKU-1": 5}
    decision = route_stock(items, stock)
    assert decision["all_in_stock"] is True
    assert decision["shortages"] == []


def test_shortage_routes_to_backorder() -> None:
    items = [{"sku": "SKU-1", "qty": 2}, {"sku": "SKU-2", "qty": 1}]
    stock = {"SKU-1": 5, "SKU-2": 0}
    decision = route_stock(items, stock)
    assert decision["all_in_stock"] is False
    assert decision["shortages"] == ["SKU-2"]


def test_unknown_sku_is_a_shortage() -> None:
    decision = route_stock([{"sku": "NOPE", "qty": 1}], {})
    assert decision["all_in_stock"] is False
    assert decision["shortages"] == ["NOPE"]


def test_exact_quantity_counts_as_in_stock() -> None:
    decision = route_stock([{"sku": "SKU-1", "qty": 3}], {"SKU-1": 3})
    assert decision["all_in_stock"] is True


def test_cj_stock_envelope_parses_total_inventory() -> None:
    # Real CJ queryByVid envelope: {code, result, data: {totalInventoryNum}}
    raw = {"code": 200, "result": True,
           "data": {"vid": "VID-1", "totalInventoryNum": 4}}
    assert parse_cj_stock(raw) == 4


def test_cj_stock_envelope_error_is_not_stock() -> None:
    raw = {"code": 1600001, "result": False, "message": "token expired",
           "data": None}
    assert parse_cj_stock(raw) is None


def test_evaluate_stock_aggregates_per_line_results() -> None:
    lines = [{"sku": "A", "qty": 1, "available": 10},
             {"sku": "B", "qty": 2, "available": 1}]
    result = evaluate_stock(lines)
    assert result["all_in_stock"] is False
    assert result["shortages"] == ["B"]


# --- 4. Idempotency-key derivation ---

def test_idempotency_key_is_order_id() -> None:
    assert idempotency_key("ord_123") == "ord_123"


def test_idempotency_key_stable_and_distinct() -> None:
    assert idempotency_key("ord_1") == idempotency_key("ord_1")
    assert idempotency_key("ord_1") != idempotency_key("ord_2")


# --- 5. Dead-letter behaviour ---

def test_failed_po_lands_in_dead_letter() -> None:
    dl = DeadLetter()
    assert dl.record("ord_9", "CJ create order failed") is True
    assert dl.contains("ord_9") is True


def test_failed_po_lands_exactly_once() -> None:
    dl = DeadLetter()
    dl.record("ord_9", "CJ create order failed")
    assert dl.record("ord_9", "CJ create order failed") is False
    assert len(dl) == 1


def test_different_failed_orders_each_land_once() -> None:
    dl = DeadLetter()
    dl.record("ord_1", "fail")
    dl.record("ord_2", "fail")
    assert len(dl) == 2


# --- 6. CJ envelope parsing (create order / tracking) ---

def test_cj_create_success_parses_ids() -> None:
    raw = {"code": 200, "result": True,
           "data": {"orderId": "CJ-1", "orderNumber": "ord_1",
                    "shipmentOrderId": "SHIP-1"}}
    parsed = parse_cj_create_order(raw)
    assert parsed["ok"] is True
    assert parsed["cj_order_id"] == "CJ-1"
    assert parsed["shipment_order_id"] == "SHIP-1"


def test_cj_create_failure_is_not_ok() -> None:
    raw = {"code": 1600300, "result": False, "message": "bad param",
           "data": None}
    assert parse_cj_create_order(raw)["ok"] is False


def test_cj_create_success_flag_alone_is_not_ok() -> None:
    # v1 checked a bare `success` field; CJ envelopes have no such field.
    raw = {"success": True, "data": {"orderId": "CJ-1"}}
    assert parse_cj_create_order(raw)["ok"] is False


def test_tracking_present_only_when_track_number_set() -> None:
    raw = {"code": 200, "result": True,
           "data": {"trackNumber": "CJ123", "trackingProvider": "CJPacket"}}
    parsed = parse_cj_tracking(raw)
    assert parsed["tracking_present"] is True
    assert parsed["tracking_number"] == "CJ123"
    assert parse_cj_tracking({"code": 200, "result": True,
                              "data": {"trackNumber": ""}}
                              )["tracking_present"] is False
    assert parse_cj_tracking({"code": 200, "result": True,
                              "data": {}}
                             )["tracking_present"] is False


# --- 7. Workflow JSON structural checks (v2 file itself) ---

def _workflow() -> dict:
    assert WORKFLOW.exists(), f"v2 workflow missing: {WORKFLOW}"
    return json.loads(WORKFLOW.read_text())


def test_workflow_has_no_todo_placeholders() -> None:
    text = WORKFLOW.read_text()
    assert "TODO" not in text


def test_workflow_connections_all_resolve() -> None:
    wf = _workflow()
    names = {n["name"] for n in wf["nodes"]}
    for source, outs in wf["connections"].items():
        assert source in names, f"connection source unknown: {source}"
        for branch in outs["main"]:
            for link in branch:
                assert link["node"] in names, (
                    f"{source} -> unknown node {link['node']}")


def test_workflow_uses_doc_grounded_cj_endpoints_only() -> None:
    text = WORKFLOW.read_text()
    # Exact invented v1 paths (closing quote distinguishes them from the
    # real queryByVid path, which legitimately starts with /product/stock/).
    for invented in ("/product/stock'", "/order/create'", "/product/inventory'"):
        assert invented not in text, f"invented endpoint still present: {invented}"
    for real in ("authentication/getAccessToken",
                 "product/stock/queryByVid",
                 "shopping/order/createOrderV3",
                 "shopping/order/getOrderDetail",
                 "product/listV2"):
        assert real in text, f"missing doc-grounded endpoint: {real}"


def test_workflow_uses_cj_access_token_header_not_bearer_api_key() -> None:
    text = WORKFLOW.read_text()
    assert "CJ-Access-Token" in text
    assert "Bearer {{ $env.CJ_API_KEY }}" not in text


def test_workflow_medusa_fulfillment_sends_items_and_labels() -> None:
    wf = _workflow()
    node = next(n for n in wf["nodes"] if n["name"] == "Medusa mark fulfilled")
    body = node["parameters"]["jsonBody"]
    assert "/admin/orders/" in node["parameters"]["url"]
    assert "fulfillments" in node["parameters"]["url"]
    assert "items" in body and "labels" in body and "tracking_number" in body


def test_workflow_secrets_are_env_placeholders_only() -> None:
    text = WORKFLOW.read_text()
    assert "sk-" not in text and "pk_" not in text
    for secret in ("WEBHOOK_SECRET", "CJ_API_KEY", "MEDUSA_ADMIN_TOKEN"):
        assert f"$env.{secret}" in text, f"missing env placeholder {secret}"


def test_workflow_setup_sticky_cites_doc_urls() -> None:
    wf = _workflow()
    sticky = next(n for n in wf["nodes"] if n["name"].startswith("SETUP"))
    content = sticky["parameters"]["content"]
    for url in ("developers.cjdropshipping.com",
                "developers.cjdropshipping.cn",
                "docs.medusajs.com"):
        assert url in content, f"SETUP sticky missing citation domain: {url}"


def test_workflow_is_inactive_by_default() -> None:
    assert _workflow()["active"] is False



# --- 8. Outcome-aware dedupe (F3 / F-A1-4) ---

def test_failed_order_may_retry() -> None:
    store = DedupeStore()
    assert store.begin("ord_1") is False  # allowed to run
    store.mark("ord_1", "failed")
    assert store.begin("ord_1") is False  # legitimate retry allowed


def test_succeeded_order_blocks_redelivery() -> None:
    store = DedupeStore()
    store.begin("ord_1")
    store.mark("ord_1", "succeeded")
    assert store.begin("ord_1") is True  # duplicate: blocked


def test_inflight_order_blocks_concurrent_redelivery() -> None:
    store = DedupeStore()
    assert store.begin("ord_1") is False
    assert store.begin("ord_1") is True  # still in flight: blocked


def test_backordered_order_may_retry() -> None:
    store = DedupeStore()
    store.begin("ord_1")
    store.mark("ord_1", "backordered")
    assert store.begin("ord_1") is False  # stock may have returned


def test_unknown_order_id_never_recorded() -> None:
    assert should_record_order_id("") is False
    assert should_record_order_id("unknown") is False
    assert should_record_order_id("ord_1") is True
    store = DedupeStore()
    assert store.begin("") is True  # rejected, not recorded
    assert store.contains("") is False


def test_dedupe_cap_prunes_nonsucceeded_first() -> None:
    store = DedupeStore(cap=2)
    store.begin("a")
    store.mark("a", "succeeded")
    store.begin("b")  # in flight
    store.begin("c")  # over cap: prune 'b' (non-succeeded) before 'a'
    assert store.contains("a") is True
    assert store.contains("b") is False
    assert store.contains("c") is True


# --- 9. Stock: SKU path + keyed matching (F1 / F5) ---

def test_no_metadata_line_uses_query_by_sku() -> None:
    assert stock_lookup_path({"sku": "SKU-1", "cj_variant_id": ""}) == (
        "queryBySku", "SKU-1")
    assert stock_lookup_path({"sku": "SKU-1"}) == ("queryBySku", "SKU-1")
    assert stock_lookup_path({"sku": "SKU-1", "cj_variant_id": "VID-9"}) == (
        "queryByVid", "VID-9")


def test_evaluate_stock_keyed_matches_by_paired_index_not_order() -> None:
    lines = [{"sku": "A", "qty": 1, "cj_variant_id": ""},
             {"sku": "B", "qty": 2, "cj_variant_id": ""}]
    # Results arrive in reverse order; pairing index still routes them.
    results = [{"paired_index": 1, "result": True, "code": 200,
                "data": {"totalInventoryNum": 1}},
               {"paired_index": 0, "result": True, "code": 200,
                "data": {"totalInventoryNum": 10}}]
    out = evaluate_stock_keyed(lines, results)
    assert out["all_in_stock"] is False
    assert out["shortages"] == ["B"]
    assert out["count_mismatch"] is False


def test_evaluate_stock_keyed_vid_echo_mismatch_is_shortage() -> None:
    lines = [{"sku": "A", "qty": 1, "cj_variant_id": "VID-1"}]
    results = [{"paired_index": 0, "result": True, "code": 200,
                "data": {"vid": "VID-2", "totalInventoryNum": 99}}]
    out = evaluate_stock_keyed(lines, results)
    assert out["all_in_stock"] is False
    assert out["shortages"] == ["A"]
    assert out["stock_match_mismatch"] is True


def test_evaluate_stock_keyed_error_envelope_is_shortage() -> None:
    lines = [{"sku": "A", "qty": 1, "cj_variant_id": ""}]
    results = [{"paired_index": 0, "result": False, "code": 1600001,
                "data": None, "message": "token expired"}]
    out = evaluate_stock_keyed(lines, results)
    assert out["all_in_stock"] is False
    assert out["shortages"] == ["A"]


def test_evaluate_stock_keyed_count_mismatch_shortages_all() -> None:
    lines = [{"sku": "A", "qty": 1, "cj_variant_id": ""},
             {"sku": "B", "qty": 1, "cj_variant_id": ""}]
    results = [{"paired_index": 0, "result": True, "code": 200,
                "data": {"totalInventoryNum": 10}}]
    out = evaluate_stock_keyed(lines, results)
    assert out["all_in_stock"] is False
    assert out["count_mismatch"] is True
    assert out["shortages"] == ["A", "B"]


def test_parse_cj_stock_rejects_bool_and_accepts_float() -> None:
    raw_bool = {"code": 200, "result": True,
                "data": {"totalInventoryNum": True}}
    assert parse_cj_stock(raw_bool) is None  # bool is not inventory
    raw_float = {"code": 200, "result": True,
                 "data": {"totalInventoryNum": 4.0}}
    assert parse_cj_stock(raw_float) == 4
    raw_str = {"code": 200, "result": True,
               "data": {"totalInventoryNum": "4"}}
    assert parse_cj_stock(raw_str) is None


def test_empty_items_never_route_to_po() -> None:
    assert route_stock([], {})["all_in_stock"] is False
    assert evaluate_stock([])["all_in_stock"] is False


# --- 10. PO / payment / token (F2 / F3 / F5) ---

def test_parse_cj_create_duplicate_order_code_exist() -> None:
    raw = {"code": 1600301, "result": False,
           "message": "ORDER_CODE_EXIST: order number already exists",
           "data": None}
    parsed = parse_cj_create_order(raw)
    assert parsed["ok"] is False
    assert parsed["po_status"] == "duplicate"


def test_parse_cj_create_ok_requires_result_and_code() -> None:
    raw = {"code": 500, "result": True,
           "data": {"orderId": "CJ-1", "shipmentOrderId": "SHIP-1"}}
    parsed = parse_cj_create_order(raw)
    assert parsed["ok"] is False
    assert parsed["po_status"] == "failed"


def test_parse_cj_pay_requires_result_and_code() -> None:
    assert parse_cj_pay({"code": 200, "result": True, "data": "ord_1"}) is True
    assert parse_cj_pay({"code": 200, "result": False, "data": None}) is False
    assert parse_cj_pay({"code": 500, "result": True, "data": None}) is False


def test_parse_cj_token_rejects_error_envelope() -> None:
    assert parse_cj_token({"code": 200, "result": True,
                           "data": {"accessToken": "tok-1"}}) == "tok-1"
    assert parse_cj_token({"code": 1600001, "result": False,
                           "data": None}) == ""
    assert parse_cj_token({"code": 200, "result": True,
                           "data": {"accessToken": ""}}) == ""


def test_build_cj_order_body_paytype_always_create_only() -> None:
    body = build_cj_order_body(
        {"order_id": "ord_1", "email": "a@b.c", "customer_name": "Ann",
         "shipping_address": {"country_code": "US", "province": "CA",
                              "city": "LA", "address_1": "1 Main St",
                              "postal_code": "90001"},
         "items": [{"sku": "SKU-1", "qty": 1, "item_id": "li_1"}]},
        logistic_name="CJPacket", from_country_code="CN")
    assert body["payType"] == 3  # create-only; payment is payBalanceV2


def test_build_cj_order_body_vid_when_known_sku_when_not() -> None:
    body = build_cj_order_body(
        {"order_id": "ord_1", "email": "a@b.c", "customer_name": "Ann",
         "shipping_address": {"country_code": "US", "province": "CA",
                              "city": "LA", "address_1": "1 Main St"},
         "items": [{"sku": "SKU-1", "qty": 1, "item_id": "li_1",
                    "cj_variant_id": "VID-9"},
                   {"sku": "SKU-2", "qty": 2, "item_id": "li_2"}]},
        logistic_name="CJPacket", from_country_code="CN")
    assert body["products"][0]["vid"] == "VID-9"
    assert "vid" not in body["products"][1]
    assert body["products"][1]["sku"] == "SKU-2"


def test_build_cj_order_body_shipping_country_prefers_name() -> None:
    base = {"order_id": "ord_1", "email": "a@b.c", "customer_name": "Ann",
            "shipping_address": {"country_code": "US", "province": "CA",
                                 "city": "LA", "address_1": "1 Main St"},
            "items": [{"sku": "SKU-1", "qty": 1, "item_id": "li_1"}]}
    assert build_cj_order_body(
        base, logistic_name="CJPacket",
        from_country_code="CN")["shippingCountry"] == "US"
    named = dict(base)
    named["shipping_address"] = dict(base["shipping_address"],
                                     country="United States")
    assert build_cj_order_body(
        named, logistic_name="CJPacket",
        from_country_code="CN")["shippingCountry"] == "United States"


# --- 11. Tracking envelope (F5) ---

def test_parse_cj_tracking_error_envelope_is_not_present() -> None:
    raw = {"code": 1600001, "result": False, "message": "token expired",
           "data": {"trackNumber": "CJ123"}}
    assert parse_cj_tracking(raw)["tracking_present"] is False


# --- 12. Alert throttles (F-A1-1 / F-A1-4) ---

def test_bad_signature_throttle_first_alerts_then_new_window() -> None:
    throttle = BadSignatureThrottle()
    alert, suppressed_prev = throttle.should_alert(0)
    assert (alert, suppressed_prev) == (True, 0)
    alert, _ = throttle.should_alert(60)
    assert alert is False  # same 15-minute window: suppressed
    alert, suppressed_prev = throttle.should_alert(901)
    assert alert is True
    assert suppressed_prev == 1  # prior window's suppressed count surfaces


def test_duplicate_alert_first_only_per_order() -> None:
    throttle = DuplicateAlertThrottle()
    assert throttle.should_alert("ord_1") is True
    assert throttle.should_alert("ord_1") is False
    assert throttle.should_alert("ord_2") is True
    assert throttle.suppressed_count("ord_1") == 1


# --- 13. Sync digest: truncation + backorder re-check (F7 / F8) ---

def test_digest_flags_truncation() -> None:
    out = build_digest({"content": [], "totalRecords": 250,
                        "pageSize": 100, "pageNumber": 1}, backorders=[])
    assert out["truncated"] is True
    assert out["total_records"] == 250
    out2 = build_digest({"content": [], "totalRecords": 40,
                         "pageSize": 100, "pageNumber": 1}, backorders=[])
    assert out2["truncated"] is False


def test_digest_backorder_ready_when_stock_returns() -> None:
    backorders = [{"order_id": "ord_1",
                   "shortages": [{"sku": "SKU-9", "qty": 2}]}]
    pulled = [{"sku": "SKU-9", "warehouseInventoryNum": 5}]
    out = build_digest({"content": [{"productList": pulled}],
                        "totalRecords": 1, "pageSize": 100,
                        "pageNumber": 1}, backorders=backorders)
    assert out["backorder_ready"] == ["ord_1"]
    assert out["backorders_pending"] == ["ord_1"]
    pulled_short = [{"sku": "SKU-9", "warehouseInventoryNum": 1}]
    out2 = build_digest({"content": [{"productList": pulled_short}],
                         "totalRecords": 1, "pageSize": 100,
                         "pageNumber": 1}, backorders=backorders)
    assert out2["backorder_ready"] == []


# --- 14. Webhook normalization forensics (F-A1-5) ---

def test_normalize_order_missing_id_and_empty_items_flagged() -> None:
    out = normalize_order({"items": []}, {"x-medusa-secret": "s"})
    assert out["missing_order_id"] is True
    assert out["order_id"] == ""
    assert out["items_empty"] is True


def test_normalize_order_source_and_header_presence() -> None:
    out = normalize_order(
        {"id": "ord_1", "items": [{"id": "li_1", "quantity": 1}]},
        {"x-forwarded-for": "203.0.113.7", "x-medusa-secret": "s"})
    assert out["source"] == "203.0.113.7"
    assert out["header_present"] is True
    out2 = normalize_order(
        {"id": "ord_1", "items": [{"id": "li_1", "quantity": 1}]}, {})
    assert out2["header_present"] is False


# --- 15. Workflow JSON structural checks (fixed v2 file itself) ---

def _node(name: str) -> dict:
    wf = _workflow()
    return next(n for n in wf["nodes"] if n["name"] == name)


def _js(name: str) -> str:
    return _node(name)["parameters"]["jsCode"]


def _connections() -> dict:
    return _workflow()["connections"]


def test_workflow_stock_uses_query_by_sku_for_sku_only_lines() -> None:
    text = WORKFLOW.read_text()
    assert "product/stock/queryBySku" in text
    assert "product/stock/queryByVid" in text
    sku_url = _node("CJ stock by sku")["parameters"]["url"]
    assert "queryBySku" in sku_url
    vid_url = _node("CJ stock by vid")["parameters"]["url"]
    assert "queryByVid" in vid_url
    # Old unsound fallback (one URL choosing vid-or-sku) must be gone.
    assert "cj_variant_id || $json.item.sku" not in text


def test_workflow_evaluate_stock_checks_result_code_and_pairing() -> None:
    js = _js("Evaluate stock")
    assert "result" in js and "code" in js
    assert "pairedItem" in js
    assert "totalInventoryNum" in js
    assert "results[idx]" not in js  # no zip-by-index


def test_workflow_po_evaluates_result_code_and_duplicate() -> None:
    js = _js("Evaluate PO")
    assert "ORDER_CODE_EXIST" in js
    assert "result" in js and "code" in js
    text = WORKFLOW.read_text()
    assert "shopping/pay/payBalanceV2" in text
    assert "CJ_PAY_TYPE" not in text  # silent env flip removed


def test_workflow_medusa_uses_api_token_header_not_bearer() -> None:
    node = _node("Medusa mark fulfilled")
    headers = node["parameters"]["headerParameters"]["parameters"]
    names = [h["name"] for h in headers]
    assert "x-medusa-access-token" in names
    assert "Bearer {{ $env.MEDUSA_ADMIN_TOKEN }}" not in WORKFLOW.read_text()
    body = node["parameters"]["jsonBody"]
    assert "items" in body and "labels" in body and "tracking_number" in body


def test_workflow_verify_is_fixed_length_and_forensic() -> None:
    js = _js("Verify + Normalize")
    assert "secret.length" in js
    assert "i < provided.length && i < secret.length" not in js
    assert "x-forwarded-for" in js
    assert "header_present" in js
    alert = _node("Alert: bad signature")["parameters"]["text"]
    assert "order_id" in alert and "source" in alert
    assert "$json.provided" not in alert  # never the presented secret


def test_workflow_dedupe_is_outcome_aware() -> None:
    js = _js("Dedupe check")
    assert "succeeded" in js and "in_flight" in js and "failed" in js
    assert "missing_order_id" in js
    assert "succeeded" in _js("Mark succeeded")


def test_workflow_bad_signature_alert_is_throttled() -> None:
    js = _js("Bad-signature throttle")
    assert "900000" in js  # 15-minute window in ms
    conns = _connections()
    assert conns["Bad-signature throttle"]["main"][0][0]["node"] == \
        "Alert: bad signature"


def test_workflow_payment_path_is_explicit_pay_balance() -> None:
    node = _node("CJ pay balance")
    assert "payBalanceV2" in node["parameters"]["url"]
    assert "payType: 3" in _js("Build CJ order body")


def test_workflow_setup_records_accepted_risks() -> None:
    content = _node("SETUP — read first")["parameters"]["content"]
    lowered = content.lower()
    for required in ("NOT replay protection", "rotation",
                     "private-network", "Data Table", "shippingCountry",
                     "truncated", "Header Auth"):
        assert required.lower() in lowered, f"SETUP missing: {required}"


def test_workflow_token_failure_branches_exist() -> None:
    conns = _connections()
    token_branches = conns["Token ok?"]["main"]
    assert token_branches[1][0]["node"] == "Alert: CJ token failed"


def test_workflow_sync_digest_surfaces_truncation_and_backorders() -> None:
    js = _js("Diff + low-stock digest")
    assert "totalRecords" in js and "truncated" in js
    assert "backorder" in js


def test_workflow_duplicate_branch_alerts_not_silent() -> None:
    conns = _connections()
    assert conns["Duplicate?"]["main"][0][0]["node"] == \
        "Duplicate alert throttle"
    assert conns["Duplicate alert throttle"]["main"][0][0]["node"] == \
        "Alert: duplicate delivery"
if __name__ == "__main__":
    try:
        import pytest

        raise SystemExit(pytest.main([__file__, "-q"]))
    except ImportError:
        # pytest is not installed in this environment; run directly.
        fns = [(n, f) for n, f in sorted(globals().items())
               if n.startswith("test_") and callable(f)]
        failed = []
        for name, fn in fns:
            try:
                fn()
            except Exception as exc:  # noqa: BLE001 - runner reports all
                failed.append((name, repr(exc)))
        print(f"{len(fns) - len(failed)}/{len(fns)} passed; "
              f"failures: {failed}")
        raise SystemExit(1 if failed else 0)


# --- 16. Security re-review residuals R-A1-1 / R-A1-2: surfaced counts + window digest ---

def test_sanitize_alert_value_strips_formatting_and_mentions() -> None:
    from fulfilment_logic import sanitize_alert_value

    crafted = "@channel check #ops <https://evil.example|click> `code` *bold* ~strike~ &amp\nnewline"
    safe = sanitize_alert_value(crafted)
    for dangerous in ("@", "#", "<", ">", "`", "*", "~", "&", "\n"):
        assert dangerous not in safe, f"dangerous char survived: {dangerous!r} in {safe!r}"
    assert "channel" in safe and "ops" in safe  # text kept, markup stripped
    assert len(sanitize_alert_value("x" * 200, max_len=80)) == 80  # truncated


def test_bad_signature_throttle_counts_per_key_and_missing() -> None:
    from fulfilment_logic import BadSignatureThrottle

    throttle = BadSignatureThrottle()
    assert throttle.should_alert(0, "ord_a") == (True, 0)
    assert throttle.should_alert(60, "ord_a") == (False, 0)
    assert throttle.should_alert(120, "ord_b") == (False, 0)
    assert throttle.should_alert(180, "") == (False, 0)  # missing id
    assert throttle.should_alert(240, "unknown") == (False, 0)  # missing id
    assert throttle.should_alert(300, None) == (False, 0)  # missing id
    counts = throttle.current_counts()
    assert counts["total"] == 6
    assert counts["per_key"] == {"ord_a": 2, "ord_b": 1}
    assert counts["missing"] == 3  # distinct missing-id count, not a shared key


def test_bad_signature_window_close_reports_then_resets() -> None:
    from fulfilment_logic import BadSignatureThrottle

    throttle = BadSignatureThrottle()
    throttle.should_alert(0, "ord_a")
    throttle.should_alert(60, "ord_a")
    closed = throttle.close_window()
    assert closed["total"] == 2
    assert closed["per_key"] == {"ord_a": 2}
    assert throttle.current_counts()["total"] == 0  # consumed, not re-reported
    # Next window's first alert no longer re-surfaces the digested count.
    alert, suppressed_prev = throttle.should_alert(901, "ord_a")
    assert (alert, suppressed_prev) == (True, 0)


def test_duplicate_throttle_missing_count_is_distinct_and_rearmed_by_digest() -> None:
    from fulfilment_logic import DuplicateAlertThrottle

    throttle = DuplicateAlertThrottle()
    assert throttle.should_alert("") is True  # first missing alerts
    assert throttle.should_alert("unknown") is False
    assert throttle.should_alert(None) is False
    assert throttle.missing_count() == 3
    # Missing deliveries are NOT keyed under a shared 'missing' order:
    assert "missing" not in throttle.counts()
    report = throttle.window_report()
    assert report["missing"] == 3
    # Digest re-arms: the next missing delivery after a digest alerts again,
    # so a missing-id probe flood can never go invisible forever.
    assert throttle.should_alert("") is True
    assert throttle.missing_count() == 1


def test_duplicate_throttle_window_report_surfaces_suppressed_deltas_once() -> None:
    from fulfilment_logic import DuplicateAlertThrottle

    throttle = DuplicateAlertThrottle()
    assert throttle.should_alert("ord_1") is True
    assert throttle.should_alert("ord_1") is False
    assert throttle.should_alert("ord_1") is False
    report = throttle.window_report()
    assert report["per_order"] == {"ord_1": 2}
    assert report["suppressed_total"] == 2
    # Watermark advanced: a second digest without new duplicates is empty.
    report2 = throttle.window_report()
    assert report2["per_order"] == {}
    assert report2["suppressed_total"] == 0


def test_window_digest_always_emits_even_with_zero_totals() -> None:
    from fulfilment_logic import (
        BadSignatureThrottle,
        DuplicateAlertThrottle,
        build_window_digest,
        format_window_digest_text,
    )

    digest = build_window_digest(BadSignatureThrottle(), DuplicateAlertThrottle())
    assert digest["bad_signature_total"] == 0
    assert digest["duplicate_suppressed_total"] == 0
    assert digest["duplicate_missing_total"] == 0
    assert digest["total_events"] == 0
    text = format_window_digest_text(digest)
    assert "0" in text  # a zero total is a real report, not silence


def test_window_digest_combines_bad_signature_and_duplicate_counts() -> None:
    from fulfilment_logic import (
        BadSignatureThrottle,
        DuplicateAlertThrottle,
        build_window_digest,
    )

    bad = BadSignatureThrottle()
    bad.should_alert(0, "ord_a")
    bad.should_alert(60, "ord_a")
    bad.should_alert(120, "")
    dup = DuplicateAlertThrottle()
    dup.should_alert("ord_9")
    dup.should_alert("ord_9")
    dup.should_alert("")
    digest = build_window_digest(bad, dup)
    assert digest["bad_signature_total"] == 3
    assert digest["bad_signature_per_order"] == {"ord_a": 2}
    assert digest["bad_signature_missing"] == 1
    assert digest["duplicate_suppressed_total"] == 1
    assert digest["duplicate_missing_total"] == 1
    assert digest["total_events"] == 5


def test_bad_signature_alert_text_uses_sanitized_fields() -> None:
    from fulfilment_logic import build_bad_signature_alert_text

    text = build_bad_signature_alert_text(
        "@channel <https://evil.example|click>", "1.2.3.4 @here", False, 2)
    assert "@" not in text and "<" not in text and ">" not in text
    assert "channel" in text  # text kept, markup stripped


# --- 17. R-A1-5: Mark-succeeded comment + sanitized workflow alert texts ---

def test_workflow_mark_succeeded_comment_no_longer_overstates() -> None:
    js = _js("Mark succeeded")
    assert "only here does the order become a dedupe block" not in js
    assert "in_flight" in js  # the claim already blocks at intake
    assert "terminal" in js


def test_workflow_bad_signature_alert_uses_sanitized_fields() -> None:
    alert = _node("Alert: bad signature")["parameters"]["text"]
    assert "order_id_safe" in alert and "source_safe" in alert
    assert "{{ $json.order_id }}" not in alert
    assert "{{ $json.source }}" not in alert
    dup = _node("Alert: duplicate delivery")["parameters"]["text"]
    assert "order_id_safe" in dup


def test_workflow_verify_emits_sanitized_fields() -> None:
    js = _js("Verify + Normalize")
    assert "order_id_safe" in js and "source_safe" in js


# --- 18. R-A1-1/R-A1-2 digest branch + R-A1-3/R-A1-4 SETUP record ---

def test_workflow_has_scheduled_window_digest_branch() -> None:
    node = _node("Bad-signature digest (15m)")
    assert node["type"] == "n8n-nodes-base.scheduleTrigger"
    conns = _connections()
    assert conns["Bad-signature digest (15m)"]["main"][0][0]["node"] == \
        "Build window digest"
    assert conns["Build window digest"]["main"][0][0]["node"] == \
        "Slack: window digest"
    js = _js("Build window digest")
    assert "badSig" in js and "duplicateAlerted" in js
    assert "duplicateMissing" in js
    digest_text = _node("Slack: window digest")["parameters"]["text"]
    assert "bad_signature_total" in digest_text


def test_workflow_setup_records_accepted_risk_completely() -> None:
    content = _node("SETUP — read first")["parameters"]["content"]
    lowered = content.lower()
    for required in ("owner", "sign-off", "review date", "blast radius",
                     "paybalancev2", "reconciliation", "unmatched",
                     "refund", "void"):
        assert required in lowered, f"SETUP missing: {required}"


def test_workflow_setup_activation_checklist_states_controls_not_in_place() -> None:
    content = _node("SETUP — read first")["parameters"]["content"]
    lowered = content.lower()
    for required in ("not in place", "credential id",
                     "bad-signature rejection", "binding"):
        assert required in lowered, f"SETUP missing: {required}"
    # No credential id is invented: no node carries a credentials key
    # (the word "credentials" in SETUP prose is not a configured key).
    wf = _workflow()
    assert not any("credentials" in n for n in wf["nodes"])
    assert wf["active"] is False  # stays inactive until evidenced
