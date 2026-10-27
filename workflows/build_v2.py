"""Build 3rd-eye-order-to-fulfilment-v2.json (fixed per review, #112/#113).

Doc-grounded replacements only; no live calls. Run:
    python3 build_v2.py
Writes ./3rd-eye-order-to-fulfilment-v2.json and validates that every
connection target exists, no TODO placeholder survives, the silent
payType env flip is gone, and Medusa auth uses the API-token header.

Fixes over the builder v2 (see SETUP sticky in the workflow itself):
- F1: stock by vid only when a CJ variant id is known; otherwise the
  documented queryBySku path (never a SKU passed as vid).
- F2: ONE payment path — create-only (payType 3) + explicit
  payBalanceV2, then a tracking re-check. No payType env variable.
- F3/F-A1-4: outcome-aware dedupe (terminal states block, failed /
  backordered allow retry, missing id never recorded); ORDER_CODE_EXIST
  means "already exists — look it up", not a generic failure.
- F4: Medusa fulfilment via x-medusa-access-token (secret API key for
  server-to-server; Bearer is reserved for JWT sessions), with the
  live-confirmation gate against the deployed 2.21.2 instance recorded
  in SETUP, not claimed.
- F5: stock/PO checks require result + code; stock matching uses n8n
  engine pairing (pairedItem) + vid-echo cross-check + count guard,
  never zip-by-index; token-empty branches alert and stop.
- F-A1-1: private-network-only reachability (activation gate) +
  15-minute bad-signature alert throttling.
- F-A1-2: replay risk ACCEPTED in writing (shared secret is replayable;
  dedupe is NOT replay protection) + rotation plan.
- F-A1-3: fixed-length secret compare (always secret.length
  iterations), mirrored exactly in the harness.
- F-A1-5: bad-signature alert carries order_id, source, missing-vs-
  wrong — never the presented secret.
- F7/F8: bool/float stock handling, empty-order branch, token 401
  branch, sync truncation surfaced, shippingCountry name-preferred,
  backorders re-checked by the 6h digest.
- R-A1-1/R-A1-2 (security re-review): per-order + distinct missing-id
  counts for bad signatures and duplicates, and a scheduled 15-minute
  window-close digest that ALWAYS reports the closed window's total
  (even zero) — counts are consumed by the digest, never double-counted.
- R-A1-3: SETUP accepted-risk record completed with owner (UNASSIGNED,
  not invented) + sign-off (PENDING) + review rule, blast radius
  (create-order + payBalanceV2 = money out), valid-secret replay
  detection (CJ/Medusa reconciliation, unmatched CJ orders), and a
  compromise audit/reconcile step (refund/void unmatched).
- R-A1-4: SETUP activation evidence checklist stating plainly that
  private-network binding + Header Auth are NOT IN PLACE (no
  credential id invented; workflow stays inactive).
- R-A1-5: Mark-succeeded comment corrected (in_flight already blocks);
  bad-signature / duplicate / empty-order Slack texts interpolate
  sanitized _safe fields only.
"""

from __future__ import annotations

import json
from pathlib import Path

HERE = Path(__file__).resolve().parent
OUT = HERE / "3rd-eye-order-to-fulfilment-v2.json"

CJ = "{{ $env.CJ_API_BASE }}"  # base = https://developers.cjdropshipping.com/api2.0/v1


def code_node(nid: str, name: str, js: str, x: int, y: int) -> dict:
    return {"id": nid, "name": name,
            "parameters": {"jsCode": js, "mode": "runOnceForAllItems"},
            "position": [x, y], "type": "n8n-nodes-base.code", "typeVersion": 3}


def if_node(nid: str, name: str, left: str, x: int, y: int) -> dict:
    return {"id": nid, "name": name,
            "parameters": {"conditions": [
                {"id": "c1", "leftValue": left,
                 "operator": {"name": "filter.operator.boolean.true",
                              "operation": "true", "type": "boolean"},
                 "rightValue": True}],
                "options": {"caseSensitive": True, "leftValue": "",
                            "typeValidation": "loose", "version": 2}},
            "position": [x, y], "type": "n8n-nodes-base.if", "typeVersion": 2.2}


def slack_node(nid: str, name: str, text: str, x: int, y: int) -> dict:
    return {"id": nid, "name": name,
            "parameters": {"channel": "#ops", "operation": "post",
                           "resource": "message", "text": text},
            "position": [x, y], "type": "n8n-nodes-base.slack", "typeVersion": 2.3}


def http_node(nid: str, name: str, method: str, url: str, x: int, y: int,
              headers: list[dict] | None = None, body: str | None = None) -> dict:
    params: dict = {"authentication": "none", "method": method, "url": url}
    if headers:
        params["headerParameters"] = {"parameters": headers}
        params["sendHeaders"] = True
    if body is not None:
        params["jsonBody"] = body
        params["sendBody"] = True
        params["specifyBody"] = "json"
    return {"id": nid, "name": name, "parameters": params,
            "position": [x, y], "type": "n8n-nodes-base.httpRequest",
            "typeVersion": 4.2}


CJ_TOKEN_HEADER = {"name": "CJ-Access-Token",
                   "value": "= {{ $('CJ token').first().json.token }}"}
CJ_TOKEN_HEADER_SYNC = {"name": "CJ-Access-Token",
                        "value": "= {{ $('CJ token (sync)').first().json.token }}"}
JSON_HEADER = {"name": "Content-Type", "value": "application/json"}
MEDUSA_TOKEN_HEADER = {"name": "x-medusa-access-token",
                       "value": "= {{ $env.MEDUSA_ADMIN_TOKEN }}"}

VERIFY_JS = """// Shared-secret check, FIXED-LENGTH loop (F-A1-3): the loop always runs
// secret.length iterations, padding a short provided value with 0, so the
// iteration count cannot leak the provided length. No Node crypto is used:
// crypto would need NODE_FUNCTION_ALLOW_BUILTIN=crypto on the instance,
// which is not guaranteed. Empty secret fails closed.
// NOTE (F6, honest flag): this is a shared-secret header agreed with
// Medusa (x-medusa-secret = WEBHOOK_SECRET), NOT an HMAC/body signature.
// Medusa does not send an HMAC-signed webhook for this flow, so no HMAC
// scheme is invented here. See SETUP for the accepted replay risk.
// R-A1-5: order_id_safe / source_safe are the ONLY alert-safe forms of
// the attacker-controlled order id and x-forwarded-for values — Slack
// texts must interpolate the _safe fields, never the raw fields.
// Sanitize strips Slack formatting/mention characters (@ # < > ` * ~ &)
// and control characters, then truncates; legit id chars (-, _) survive.
const sanitize = (v, max) => String(v == null ? '' : v)
  .replace(/[@#<>`*~&\\r\\n\\t\\x00-\\x1F\\x7F]/g, '').slice(0, max);
const headers = $input.first().json.headers || {};
const body = $input.first().json.body || {};
const secret = $env.WEBHOOK_SECRET || '';
const provided = headers['x-medusa-secret'] || '';
const header_present = provided !== '';
let diff = (provided.length === secret.length) ? 0 : 1;
for (let i = 0; i < secret.length; i++) {
  const p = (i < provided.length) ? provided.charCodeAt(i) : 0;
  diff |= (p ^ secret.charCodeAt(i));
}
const valid = diff === 0 && secret.length > 0;
const addr = body.shipping_address || {};
const rawItems = body.items || [];
const items = rawItems.map((i) => ({
  item_id: i.id || '',
  sku: i.variant_sku || (i.variant && i.variant.sku) || i.title || 'unknown',
  cj_variant_id: (i.metadata && i.metadata.cj_variant_id) || '',
  qty: (typeof i.quantity === 'number' && i.quantity > 0) ? i.quantity : 1,
}));
const first = addr.first_name || '';
const last = addr.last_name || '';
const order_id = body.id || body.display_id || '';
const source = headers['x-forwarded-for'] || headers['x-real-ip'] || '';
return [{ json: {
  valid, header_present,
  order_id, missing_order_id: (order_id === ''),
  order_id_safe: sanitize(order_id, 80),
  source_safe: sanitize(source, 64),
  items_empty: items.length === 0,
  email: (body.customer && body.customer.email) || body.email || '',
  customer_name: ((first + ' ' + last).trim()) || '',
  items,
  shipping_address: addr,
  source,
} }];"""

BAD_SIG_THROTTLE_JS = """// F-A1-1 + R-A1-1/R-A1-2: one bad-signature Slack alert per 15-minute
// window. Repeats in the same window are suppressed and counted; the
// count surfaces as suppressed_prev on the next window's first alert
// AND in the scheduled window-close digest (Build window digest), which
// consumes the window — a digested count is never reported twice.
// Counts are per order id (perKey) plus a DISTINCT missing-id count:
// missing-id deliveries are never collapsed under one shared key.
// R-A1-5: the alert carries order_id_safe / source_safe only (same
// sanitize as Verify: formatting/mention chars stripped, truncated).
const sanitize = (v, max) => String(v == null ? '' : v)
  .replace(/[@#<>`*~&\\r\\n\\t\\x00-\\x1F\\x7F]/g, '').slice(0, max);
const staticData = $getWorkflowStaticData('global');
staticData.badSig = staticData.badSig || { bucket: -1, count: 0, alerted: false, perKey: {}, missing: 0 };
const bucket = Math.floor(Date.now() / 900000);
const orderId = $json.order_id || '';
const missing = (!orderId || orderId === 'unknown');
const safe = { order_id_safe: sanitize(orderId, 80), source_safe: sanitize($json.source || '', 64) };
if (bucket !== staticData.badSig.bucket) {
  const suppressed_prev = staticData.badSig.alerted ? (staticData.badSig.count - 1) : 0;
  staticData.badSig = { bucket, count: 1, alerted: true,
    perKey: missing ? {} : { [orderId]: 1 }, missing: missing ? 1 : 0 };
  return [{ json: { ...$json, ...safe, suppressed_prev } }];
}
staticData.badSig.count += 1;
if (missing) { staticData.badSig.missing += 1; }
else { staticData.badSig.perKey[orderId] = (staticData.badSig.perKey[orderId] || 0) + 1; }
return [];"""

WINDOW_DIGEST_JS = """// R-A1-1/R-A1-2: scheduled window-close digest, fired every 15 minutes
// by the Bad-signature digest (15m) Schedule Trigger. ALWAYS returns
// one item — even with all-zero totals — so every window's total is
// reported without waiting for another bad signature. Consumes the
// bad-signature window (badSig reset) and advances the duplicate
// watermark, so no count is ever reported twice. Missing-id duplicate
// deliveries are reported as duplicate_missing_total and re-armed
// (duplicateMissingAlerted reset), so they can never go invisible
// after one alert. Per-order keys in the Slack text are sanitized
// (formatting/mention chars stripped) before joining.
const sanitize = (v, max) => String(v == null ? '' : v)
  .replace(/[@#<>`*~&\\r\\n\\t\\x00-\\x1F\\x7F]/g, '').slice(0, max);
const sd = $getWorkflowStaticData('global');
const bad = sd.badSig || { bucket: -1, count: 0, perKey: {}, missing: 0 };
sd.duplicateAlerted = sd.duplicateAlerted || {};
sd.duplicateDigestWatermark = sd.duplicateDigestWatermark || {};
sd.duplicateMissing = sd.duplicateMissing || 0;
const dupPerOrder = {};
let dupSuppressed = 0;
Object.entries(sd.duplicateAlerted).forEach(([orderId, count]) => {
  const suppressed = count - 1;
  const delta = suppressed - (sd.duplicateDigestWatermark[orderId] || 0);
  if (delta > 0) dupPerOrder[orderId] = delta;
  sd.duplicateDigestWatermark[orderId] = suppressed;
});
Object.values(dupPerOrder).forEach((n) => { dupSuppressed += n; });
const dupMissing = sd.duplicateMissing;
const report = {
  window_bucket: (bad.bucket != null && bad.bucket >= 0) ? bad.bucket : 'none',
  bad_signature_total: bad.count || 0,
  bad_signature_per_order: bad.perKey || {},
  bad_signature_missing: bad.missing || 0,
  bad_signature_per_order_safe: Object.entries(bad.perKey || {})
    .map(([k, v]) => sanitize(k, 80) + ':' + v),
  duplicate_suppressed_total: dupSuppressed,
  duplicate_suppressed_per_order: dupPerOrder,
  duplicate_suppressed_per_order_safe: Object.entries(dupPerOrder)
    .map(([k, v]) => sanitize(k, 80) + ':' + v),
  duplicate_missing_total: dupMissing,
  total_events: (bad.count || 0) + dupSuppressed + dupMissing,
};
// Consume: the next window starts clean; missing duplicates re-arm.
sd.badSig = { bucket: -1, count: 0, alerted: false, perKey: {}, missing: 0 };
sd.duplicateMissing = 0;
sd.duplicateMissingAlerted = false;
return [{ json: report }];"""

DEDUPE_JS = """// F3 / F-A1-4: OUTCOME-AWARE dedupe. States: in_flight (claimed at
// start, NOT terminal), succeeded, needs_lookup, payment_failed,
// awaiting_tracking (block a webhook redelivery), failed, backordered
// (ALLOW a legitimate retry). A missing order id is NEVER recorded:
// it returns duplicate=true with reason missing_order_id, which routes
// to the duplicate alert and stops — never to a CJ call, never to the
// shared 'unknown' key. Cap 5000, transient states pruned first, FIFO.
// Static data survives restarts in n8n's DB but is LOST on workflow
// re-import/deletion — see SETUP for the Data Table activation step.
// Dedupe is NOT replay protection (see SETUP, F-A1-2).
const staticData = $getWorkflowStaticData('global');
staticData.orders = staticData.orders || {};
const orderId = $json.order_id;
if (!orderId || orderId === 'unknown' || $json.missing_order_id) {
  return [{ json: { ...$json, duplicate: true, duplicate_reason: 'missing_order_id' } }];
}
const state = staticData.orders[orderId] ? staticData.orders[orderId].state : '';
const blocking = ['in_flight', 'succeeded', 'needs_lookup', 'payment_failed', 'awaiting_tracking'];
if (blocking.includes(state)) {
  return [{ json: { ...$json, duplicate: true, duplicate_reason: state } }];
}
// failed / backordered / absent: allowed to run; claim as in_flight.
staticData.orders[orderId] = { state: 'in_flight', at: new Date().toISOString() };
const PROTECTED = ['succeeded', 'needs_lookup', 'payment_failed', 'awaiting_tracking'];
let keys = Object.keys(staticData.orders);
while (keys.length > 5000) {
  const victim = keys.find((k) => !PROTECTED.includes(staticData.orders[k].state)) || keys[0];
  delete staticData.orders[victim];
  keys = keys.filter((k) => k !== victim);
}
return [{ json: { ...$json, duplicate: false, duplicate_reason: '' } }];"""

DUP_THROTTLE_JS = """// F-A1-4 + R-A1-1: the FIRST duplicate for an order_id alerts; repeats
// increment a counter in static data instead of firing another Slack
// message. That is aggregation after an alert, not a silent drop — the
// first duplicate was alerted, and the counts surface in the scheduled
// window-close digest (Build window digest). Missing-id deliveries are
// NEVER keyed under a shared 'missing' order: they increment the
// distinct duplicateMissing counter, alert on the first missing
// delivery, and the digest re-arms that alert — so a missing-id probe
// flood surfaces every window instead of going invisible after one.
// R-A1-5: the alert carries order_id_safe only.
const sanitize = (v, max) => String(v == null ? '' : v)
  .replace(/[@#<>`*~&\\r\\n\\t\\x00-\\x1F\\x7F]/g, '').slice(0, max);
const staticData = $getWorkflowStaticData('global');
staticData.duplicateAlerted = staticData.duplicateAlerted || {};
staticData.duplicateMissing = staticData.duplicateMissing || 0;
staticData.duplicateMissingAlerted = staticData.duplicateMissingAlerted || false;
const orderId = $json.order_id || '';
const missing = (!orderId || orderId === 'unknown' || $json.missing_order_id);
const safe = { order_id_safe: sanitize(orderId, 80) };
if (missing) {
  staticData.duplicateMissing += 1;
  if (staticData.duplicateMissingAlerted) return [];
  staticData.duplicateMissingAlerted = true;
  return [{ json: { ...$json, ...safe, duplicate_reason: 'missing_order_id' } }];
}
if (staticData.duplicateAlerted[orderId]) {
  staticData.duplicateAlerted[orderId] += 1;
  return [];
}
staticData.duplicateAlerted[orderId] = 1;
return [{ json: { ...$json, ...safe } }];"""

TOKEN_JS = """// CJ getAccessToken envelope: {code, result, data: {accessToken}}.
// An error envelope (token expired / 401-shaped) yields token '' so the
// Token ok? branch alerts and stops instead of calling CJ with an empty
// header. A bare accessToken without result+code is NOT accepted.
const data = $input.first().json || {};
const ok = data.result === true && data.code === 200;
const token = ok ? ((data.data && data.data.accessToken) || '') : '';
return [{ json: { token, token_ok: token !== '' } }];"""

SPLIT_JS = """// One item per order line, each carrying its own line_key: the CJ
// variant id when known, else the SKU. The stock branch routes on that
// key (queryByVid vs queryBySku); Evaluate stock matches on engine
// pairing + vid echo, never on result order.
const src = $('Dedupe check').first().json;
return (src.items || []).map((item) => ({ json: {
  order_id: src.order_id, email: src.email,
  customer_name: src.customer_name,
  shipping_address: src.shipping_address,
  items: src.items,
  item: { ...item, line_key: item.cj_variant_id || item.sku },
} }));"""

EVALUATE_JS = """// F1 + F5: per-line stock, matched by n8n engine pairing (pairedItem),
// NOT by result order. Each result must also pass result+code; a vid
// result whose data.vid disagrees with the paired line is a shortage and
// sets stock_match_mismatch. A count mismatch shortages EVERY line.
// Unknown/error stock = shortage, never assumed stock. Bool is not a
// number here (typeof true is 'boolean', so it shortages correctly).
// Backorder state is recorded here (decision node) so the 6h digest can
// re-check it (F8) and a later redelivery may retry.
const src = $('Dedupe check').first().json;
const lines = $('Split order lines').all().map((i) => i.json.item);
const results = $input.all();
const shortages = [];
let stock_match_mismatch = false;
let count_mismatch = false;
if (results.length !== lines.length) {
  count_mismatch = true;
  lines.forEach((item) => shortages.push(item.sku));
} else {
  const byPaired = {};
  results.forEach((r) => {
    const idx = (r.pairedItem && typeof r.pairedItem.item === 'number') ? r.pairedItem.item : null;
    if (idx !== null) byPaired[idx] = r.json;
  });
  lines.forEach((item, idx) => {
    const res = byPaired[idx] || null;
    if (!res || res.result !== true || res.code !== 200) { shortages.push(item.sku); return; }
    const data = res.data || {};
    if (item.cj_variant_id && data.vid && String(data.vid) !== String(item.cj_variant_id)) {
      shortages.push(item.sku); stock_match_mismatch = true; return;
    }
    const avail = data.totalInventoryNum;
    if (typeof avail !== 'number' || avail < item.qty) shortages.push(item.sku);
  });
}
if (shortages.length > 0 && src.order_id && src.order_id !== 'unknown') {
  const sd = $getWorkflowStaticData('global');
  sd.orders = sd.orders || {};
  sd.orders[src.order_id] = { state: 'backordered', at: new Date().toISOString(),
    shortages: lines.filter((l) => shortages.includes(l.sku)).map((l) => ({ sku: l.sku, qty: l.qty })) };
}
return [{ json: {
  order_id: src.order_id, email: src.email,
  customer_name: src.customer_name,
  shipping_address: src.shipping_address,
  items: src.items, all_in_stock: shortages.length === 0, shortages,
  stock_match_mismatch, count_mismatch,
} }];"""

BUILD_BODY_JS = """// F2 + F7: the createOrderV3 body, built in one place. payType is FIXED
// at 3 (create-only) — there is no payType env to flip, silently or
// otherwise; payment is the separate explicit payBalanceV2 step.
// shippingCountry prefers a country NAME when Medusa supplies one
// (shipping_address.country); it falls back to the country CODE, which
// CJ requires as a separate field — that fallback is a recorded known
// limit (SETUP), not a claim that code == name. Products carry vid when
// a CJ variant id is known, else sku (CJ: vid/sku cannot both be null;
// sku looks the variant up when vid is missing).
const src = $('Evaluate stock').first().json;
const addr = src.shipping_address || {};
const code = (addr.country_code || '').toUpperCase();
const products = (src.items || []).map((i) => {
  const p = { sku: i.sku,
    quantity: (typeof i.qty === 'number' && i.qty > 0) ? i.qty : 1,
    storeLineItemId: i.item_id };
  if (i.cj_variant_id) p.vid = i.cj_variant_id;
  return p;
});
return [{ json: { body: {
  orderNumber: src.order_id,
  shippingZip: addr.postal_code || '',
  shippingCountryCode: code,
  shippingCountry: addr.country || code,
  shippingProvince: addr.province || '',
  shippingCity: addr.city || '',
  shippingCustomerName: src.customer_name || '',
  shippingAddress: addr.address_1 || '',
  shippingAddress2: addr.address_2 || '',
  shippingPhone: addr.phone || '',
  email: src.email,
  logisticName: $env.CJ_LOGISTIC_NAME,
  fromCountryCode: $env.CJ_FROM_COUNTRY_CODE,
  payType: 3,
  products,
} } }];"""

EVALUATE_PO_JS = """// F3 + F5: PO outcome requires result AND code==200. A message naming
// ORDER_CODE_EXIST means the CJ order ALREADY EXISTS: set state
// needs_lookup (blocks a re-PO redelivery) and route to the lookup
// alert — never to the generic dead-letter path. A plain failure keeps
// the dead-letter path, which records state failed (retry allowed).
const res = $input.first().json || {};
const msg = res.message || '';
const duplicate = /ORDER_CODE_EXIST/i.test(msg);
const ok = res.result === true && res.code === 200;
const data = res.data || {};
const prev = $('Evaluate stock').first().json;
if (duplicate && prev.order_id) {
  const sd = $getWorkflowStaticData('global');
  sd.orders = sd.orders || {};
  sd.orders[prev.order_id] = { state: 'needs_lookup', at: new Date().toISOString() };
}
return [{ json: { ...prev,
  po_ok: ok, po_duplicate: duplicate,
  po_status: ok ? 'ok' : (duplicate ? 'duplicate' : 'failed'),
  cj_order_id: ok ? (data.orderId || '') : '',
  shipment_order_id: ok ? (data.shipmentOrderId || '') : '',
  po_code: res.code, po_message: msg,
} }];"""

DEADLETTER_JS = """// Exactly one dead-letter entry per order_id; a second failure for the
// same order re-alerts but does not duplicate the entry. State failed
// deliberately ALLOWS a manual webhook retry (F-A1-4: the old text told
// ops to retry manually while dedupe silently dropped that retry).
const staticData = $getWorkflowStaticData('global');
staticData.failed = staticData.failed || [];
staticData.orders = staticData.orders || {};
const orderId = $json.order_id;
if (orderId && $json.po_status === 'failed') {
  if (!staticData.failed.some((f) => f.order_id === orderId)) {
    staticData.failed.push({ order_id: orderId, at: new Date().toISOString(),
      reason: 'CJ create order failed' });
  }
  staticData.orders[orderId] = { state: 'failed', at: new Date().toISOString() };
}
return [{ json: $json }];"""

EVALUATE_PAY_JS = """// F2: payBalanceV2 outcome requires result AND code==200. On failure
// the CJ order exists UNPAID: set state payment_failed (blocks a re-PO
// redelivery — the order must be paid by hand in CJ, never re-created)
// and route to the payment-failed alert.
const res = $input.first().json || {};
const ok = res.result === true && res.code === 200;
const prev = $('Evaluate PO').first().json;
if (!ok && prev.order_id) {
  const sd = $getWorkflowStaticData('global');
  sd.orders = sd.orders || {};
  sd.orders[prev.order_id] = { state: 'payment_failed', at: new Date().toISOString() };
}
return [{ json: { ...prev, payment_ok: ok, payment_code: res.code } }];"""

MARK_AWAITING_JS = """// Paid in CJ, tracking not yet present: block redelivery (the order is
// already in CJ — a re-PO would hit ORDER_CODE_EXIST). Retry of a
// failed Medusa-marking step happens from the n8n execution list, not
// by webhook resend.
const sd = $getWorkflowStaticData('global');
sd.orders = sd.orders || {};
if ($json.order_id) sd.orders[$json.order_id] = { state: 'awaiting_tracking', at: new Date().toISOString() };
return [{ json: $json }];"""

CAPTURE_JS = """// getOrderDetail envelope: {code, result, data: {trackNumber,
// trackingProvider, cjOrderId, ...}}. An error envelope yields no
// tracking (never a stale number). trackNumber is empty until SHIPPED,
// so tracking_present gates the shipped email and Medusa fulfillment.
const res = $input.first().json || {};
const data = (res.result === true && res.code === 200) ? (res.data || {}) : {};
const prev = $('Evaluate payment').first().json;
const tracking_number = data.trackNumber || '';
return [{ json: { ...prev,
  tracking_number, tracking_present: tracking_number !== '',
  carrier: data.trackingProvider || '',
  cj_order_id: data.cjOrderId || data.orderId || prev.cj_order_id || '',
} }];"""

MARK_SUCCEEDED_JS = """// Terminal success (R-A1-5 correction): this moves the order's dedupe
// state from the in_flight claim — which ALREADY blocks redelivery at
// intake — to the terminal succeeded block. The terminal state is the
// durable block, not the first block: a redelivery is blocked from the
// moment Dedupe check claims the order, and stays blocked once it
// succeeds. A failed execution before this node leaves the order
// in awaiting_tracking, retried from the execution list.
const sd = $getWorkflowStaticData('global');
sd.orders = sd.orders || {};
if ($json.order_id) sd.orders[$json.order_id] = { state: 'succeeded', at: new Date().toISOString() };
return [{ json: $json }];"""

DIGEST_JS = """// listV2 envelope: {code, result, data: {content: [{productList:
// [...]}], totalRecords, pageSize, pageNumber}}. Dropship filter:
// digest ONLY. CJ fulfills, so this branch never writes Medusa stock
// levels. F7: truncation is SURFACED (totalRecords beyond page 1 of
// 100), not silently dropped — full paging is a follow-up (SETUP).
// F8: backordered orders are re-checked against the pulled catalogue;
// backorder_ready lists orders whose shortage SKUs are all back in
// stock at the needed quantities, and backorders_pending lists every
// backordered order for a manual re-check of the rest.
const data = ($input.first().json.data) || {};
const content = data.content || [];
const products = [];
content.forEach((c) => (c.productList || []).forEach((p) => products.push(p)));
const low = products
  .filter((p) => (typeof p.warehouseInventoryNum !== 'number' ? 0 : p.warehouseInventoryNum) < 5)
  .map((p) => ({ sku: p.sku || '', name: p.nameEn || '',
    inventory: p.warehouseInventoryNum || 0 }));
const totalRecords = data.totalRecords || 0;
const pageSize = data.pageSize || 100;
const pageNumber = data.pageNumber || 1;
const truncated = totalRecords > pageSize * pageNumber;
const sd = $getWorkflowStaticData('global');
sd.orders = sd.orders || {};
const backorders = Object.entries(sd.orders)
  .filter(([, v]) => v.state === 'backordered')
  .map(([order_id, v]) => ({ order_id, shortages: v.shortages || [] }));
const backorder_ready = backorders
  .filter((o) => o.shortages.length > 0 && o.shortages.every((s) => {
    const p = products.find((pp) => pp.sku === s.sku);
    return p && typeof p.warehouseInventoryNum === 'number' && p.warehouseInventoryNum >= s.qty;
  }))
  .map((o) => o.order_id);
return [{ json: { low_stock: low, count: low.length,
  at: new Date().toISOString(), totalRecords, truncated,
  backorders_pending: backorders.map((o) => o.order_id), backorder_ready } }];"""

SETUP = """SETUP (do before activating) — v2 FIXED per review (#112 fulfilment,
#113 security). Workflow stays INACTIVE until the reviewer + QA gates
pass AND every activation gate below is done. Nothing here is live.
ENV (placeholders only, never real values): WEBHOOK_SECRET (must match
the secret Medusa sends as x-medusa-secret), CJ_API_BASE =
https://developers.cjdropshipping.com/api2.0/v1, CJ_API_KEY (CJ API key,
exchanged for a token — never sent as Bearer), CJ_LOGISTIC_NAME (from a
CJ freight calculation for the destination), CJ_FROM_COUNTRY_CODE
(shipment origin, two-letter code), MEDUSA_API_BASE, MEDUSA_ADMIN_TOKEN
(a Medusa SECRET API KEY for server-to-server calls, sent as
x-medusa-access-token — see F4; a JWT goes as Bearer and expires, so do
not put a JWT here), SMTP_FROM. REMOVED: the payType env flip (the silent env
variable is gone; payment is the explicit payBalanceV2 step, F2).
ACTIVATION GATES (all must be done; none is claimed as done in JSON):
1. WEBHOOK REACHABILITY (F-A1-1, private-network route): the webhook
URL must be reachable ONLY from Medusa / the private network — this
n8n instance is Tailscale-private by deployment, not by workflow JSON,
so confirm that binding before activation. ALSO set the Order webhook
node Authentication = Header Auth with a header-auth credential for
x-medusa-secret (a credential id cannot be invented in JSON, so it is
NOT configured in this file — attaching it is an activation step, and
the downstream Verify node stays as defence in depth). Bad-signature
alerts are throttled to one per 15-minute window (repeats counted and
surfaced on the next window's alert AND in the scheduled window-close
digest, which ALWAYS reports the closed window's total — even zero —
so a burst ending inside one window is never buried).
2. REPLAY RISK — ACCEPTED IN WRITING (F-A1-2, activation gate): the
shared secret is a plain replayable header, NOT an HMAC/body signature
with a timestamp or nonce. Medusa does not send an HMAC-signed webhook
for this flow, so no HMAC scheme is invented. ACCEPTED RISK: anyone who
captures a valid webhook (secret + body) inside the private network
could replay it. Mitigations: private-network-only reachability (gate
1), the secret is checked before ANY side effect, and terminal-state
dedupe drops a replay after success. Dedupe is NOT replay protection:
a replay before terminal success can still run, and dedupe must never
be described as replay protection. Rotation plan: on suspected
exposure, generate a new WEBHOOK_SECRET, update Medusa's webhook
configuration and the n8n env in the same change, and change the
webhook path (a new path kills the old URL); the old secret is invalid
from the moment the env is saved. Rotate on any exposure suspicion and
at least on operator change.
OWNER / SIGN-OFF / REVIEW DATE (R-A1-3 — the acceptance record):
Owner: UNASSIGNED — activation must name an owner before activation;
no owner is invented here. Sign-off: PENDING — no sign-off is recorded
in this file, so this acceptance is NOT signed until the named owner
signs it. Review date: within 30 days of activation and on any exposure
suspicion (a rule, not a past date — no date is invented here).
BLAST RADIUS, stated plainly (R-A1-3): a pre-success replay runs the
FULL path, including CJ create-order AND payBalanceV2 — that is money
out to CJ for an order Medusa may not have placed twice, plus a Medusa
fulfilment marking for a duplicate shipment. Not just a duplicate
record.
DETECTION for a valid-secret replay (R-A1-3): a replay carrying the
correct secret passes Verify SILENTLY — there is no in-workflow signal
before terminal success. What catches it: (1) after terminal success,
dedupe raises a duplicate alert (throttled, but its counts surface in
every window digest); (2) CJ order reconciliation against Medusa
orders — regularly match CJ orders by orderNumber to Medusa orders and
alert on CJ orders with NO matching Medusa order (unmatched CJ orders
are the replay signal). Before terminal success, reconciliation is the
only detection — run it; do not rely on the duplicate alert alone.
COMPROMISE AUDIT / RECONCILE (R-A1-3, on suspected exposure, WITH
rotation): list every CJ order created during the exposure window,
match each to a Medusa order by orderNumber, and refund/void every
unmatched CJ order (unpaid: void/cancel in CJ; paid: refund via CJ /
Medusa as applicable) before considering the exposure closed.
Rotation alone does not close an exposure.
ACTIVATION EVIDENCE CHECKLIST (R-A1-4): these controls are NOT IN PLACE.
Each item must be completed AND evidenced before activation,
and release must not describe them as in place until then; the
workflow stays INACTIVE until then):
- Private-network binding evidence: record the binding check (what was
  checked, the result, the date, the checker). Workflow JSON cannot
  prove a binding — the Tailscale-private deployment claim must be
  confirmed and written down here.
- Header Auth credential: attach a header-auth credential for
  x-medusa-secret to the Order webhook node and record its credential
  id here. NO credential id exists in this JSON today — the webhook
  node carries no credentials key, verified — and none is invented.
- Bad-signature rejection test: send a delivery with a WRONG secret
  and one with NO secret to the activation test URL, and record both
  rejections (execution shows Verify invalid + bad-signature alert,
  and NO CJ call) before activation.
- Window-close digest firing: confirm the 15-minute digest Schedule
  Trigger actually fires in the n8n UI and posts a window total,
  including a zero-total window. The digest Schedule node follows the
  same interval pattern as the 6h sync Schedule node in this file,
  but offline JSON cannot prove a trigger fires — the firing itself
  is activation evidence, not an assumption.
3. DURABLE DEDUPE (F3): workflow static data is NOT durable across
workflow re-import/deletion and is capped at 5000 (transient states
pruned first). Before scale, replace the Dedupe check / Mark nodes'
static-data store with a Data Table keyed on order_id carrying the
same outcome states (in_flight, succeeded, failed, backordered,
needs_lookup, payment_failed, awaiting_tracking). Until then, the
durable backstop is CJ itself: orderNumber uniqueness + the
ORDER_CODE_EXIST lookup branch (never a silent re-PO, never a
double-ship from a lost dedupe entry alone).
4. MEDUSA LIVE CONFIRMATION (F4, still Hana's activation gate, NOT
claimed here): endpoint POST /admin/orders/:id/fulfillments with body
{items: [{item_id, quantity}], labels: [{tracking_number}]} is cited
from the Medusa JS SDK (sdk.admin.order.createFulfillment, same path in
v2; items is the required body field) and Medusa's auth separation
(API token = x-medusa-access-token for server-to-server, Bearer
reserved for JWT sessions — medusajs.com/blog/new-authentication-
methods). What is NOT yet confirmed against the DEPLOYED 2.21.2
instance (repo apps/backend package.json, read-only): the exact token
type that instance accepts for this route, whether it requires a
location_id for stock-location allocation, AND whether the v2 items
field is `item_id` (as cited from the v1 docs above) or v2's `id` —
the field name is NOT asserted here; it is a gate item to confirm
against the deployed instance before activation. Confirm all three
against the deployed instance before activation; if a location is
required, add a MEDUSA_LOCATION_ID env and send location_id — do not
guess it here.
5. MIXED vid+sku PAIRING LIVE PROOF (B1, live proof requirement
before activation): run a minimal 2-line mixed order — one line
carrying cj_variant_id (vid path) and one sku-only line — through
IF → HTTP → Merge-append in a live n8n run, and observe the actual
pairedItem values on the merged stock results. PASS CRITERION: each
stock result attributes to its own Split-order line — the vid-branch
result to the vid line (also confirmed by the data.vid echo) and the
sku-branch result to the sku line. Count agreement alone is NOT a
pass: counts match even when attribution is wrong. Branch-local
pairing is UNPROVEN offline — n8n's exact pairedItem behavior through
IF → HTTP → Merge-append cannot be verified from JSON — so this
live test is the proof, and mixed orders must not activate until it
passes. If the live test shows a mismatch, the keyed-accumulator
restructure (Loop Over Items batch 1, line_key carried through)
named in the F5 residual note becomes the REQUIRED fix before
activation; do not activate on a failing pairing test.
CITATIONS (endpoint + doc URL + section):
- CJ getAccessToken POST /authentication/getAccessToken, body {apiKey},
  returns data.accessToken (180 days) —
  https://developers.cjdropshipping.com/en/api/api2/api/auth.html §1.1
  Authentication; token mechanism:
  https://developers.cjdropshipping.com/en/api/start/token.html
- CJ calls authenticate with the CJ-Access-Token header (NOT Bearer) —
  https://developers.cjdropshipping.cn/en/api/api2/api/product.html §3
  Inventory error codes (1600002: send a valid token in CJ-Access-Token)
- CJ stock by vid GET /product/stock/queryByVid?vid=… returns
  data.totalInventoryNum and echoes data.vid —
  https://developers.cjdropshipping.cn/en/api/api2/api/product.html §3.1
  Inventory Inquiry
- CJ stock by SKU GET /product/stock/queryBySku?sku=… returns
  data.totalInventoryNum (response does NOT echo the sku — matching
  uses n8n engine pairing, F5) —
  same Product doc §3.2 Query Inventory by SKU
- CJ create order POST /shopping/order/createOrderV3, required:
  orderNumber, shippingCountryCode + shippingCountry (BOTH required),
  shippingProvince, shippingCity, shippingCustomerName,
  shippingAddress, logisticName, fromCountryCode, products [{sku,
  quantity, storeLineItemId}] (vid and sku cannot both be null; sku
  alone resolves the variant when vid is missing), payType 2=balance /
  3=create only, returns data.orderId / orderNumber / shipmentOrderId —
  https://developers.cjdropshipping.cn/en/api/api2/api/shopping.html §1.2
- CJ pay POST /shopping/pay/payBalanceV2, body {shipmentOrderId}
  (default, no orderType = normal dropshipping order) —
  same Shopping doc §7.9 Balance Payment V2 (the workflow's ONLY
  payment step; activating the workflow approves this step — check the
  CJ balance is funded before activation)
- CJ order detail GET /shopping/order/getOrderDetail?orderId=… returns
  data.trackNumber / trackingProvider (empty until SHIPPED) —
  same Shopping doc §1.7 Query Order
- CJ 6h sync GET /product/listV2?page&size returns
  data.content[].productList[] with warehouseInventoryNum, plus
  totalRecords/totalPages; size max 100, page max 1000 —
  same Product doc §1.2 Product List V2 (digest only — CJ fulfills, no
  Medusa stock writes)
- Medusa create fulfillment POST /admin/orders/:id/fulfillments, body
  {items: [{item_id, quantity}], labels: [{tracking_number}]} —
  https://docs.medusajs.com/v1/modules/orders/admin/manage-orders
  (Manage Order Fulfillments) + JS SDK createFulfillment; auth:
  https://medusajs.com/blog/new-authentication-methods (API token via
  x-medusa-access-token; Bearer reserved for JWT).
PAYMENT PATH (F2, the one explicit path): create-only (payType 3) →
payBalanceV2 with the returned shipmentOrderId → tracking re-check
(getOrderDetail) → Medusa fulfilment. No payType env, no auto-charge
at creation, no second payment route. A payBalanceV2 failure leaves
the CJ order UNPAID (state payment_failed): pay it by hand in CJ, never
re-create it.
VID MAPPING (F1, resolved for stock + PO): stock uses cj_variant_id
(Medusa line-item metadata) when present, else queryBySku; PO sends
vid when present, else sku. Populate cj_variant_id on variants for
exact CJ variant matching, but the SKU path is now documented and
tested, not a fallback that errors into a false backorder.
KNOWN LIMITS (recorded, not papered over):
- shippingCountry: CJ requires a country NAME, but Medusa addresses
  carry country_code (and a country name only when the webhook payload
  includes one). The body prefers addr.country and falls back to the
  code — that fallback may be rejected by CJ for some destinations.
  Follow-up: a country-code→name map at the Build node, or a Medusa
  address enrichment, before relying on code-only destinations.
- Sync pagination: listV2 page 1 / size 100 only. Truncation is
  SURFACED in the digest (totalRecords + truncated flag), but a
  catalogue over 100 SKUs is not fully digested. Follow-up: page loop
  through totalPages.
- HTTP-level failures (a CJ/Medusa call returning a non-2xx status, a
  timeout, a DNS failure) use n8n's default Stop Workflow: the
  execution is marked FAILED and visible — it is not silently
  proceeded past. Envelope-level errors (HTTP 200 with result=false)
  ARE handled in Code nodes. Attach an Error Workflow at activation
  so failed executions alert #ops; do not wire an invented
  error-output connection in JSON.
- Webhook auth (F6): x-medusa-secret is an agreed shared secret, NOT
  a Medusa-documented HMAC scheme. It is honestly flagged here and in
  the Verify node; the Header Auth activation gate (gate 1) is the
  node-level control that rejects unauthenticated hits before an
  execution starts.
- Stock pairing residual (F5): the vid branch is cross-checked by the
  data.vid echo, but the sku branch has no response echo, so its match
  rests on n8n's automatic item pairing plus the count guard. Branch-
  local pairing is UNPROVEN offline: nothing in the workflow sets
  pairedItem explicitly on Split outputs and the two branches each
  emit their own index sequence, so under branch-local pairing
  semantics both branches emit pairedItem 0 and the byPaired map can
  collide — a sku-branch result landing on a vid line, or vice versa.
  The vid-echo cross-check does not cover this and the count guard
  does not help. Gate 5 (mixed vid+sku pairing live proof) is the
  required proof before activation. If that live test shows a
  mismatch, the follow-up BECOMES the required fix: a Loop Over Items
  (batch 1) stock check with a keyed accumulator — named here, not
  built now, and not built on the reviewer's 0.75-confidence offline
  theory alone.
OTHER SETUP: connect Slack (#ops) + SMTP credentials; point Medusa
order webhooks at this workflow's production URL; webhook responseMode
is onReceived, so a 200 ack means RECEIVED, not verified or processed
— bad signatures are dropped after the ack and never processed.
Failed executions are retried from the n8n execution list, NOT by
webhook resend, for orders already in CJ (dedupe blocks those
resends by design). Workflow stays INACTIVE until reviewer + QA gates
pass."""

SOURCE = """SOURCE (v2 FIXED per review #112/#113): v1 structure corrected
against public docs, not just transcribed, then fixed again against
the fulfilment + security reviews. Community patterns kept:
order-to-fulfilment in one run (topic 312679: signature check, dedupe,
stock check, PO, tracking, backorder branch, 6h sync), PO/inventory
idempotency + dedupe guards (topic 316681), supplier-API HTTP nodes
with business rules before send + delta-only updates (topic 308744).
Corrections the threads missed: CJ-Access-Token auth (not Bearer API
key), per-variant stock (no batch endpoint) with the documented
queryBySku path for SKU-only lines, tracking gated on getOrderDetail
(createOrder returns no tracking), Medusa fulfillment body {items,
labels} with the API-token header, CJ result+code success envelopes,
ORDER_CODE_EXIST as a lookup branch, and ONE explicit payment path
(create-only + payBalanceV2 + tracking re-check, no env flip).
Dropship filter: CJ fulfills, no inventory held — the 6h branch is a
low-stock + backorder-recheck digest only."""

nodes = [
    {"id": "f01", "name": "Order webhook",
     "parameters": {"httpMethod": "POST", "options": {}, "path": "medusa-order",
                    "responseMode": "onReceived"},
     "position": [240, 360], "type": "n8n-nodes-base.webhook", "typeVersion": 2},
    code_node("f02", "Verify + Normalize", VERIFY_JS, 480, 360),
    if_node("f03", "Signature valid?", "={{ $json.valid }}", 720, 360),
    code_node("f04", "Bad-signature throttle", BAD_SIG_THROTTLE_JS, 720, 640),
    slack_node("f05", "Alert: bad signature",
               "=Bad webhook signature dropped at {{ $now }}. order "
               "{{ $json.order_id_safe }}, source {{ $json.source_safe }}, header "
               "{{ $json.header_present ? 'wrong' : 'missing' }}, suppressed "
               "in prior window: {{ $json.suppressed_prev }}. No order "
               "processed. The presented secret is never logged. "
               "Interpolated values are sanitized (formatting/mention "
               "characters stripped, truncated) by the throttle node.",
               960, 640),
    if_node("f06", "Has items?", "={{ !$json.items_empty }}", 960, 360),
    slack_node("f07", "Alert: empty order",
               "=Empty order dropped: order {{ $json.order_id_safe }} has no line "
               "items. No CJ call made.", 960, 120),
    code_node("f08", "Dedupe check", DEDUPE_JS, 1200, 360),
    if_node("f09", "Duplicate?", "={{ $json.duplicate }}", 1440, 360),
    code_node("f10", "Duplicate alert throttle", DUP_THROTTLE_JS, 1440, 640),
    slack_node("f11", "Alert: duplicate delivery",
               "=Duplicate delivery dropped: order {{ $json.order_id_safe }} "
               "(reason: {{ $json.duplicate_reason }}). Already recorded — "
               "no second CJ order created. Repeats for this order are "
               "counted, not re-alerted; per-order and missing-id counts "
               "surface in the 15-minute window digest.", 1680, 640),
    http_node("f12", "CJ get access token", "POST",
              "= {{ $env.CJ_API_BASE + '/authentication/getAccessToken' }}",
              1680, 360, headers=[JSON_HEADER],
              body="= {{ { apiKey: $env.CJ_API_KEY } }}"),
    code_node("f13", "CJ token", TOKEN_JS, 1920, 360),
    if_node("f14", "Token ok?", "={{ $json.token_ok }}", 2160, 360),
    slack_node("f15", "Alert: CJ token failed",
               "=CJ token failed for order {{ $('Dedupe check').first().json.order_id }}. "
               "No CJ call made; check CJ_API_KEY and retry.", 2160, 640),
    code_node("f16", "Split order lines", SPLIT_JS, 2400, 360),
    if_node("f17", "Has CJ variant id?", "={{ !!$json.item.cj_variant_id }}",
            2640, 360),
    http_node("f18", "CJ stock by vid", "GET",
              "= {{ $env.CJ_API_BASE + '/product/stock/queryByVid?vid=' "
              "+ $json.item.cj_variant_id }}",
              2880, 200, headers=[CJ_TOKEN_HEADER]),
    http_node("f19", "CJ stock by sku", "GET",
              "= {{ $env.CJ_API_BASE + '/product/stock/queryBySku?sku=' "
              "+ $json.item.sku }}",
              2880, 520, headers=[CJ_TOKEN_HEADER]),
    {"id": "f20", "name": "Merge stock results",
     "parameters": {"mode": "append"},
     "position": [3120, 360], "type": "n8n-nodes-base.merge", "typeVersion": 3},
    code_node("f21", "Evaluate stock", EVALUATE_JS, 3360, 360),
    if_node("f22", "All in stock?", "={{ $json.all_in_stock }}", 3600, 360),
    {"id": "f23", "name": "Backorder: email customer",
     "parameters": {"emailType": "text", "fromEmail": "= {{ $env.SMTP_FROM }}",
                    "message": "Hi, thanks for your 3rd Eye order. One of your items "
                    "is on backorder with our supplier — we will ship it as soon "
                    "as it is back in stock and email your tracking then.",
                    "subject": "Your 3rd Eye order is on backorder",
                    "toEmail": "= {{ $('Evaluate stock').first().json.email }}"},
     "position": [3600, 640], "type": "n8n-nodes-base.emailSend", "typeVersion": 2.1},
    slack_node("f24", "Alert: backorder",
               "=Backorder: order {{ $('Evaluate stock').first().json.order_id }}, "
               "shortages: {{ $('Evaluate stock').first().json.shortages.join(', ') }}. "
               "Customer emailed. The 6h digest re-checks this order when stock returns.",
               3840, 640),
    code_node("f25", "Build CJ order body", BUILD_BODY_JS, 3840, 360),
    http_node("f26", "CJ create order", "POST",
              "= {{ $env.CJ_API_BASE + '/shopping/order/createOrderV3' }}",
              4080, 360, headers=[CJ_TOKEN_HEADER, JSON_HEADER],
              body="= {{ $('Build CJ order body').first().json.body }}"),
    code_node("f27", "Evaluate PO", EVALUATE_PO_JS, 4320, 360),
    if_node("f28", "PO ok?", "={{ $json.po_ok }}", 4560, 360),
    if_node("f29", "PO duplicate?", "={{ $json.po_duplicate }}", 4560, 640),
    slack_node("f30", "Alert: PO duplicate",
               "=PO DUPLICATE — already exists, look it up: order {{ $json.order_id }} "
               "already exists in CJ (ORDER_CODE_EXIST). Do NOT re-create it. "
               "Look up the CJ order by orderNumber {{ $json.order_id }}, then "
               "pay/track it by hand if needed. No dead-letter entry made.",
               4800, 640),
    code_node("f31", "Dead-letter PO", DEADLETTER_JS, 4800, 880),
    slack_node("f32", "Alert: PO failed",
               "=PO FAILED for order {{ $json.order_id }} (code {{ $json.po_code }}). "
               "Written to dead-letter list. A manual webhook retry is allowed "
               "(failed state permits a retry run) — do not create the CJ order "
               "by hand, or the retry will hit ORDER_CODE_EXIST.",
               5040, 880),
    http_node("f33", "CJ pay balance", "POST",
              "= {{ $env.CJ_API_BASE + '/shopping/pay/payBalanceV2' }}",
              4800, 360, headers=[CJ_TOKEN_HEADER, JSON_HEADER],
              body="= {{ { shipmentOrderId: $json.shipment_order_id } }}"),
    code_node("f34", "Evaluate payment", EVALUATE_PAY_JS, 5040, 360),
    if_node("f35", "Payment ok?", "={{ $json.payment_ok }}", 5280, 360),
    slack_node("f36", "Alert: payment failed",
               "=CJ PAYMENT FAILED for order {{ $json.order_id }} (code "
               "{{ $json.payment_code }}). The CJ order exists UNPAID — pay it "
               "by hand in CJ, do NOT re-create it. No shipped email sent.",
               5280, 640),
    http_node("f37", "CJ order detail", "GET",
              "= {{ $env.CJ_API_BASE + '/shopping/order/getOrderDetail?orderId=' "
              "+ $json.cj_order_id }}",
              5520, 360, headers=[CJ_TOKEN_HEADER]),
    code_node("f38", "Capture tracking", CAPTURE_JS, 5760, 360),
    if_node("f39", "Tracking present?", "={{ $json.tracking_present }}", 6000, 360),
    code_node("f40", "Mark awaiting tracking", MARK_AWAITING_JS, 6000, 640),
    slack_node("f41", "Alert: awaiting tracking",
               "=PO placed and PAID, awaiting tracking: order {{ $json.order_id }}, CJ order "
               "{{ $json.cj_order_id }}. No shipped email sent. Re-check tracking "
               "via a CJ order-detail lookup; do not re-PO (dedupe blocks "
               "redelivery for paid orders — retry a failed execution from the "
               "execution list if Medusa marking failed).",
               6240, 640),
    http_node("f42", "Medusa mark fulfilled", "POST",
              "= {{ $env.MEDUSA_API_BASE + '/admin/orders/' + $json.order_id + '/fulfillments' }}",
              6240, 360,
              headers=[MEDUSA_TOKEN_HEADER, JSON_HEADER],
              body="= {{ { items: $json.items.map((i) => ({ item_id: i.item_id, quantity: i.qty })), "
              "labels: [{ tracking_number: $json.tracking_number }] } }}"),
    code_node("f43", "Mark succeeded", MARK_SUCCEEDED_JS, 6480, 360),
    {"id": "f44", "name": "Email customer (tracking)",
     "parameters": {"emailType": "text", "fromEmail": "= {{ $env.SMTP_FROM }}",
                    "message": "=Good news — your 3rd Eye order shipped. Tracking: "
                    "{{ $json.tracking_number }} ({{ $json.carrier }}).",
                    "subject": "Your 3rd Eye order shipped",
                    "toEmail": "= {{ $json.email }}"},
     "position": [6720, 360], "type": "n8n-nodes-base.emailSend", "typeVersion": 2.1},
    slack_node("f45", "Slack: fulfilled",
               "=Order fulfilled: {{ $json.order_id }}, tracking {{ $json.tracking_number }}.",
               6960, 360),
    {"id": "f46", "name": "Inventory sync (6h)",
     "parameters": {"rule": {"interval": [{"field": "hours", "hoursInterval": 6}]}},
     "position": [240, 1000], "type": "n8n-nodes-base.scheduleTrigger",
     "typeVersion": 1.2},
    http_node("f47", "CJ get access token (sync)", "POST",
              "= {{ $env.CJ_API_BASE + '/authentication/getAccessToken' }}",
              480, 1000, headers=[JSON_HEADER],
              body="= {{ { apiKey: $env.CJ_API_KEY } }}"),
    code_node("f48", "CJ token (sync)", TOKEN_JS, 720, 1000),
    if_node("f49", "Token ok? (sync)", "={{ $json.token_ok }}", 960, 1000),
    slack_node("f50", "Alert: CJ sync token failed",
               "=CJ token failed on 6h sync. No inventory pull made; check CJ_API_KEY.",
               960, 1240),
    http_node("f51", "CJ inventory pull", "GET",
              "= {{ $env.CJ_API_BASE + '/product/listV2?page=1&size=100' }}",
              1200, 1000, headers=[CJ_TOKEN_HEADER_SYNC]),
    code_node("f52", "Diff + low-stock digest", DIGEST_JS, 1440, 1000),
    slack_node("f53", "Slack: low-stock digest",
               "=Low-stock digest (6h sync): {{ $json.count }} SKUs under 5 units. "
               "Total catalogue records: {{ $json.totalRecords }}"
               "{{ $json.truncated ? ' — TRUNCATED to page 1 (100); page through listV2 before trusting completeness.' : '' }} "
               "Backorders pending: {{ $json.backorders_pending.join(', ') || 'none' }}. "
               "Back in stock: {{ $json.backorder_ready.join(', ') || 'none' }} — re-check those orders.",
               1680, 1000),
    {"id": "f56", "name": "Bad-signature digest (15m)",
     "parameters": {"rule": {"interval": [{"field": "minutes", "minutesInterval": 15}]}},
     "position": [240, 1400], "type": "n8n-nodes-base.scheduleTrigger",
     "typeVersion": 1.2},
    code_node("f57", "Build window digest", WINDOW_DIGEST_JS, 480, 1400),
    slack_node("f58", "Slack: window digest",
               "=Window digest (bad signatures + duplicates, always reported): "
               "bad signatures {{ $json.bad_signature_total }} "
               "(missing-id {{ $json.bad_signature_missing }}; per order: "
               "{{ $json.bad_signature_per_order_safe.join(', ') || 'none' }}), "
               "duplicates suppressed {{ $json.duplicate_suppressed_total }} "
               "(per order: {{ $json.duplicate_suppressed_per_order_safe.join(', ') || 'none' }}), "
               "missing-id duplicates {{ $json.duplicate_missing_total }}. "
               "Window bucket {{ $json.window_bucket }}. "
               "A zero total is a real report: no bad signatures or duplicates in this window.",
               720, 1400),
    {"id": "f54", "name": "SETUP — read first",
     "parameters": {"color": 4, "content": SETUP, "height": 300, "width": 900},
     "position": [240, 60], "type": "n8n-nodes-base.stickyNote", "typeVersion": 1},
    {"id": "f55", "name": "SOURCE",
     "parameters": {"color": 5, "content": SOURCE, "height": 300, "width": 900},
     "position": [1200, 60], "type": "n8n-nodes-base.stickyNote", "typeVersion": 1},
]


def link(node: str) -> dict:
    return {"index": 0, "node": node, "type": "main"}


connections = {
    "Order webhook": {"main": [[link("Verify + Normalize")]]},
    "Verify + Normalize": {"main": [[link("Signature valid?")]]},
    "Signature valid?": {"main": [[link("Has items?")],
                                   [link("Bad-signature throttle")]]},
    "Bad-signature throttle": {"main": [[link("Alert: bad signature")]]},
    "Alert: bad signature": {"main": [[]]},
    "Has items?": {"main": [[link("Dedupe check")],
                             [link("Alert: empty order")]]},
    "Alert: empty order": {"main": [[]]},
    "Dedupe check": {"main": [[link("Duplicate?")]]},
    "Duplicate?": {"main": [[link("Duplicate alert throttle")],
                             [link("CJ get access token")]]},
    "Duplicate alert throttle": {"main": [[link("Alert: duplicate delivery")]]},
    "Alert: duplicate delivery": {"main": [[]]},
    "CJ get access token": {"main": [[link("CJ token")]]},
    "CJ token": {"main": [[link("Token ok?")]]},
    "Token ok?": {"main": [[link("Split order lines")],
                            [link("Alert: CJ token failed")]]},
    "Alert: CJ token failed": {"main": [[]]},
    "Split order lines": {"main": [[link("Has CJ variant id?")]]},
    "Has CJ variant id?": {"main": [[link("CJ stock by vid")],
                                     [link("CJ stock by sku")]]},
    "CJ stock by vid": {"main": [[link("Merge stock results")]]},
    "CJ stock by sku": {"main": [[link("Merge stock results")]]},
    "Merge stock results": {"main": [[link("Evaluate stock")]]},
    "Evaluate stock": {"main": [[link("All in stock?")]]},
    "All in stock?": {"main": [[link("Build CJ order body")],
                                [link("Backorder: email customer")]]},
    "Backorder: email customer": {"main": [[link("Alert: backorder")]]},
    "Alert: backorder": {"main": [[]]},
    "Build CJ order body": {"main": [[link("CJ create order")]]},
    "CJ create order": {"main": [[link("Evaluate PO")]]},
    "Evaluate PO": {"main": [[link("PO ok?")]]},
    "PO ok?": {"main": [[link("CJ pay balance")],
                         [link("PO duplicate?")]]},
    "PO duplicate?": {"main": [[link("Alert: PO duplicate")],
                                [link("Dead-letter PO")]]},
    "Alert: PO duplicate": {"main": [[]]},
    "Dead-letter PO": {"main": [[link("Alert: PO failed")]]},
    "Alert: PO failed": {"main": [[]]},
    "CJ pay balance": {"main": [[link("Evaluate payment")]]},
    "Evaluate payment": {"main": [[link("Payment ok?")]]},
    "Payment ok?": {"main": [[link("CJ order detail")],
                              [link("Alert: payment failed")]]},
    "Alert: payment failed": {"main": [[]]},
    "CJ order detail": {"main": [[link("Capture tracking")]]},
    "Capture tracking": {"main": [[link("Tracking present?")]]},
    "Tracking present?": {"main": [[link("Medusa mark fulfilled")],
                                    [link("Mark awaiting tracking")]]},
    "Mark awaiting tracking": {"main": [[link("Alert: awaiting tracking")]]},
    "Alert: awaiting tracking": {"main": [[]]},
    "Medusa mark fulfilled": {"main": [[link("Mark succeeded")]]},
    "Mark succeeded": {"main": [[link("Email customer (tracking)")]]},
    "Email customer (tracking)": {"main": [[link("Slack: fulfilled")]]},
    "Slack: fulfilled": {"main": [[]]},
    "Inventory sync (6h)": {"main": [[link("CJ get access token (sync)")]]},
    "CJ get access token (sync)": {"main": [[link("CJ token (sync)")]]},
    "CJ token (sync)": {"main": [[link("Token ok? (sync)")]]},
    "Token ok? (sync)": {"main": [[link("CJ inventory pull")],
                                   [link("Alert: CJ sync token failed")]]},
    "Alert: CJ sync token failed": {"main": [[]]},
    "CJ inventory pull": {"main": [[link("Diff + low-stock digest")]]},
    "Diff + low-stock digest": {"main": [[link("Slack: low-stock digest")]]},
    "Slack: low-stock digest": {"main": [[]]},
    "Bad-signature digest (15m)": {"main": [[link("Build window digest")]]},
    "Build window digest": {"main": [[link("Slack: window digest")]]},
    "Slack: window digest": {"main": [[]]},
}

wf = {"active": False, "connections": connections,
      "name": "3rd Eye - Order to Fulfilment (Medusa to CJ) v2",
      "nodes": nodes, "settings": {"executionOrder": "v1"}}

# Validation: every connection target exists; no TODO survives; the
# silent payType flip and Bearer Medusa token are gone.
names = {n["name"] for n in nodes}
for src, outs in connections.items():
    assert src in names, src
    for branch in outs["main"]:
        for lnk in branch:
            assert lnk["node"] in names, (src, lnk)
text = json.dumps(wf)
assert "TODO" not in text
assert "CJ_PAY_TYPE" not in text
assert "Bearer {{ $env.MEDUSA_ADMIN_TOKEN }}" not in text
assert "/product/stock" not in text or "queryByVid" in text
assert "only here does the order become a dedupe block" not in text
assert "minutesInterval" in text  # 15-minute digest schedule present
assert wf["active"] is False  # stays inactive until activation evidence
OUT.write_text(json.dumps(wf, indent=2) + "\n")
print(f"wrote {OUT} ({len(nodes)} nodes, connections resolve, no TODO)")
