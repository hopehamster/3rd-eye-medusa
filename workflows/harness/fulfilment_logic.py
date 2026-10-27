"""Python mirror of the load-bearing decisions in the n8n v2 workflow.

This module exists so the workflow's decisions can be proven without any
live call: no HTTP, no n8n, no CJ, no Medusa. The n8n Code nodes in
``3rd-eye-order-to-fulfilment-v2.json`` implement the same decisions in
JavaScript; the tests in ``test_fulfilment_logic.py`` pin the behaviour
both must share.

Design notes (each traces to a doc-grounded v2 change, fixed per review):
- Signature: FIXED-LENGTH loop mirroring the workflow JS exactly — the
  loop always runs ``len(secret)`` times, padding a short ``provided``
  with 0, so iteration count cannot leak the provided length. An
  empty/missing secret never validates (fail closed). This replaces the
  earlier ``hmac.compare_digest`` mirror, which the workflow JS never
  used; the JS cannot rely on Node ``crypto`` (needs an instance-level
  ``NODE_FUNCTION_ALLOW_BUILTIN=crypto`` allow-list that is not
  guaranteed), so the fixed-length loop is the portable fix.
- Dedupe: OUTCOME-AWARE order state, not a plain seen-set. Terminal
  states (``succeeded``, ``in_flight``, ``needs_lookup``,
  ``payment_failed``, ``awaiting_tracking``) block a webhook redelivery;
  ``failed``/``backordered`` allow a legitimate retry. An order with no
  id (``''``/``'unknown'``) is never recorded. Static data is NOT
  durable across workflow re-import/deletion and is capped — the CJ
  ``orderNumber`` uniqueness + ``ORDER_CODE_EXIST`` handling below is
  the durable backstop, and the SETUP sticky names a Data Table as the
  activation replacement. Dedupe is NOT replay protection (see SETUP).
- Stock: CJ ``queryByVid`` returns ``data.totalInventoryNum`` and echoes
  ``data.vid``; CJ ``queryBySku`` returns ``data.totalInventoryNum``
  with NO sku echo (Product doc §3.2). Lines with a CJ variant id use
  ``queryByVid``; lines with only a SKU use ``queryBySku`` (never a SKU
  passed as vid). Matching uses n8n engine item pairing
  (``pairedItem``) + the vid-echo cross-check + a count guard — never
  raw zip-by-index.
- PO success: CJ envelopes use ``result`` + ``code``; a bare ``success``
  field (v1's check) is NOT success. ``ORDER_CODE_EXIST`` in the
  message means "already exists — look it up", not a generic failure.
- Payment: create-only (``payType`` 3) followed by an explicit
  ``payBalanceV2`` step; there is no payType env flip anywhere.
- Tracking: ``getOrderDetail`` returns ``data.trackNumber`` only once
  shipped; empty/absent/error means "awaiting tracking", never "shipped".
- Dead-letter: one entry per order_id; a second failure for the same
  order is an alert repeat, not a second dead-letter entry. A
  ``failed`` state still permits a manual webhook retry.
- Alerts: bad-signature alerts are throttled to one per 15-minute
  window (suppressed counts surface on the next window's alert AND in
  the scheduled window-close digest); duplicate alerts fire once per
  order_id (repeats counted, surfaced in the digest, never silently
  dropped). Missing-id deliveries have a DISTINCT missing counter —
  they are never keyed under a shared 'missing' order.
- Digest: build_window_digest() ALWAYS emits a report (even all-zero
  totals) for the closed window, so a burst ending inside one window
  is reported without waiting for another bad signature.
- Sanitization: alert texts use sanitize_alert_value() output only —
  Slack formatting/mention characters (@ # < > ` * ~ &) and control
  characters are stripped and values truncated, never interpolated raw.
"""

from __future__ import annotations

DEDUPE_CAP_DEFAULT = 5000
_BAD_SIG_WINDOW_SECONDS = 900

# States that must survive a cap prune the longest: the order is already
# in CJ or terminally recorded, so losing them risks a re-PO. Transient
# states (in_flight / failed / backordered) are pruned first, FIFO.
_PRUNE_PROTECTED = frozenset({
    "succeeded", "needs_lookup", "payment_failed", "awaiting_tracking",
})
_BLOCKING_STATES = frozenset({
    "in_flight", "succeeded", "needs_lookup", "payment_failed",
    "awaiting_tracking",
})


def _fixed_length_compare(provided: str, secret: str) -> tuple[bool, int]:
    """Compare with a loop that always runs ``len(secret)`` times.

    Returns ``(valid, iterations)``. A short ``provided`` is padded
    with 0 so the iteration count depends only on the secret length.
    """
    if not secret:
        return False, 0
    diff = 0 if len(provided) == len(secret) else 1
    for i in range(len(secret)):
        p = ord(provided[i]) if i < len(provided) else 0
        diff |= p ^ ord(secret[i])
    return diff == 0, len(secret)


def verify_signature(provided: str | None, secret: str | None) -> bool:
    """Return True only if ``provided`` equals ``secret``.

    Fixed-length loop (see module notes); empty or missing values
    always fail so a misconfigured workflow fails closed, not open.
    """
    if not provided or not secret:
        return False
    valid, _ = _fixed_length_compare(provided, secret)
    return valid


def verify_signature_iterations(provided: str, secret: str) -> int:
    """Iteration count of the fixed-length compare (for leak tests)."""
    _, iterations = _fixed_length_compare(provided, secret)
    return iterations


def should_record_order_id(order_id: str | None) -> bool:
    """True only for a real order id — never ``''`` or ``'unknown'``."""
    return bool(order_id) and order_id != "unknown"


class DedupeStore:
    """Outcome-aware order state store (mirrors Dedupe check + markers).

    ``begin()`` returns True when the order must NOT run (duplicate /
    rejected); False when it may run. ``check()`` is the legacy alias
    for ``begin()`` used by the original tests.
    """

    def __init__(self, cap: int = DEDUPE_CAP_DEFAULT) -> None:
        self._cap = cap
        self._states: dict[str, str] = {}

    def begin(self, order_id: str) -> bool:
        """Claim the order for a run; True = blocked, False = may run."""
        if not should_record_order_id(order_id):
            return True  # rejected, never recorded
        state = self._states.get(order_id)
        if state in _BLOCKING_STATES:
            return True
        self._states[order_id] = "in_flight"
        self._prune()
        return False

    def check(self, order_id: str) -> bool:
        """Legacy alias for ``begin()``."""
        return self.begin(order_id)

    def mark(self, order_id: str, state: str) -> None:
        """Record a terminal/intermediate outcome for ``order_id``."""
        if should_record_order_id(order_id):
            self._states[order_id] = state
            self._prune()

    def state(self, order_id: str) -> str | None:
        """Current recorded state, or None if never recorded."""
        return self._states.get(order_id)

    def _prune(self) -> None:
        """Cap the store, pruning transient states first, FIFO."""
        while len(self._states) > self._cap:
            victim = next(
                (oid for oid, st in self._states.items()
                 if st not in _PRUNE_PROTECTED),
                next(iter(self._states)),
            )
            del self._states[victim]

    def contains(self, order_id: str) -> bool:
        """Non-mutating membership probe (for tests; begin() records)."""
        return order_id in self._states

    def __len__(self) -> int:
        return len(self._states)


def _is_number(value: object) -> bool:
    """True for a real int/float quantity — never bool, str, or None."""
    return isinstance(value, (int, float)) and not isinstance(value, bool)


def parse_cj_stock(envelope: dict) -> int | float | None:
    """Extract total inventory from a CJ queryByVid/queryBySku envelope.

    Returns the numeric quantity, or None when the envelope is an error
    (``result`` False / non-200 code) or carries no usable quantity.
    Bool True is NOT inventory; floats are accepted as numbers.
    """
    if envelope.get("result") is not True or envelope.get("code") != 200:
        return None
    data = envelope.get("data")
    if not isinstance(data, dict):
        return None
    qty = data.get("totalInventoryNum")
    return qty if _is_number(qty) else None


def route_stock(items: list[dict], stock: dict[str, int]) -> dict:
    """Route an order to PO vs backorder from per-SKU quantities.

    Empty items never route to PO. Unknown or non-numeric stock is a
    shortage, never assumed stock.
    """
    if not items:
        return {"all_in_stock": False, "shortages": [],
                "error": "empty_items"}
    shortages = [i["sku"] for i in items
                 if not _is_number(stock.get(i["sku"]))
                 or stock.get(i["sku"], 0) < i["qty"]]
    return {"all_in_stock": not shortages, "shortages": shortages}


def evaluate_stock(lines: list[dict]) -> dict:
    """Aggregate per-line stock results (one CJ query per line)."""
    if not lines:
        return {"all_in_stock": False, "shortages": [],
                "error": "empty_items"}
    shortages = [ln["sku"] for ln in lines
                 if not _is_number(ln.get("available"))
                 or ln["available"] < ln["qty"]]
    return {"all_in_stock": not shortages, "shortages": shortages}


def stock_lookup_path(line: dict) -> tuple[str, str]:
    """CJ stock endpoint for one line: vid path if known, else SKU path."""
    vid = line.get("cj_variant_id") or ""
    if vid:
        return "queryByVid", vid
    return "queryBySku", line.get("sku", "")


def evaluate_stock_keyed(lines: list[dict], results: list[dict]) -> dict:
    """Aggregate stock results matched by engine pairing, not order.

    Each result carries ``paired_index`` (n8n ``pairedItem``) into
    ``lines``. A vid-echo mismatch, an error envelope, a missing result,
    or a count mismatch all route that line (or every line, on count
    mismatch) to shortage — never to an assumed match.
    """
    if len(results) != len(lines):
        return {"all_in_stock": False,
                "shortages": [ln["sku"] for ln in lines],
                "count_mismatch": True, "stock_match_mismatch": False}
    by_paired = {r.get("paired_index"): r for r in results}
    shortages: list[str] = []
    mismatch = False
    for idx, line in enumerate(lines):
        result = by_paired.get(idx)
        if result is None:
            shortages.append(line["sku"])
            continue
        if result.get("result") is not True or result.get("code") != 200:
            shortages.append(line["sku"])
            continue
        data = result.get("data") if isinstance(result.get("data"), dict) \
            else {}
        vid = line.get("cj_variant_id") or ""
        if vid and data.get("vid") and str(data["vid"]) != str(vid):
            shortages.append(line["sku"])
            mismatch = True
            continue
        qty = data.get("totalInventoryNum")
        if not _is_number(qty) or qty < line["qty"]:
            shortages.append(line["sku"])
    return {"all_in_stock": not shortages, "shortages": shortages,
            "count_mismatch": False, "stock_match_mismatch": mismatch}


def idempotency_key(order_id: str) -> str:
    """Idempotency key for the CJ create-order call: the order_id itself."""
    return order_id


class DeadLetter:
    """Failed-PO dead-letter list: exactly one entry per order_id."""

    def __init__(self) -> None:
        self._entries: dict[str, str] = {}

    def record(self, order_id: str, reason: str) -> bool:
        """Append a failure; return False if already dead-lettered."""
        if order_id in self._entries:
            return False
        self._entries[order_id] = reason
        return True

    def contains(self, order_id: str) -> bool:
        return order_id in self._entries

    def __len__(self) -> int:
        return len(self._entries)


def parse_cj_create_order(envelope: dict) -> dict:
    """Parse a CJ createOrderV3 envelope into PO outcome + CJ ids.

    ``po_status`` is ``ok`` (result + code 200), ``duplicate`` (the
    message names ORDER_CODE_EXIST — already exists, look it up), or
    ``failed`` (anything else, including result-true/code-not-200).
    """
    message = envelope.get("message") or ""
    duplicate = "ORDER_CODE_EXIST" in str(message).upper()
    ok = envelope.get("result") is True and envelope.get("code") == 200
    data = envelope.get("data") if isinstance(envelope.get("data"), dict) \
        else {}
    status = "ok" if ok else ("duplicate" if duplicate else "failed")
    return {
        "ok": ok,
        "po_status": status,
        "cj_order_id": data.get("orderId", "") if ok else "",
        "order_number": data.get("orderNumber", "") if ok else "",
        "shipment_order_id": data.get("shipmentOrderId", "") if ok else "",
    }


def parse_cj_pay(envelope: dict) -> bool:
    """Parse a CJ payBalanceV2 envelope: result + code 200 only."""
    return envelope.get("result") is True and envelope.get("code") == 200


def parse_cj_token(envelope: dict) -> str:
    """Extract a CJ access token, or '' on any error envelope."""
    if envelope.get("result") is not True or envelope.get("code") != 200:
        return ""
    data = envelope.get("data") if isinstance(envelope.get("data"), dict) \
        else {}
    token = data.get("accessToken") or ""
    return token if isinstance(token, str) else ""


def parse_cj_tracking(envelope: dict) -> dict:
    """Parse a CJ getOrderDetail envelope into tracking presence.

    An error envelope never counts as tracking, even if it carries a
    stale trackNumber field.
    """
    if envelope.get("result") is not True or envelope.get("code") != 200:
        return {"tracking_present": False, "tracking_number": "",
                "carrier": ""}
    data = envelope.get("data") if isinstance(envelope.get("data"), dict) \
        else {}
    number = data.get("trackNumber") or ""
    return {
        "tracking_present": bool(number),
        "tracking_number": number,
        "carrier": data.get("trackingProvider", ""),
    }


def _line_qty(item: dict) -> int | float:
    qty = item.get("quantity")
    return qty if _is_number(qty) and qty > 0 else 1


def build_cj_order_body(order: dict, logistic_name: str,
                        from_country_code: str) -> dict:
    """Build a createOrderV3 body (mirrors Build CJ order body JS).

    ``payType`` is fixed at 3 (create-only); payment is the separate
    explicit payBalanceV2 step — there is no payType input to flip.
    ``shippingCountry`` prefers a country NAME when Medusa supplies
    one (``shipping_address.country``); it falls back to the country
    CODE, which CJ requires as a separate field — that fallback is a
    recorded known limit (see SETUP), not a claim that code == name.
    Products carry ``vid`` when a CJ variant id is known, else ``sku``.
    """
    addr = order.get("shipping_address") or {}
    code = (addr.get("country_code") or "").upper()
    products = []
    for item in order.get("items") or []:
        product: dict = {"sku": item.get("sku", ""),
                         "quantity": _line_qty(item),
                         "storeLineItemId": item.get("item_id", "")}
        vid = item.get("cj_variant_id") or ""
        if vid:
            product["vid"] = vid
        products.append(product)
    return {
        "orderNumber": order.get("order_id", ""),
        "shippingZip": addr.get("postal_code") or "",
        "shippingCountryCode": code,
        "shippingCountry": addr.get("country") or code,
        "shippingProvince": addr.get("province") or "",
        "shippingCity": addr.get("city") or "",
        "shippingCustomerName": order.get("customer_name") or "",
        "shippingAddress": addr.get("address_1") or "",
        "shippingAddress2": addr.get("address_2") or "",
        "shippingPhone": addr.get("phone") or "",
        "email": order.get("email") or "",
        "logisticName": logistic_name,
        "fromCountryCode": from_country_code,
        "payType": 3,
        "products": products,
    }


def normalize_order(body: dict, headers: dict) -> dict:
    """Mirror of Verify + Normalize (minus the secret comparison).

    Returns order id flags, normalized items, and alert forensics
    (source + header presence — never the presented secret value).
    """
    order_id = body.get("id") or body.get("display_id") or ""
    addr = body.get("shipping_address") or {}
    items = []
    for item in body.get("items") or []:
        variant = item.get("variant") or {}
        metadata = item.get("metadata") or {}
        items.append({
            "item_id": item.get("id") or "",
            "sku": item.get("variant_sku") or variant.get("sku")
            or item.get("title") or "unknown",
            "cj_variant_id": metadata.get("cj_variant_id") or "",
            "qty": _line_qty(item),
        })
    first = addr.get("first_name") or ""
    last = addr.get("last_name") or ""
    return {
        "order_id": order_id,
        "missing_order_id": not should_record_order_id(order_id),
        "items_empty": len(items) == 0,
        "items": items,
        "email": (body.get("customer") or {}).get("email")
        or body.get("email") or "",
        "customer_name": (first + " " + last).strip(),
        "source": headers.get("x-forwarded-for")
        or headers.get("x-real-ip") or "",
        "header_present": bool(headers.get("x-medusa-secret")),
    }


_SANITIZE_STRIP = "@#<>`*~&"


def sanitize_alert_value(value: object, max_len: int = 80) -> str:
    """Strip Slack formatting/mention characters + controls, truncate.

    Removes @ (mentions), # (channel links), < > (link markup), ` * ~
    (code/bold/strike formatting), & (entity start), and all control
    characters (incl. newlines). Legitimate id characters (letters,
    digits, '-', '_') survive — a lone '_' cannot form a mention or a
    link, which are the injection shapes this guards. Never pass raw
    attacker-controlled values to a Slack text; use this output only.
    """
    text = "" if value is None else str(value)
    cleaned = "".join(
        ch for ch in text
        if ch not in _SANITIZE_STRIP and ord(ch) >= 0x20 and ord(ch) != 0x7F
    )
    return cleaned[:max_len]


def build_bad_signature_alert_text(order_id: object, source: object,
                                   header_present: bool,
                                   suppressed_prev: int) -> str:
    """Bad-signature Slack text — sanitized fields only, never raw."""
    safe_order = sanitize_alert_value(order_id, max_len=80)
    safe_source = sanitize_alert_value(source, max_len=64)
    header = "wrong" if header_present else "missing"
    return (
        f"Bad webhook signature dropped. order {safe_order}, "
        f"source {safe_source}, header {header}, "
        f"suppressed in prior window: {suppressed_prev}. "
        "No order processed. The presented secret is never logged."
    )


class BadSignatureThrottle:
    """One bad-signature alert per 15-minute window (F-A1-1, R-A1-1/2).

    ``should_alert(now_epoch, order_id=None)`` returns
    ``(alert, suppressed_prev)``: the first bad signature in a window
    alerts; repeats in the same window are suppressed and counted, and
    that count surfaces as ``suppressed_prev`` on the next window's
    first alert — AND in the scheduled window-close digest
    (``close_window()``), which consumes the window so a digested
    count is never reported twice. Counts are kept per order id
    (``per_key``) plus a DISTINCT missing-id count (``missing``):
    missing-id deliveries are never collapsed under one shared key.
    """

    def __init__(self) -> None:
        self._bucket: int | None = None
        self._count = 0
        self._alerted = False
        self._per_key: dict[str, int] = {}
        self._missing = 0

    def should_alert(self, now_epoch: float,
                     order_id: str | None = None) -> tuple[bool, int]:
        bucket = int(now_epoch // _BAD_SIG_WINDOW_SECONDS)
        missing = not order_id or order_id == "unknown"
        if bucket != self._bucket:
            prev = (self._count - 1) if self._alerted else 0
            self._bucket = bucket
            self._count = 1
            self._alerted = True
            self._per_key = {} if missing else {order_id: 1}  # type: ignore[dict-item]
            self._missing = 1 if missing else 0
            return True, prev
        self._count += 1
        if missing:
            self._missing += 1
        else:
            self._per_key[order_id] = self._per_key.get(order_id, 0) + 1  # type: ignore[arg-type]
        return False, 0

    def current_counts(self) -> dict:
        """Current window counts: total, per-order, and missing."""
        return {"total": self._count, "per_key": dict(self._per_key),
                "missing": self._missing}

    def close_window(self) -> dict:
        """Snapshot the current window and consume it (R-A1-2).

        Returns the closed window's totals (even all-zero when nothing
        happened) and resets the throttle, so the digest — not a later
        bad signature — is what reports the window. A window closed
        this way is never re-surfaced by a later first alert.
        """
        snapshot = {"window_bucket": self._bucket,
                    "total": self._count,
                    "per_key": dict(self._per_key),
                    "missing": self._missing}
        self._bucket = None
        self._count = 0
        self._alerted = False
        self._per_key = {}
        self._missing = 0
        return snapshot


class DuplicateAlertThrottle:
    """First duplicate per order alerts; repeats are counted (F-A1-4).

    Missing-id deliveries ('' / 'unknown' / None) are NOT keyed under
    a shared 'missing' order (R-A1-1): they increment a distinct
    missing counter, alert on the first missing delivery, and
    ``window_report()`` re-arms the first-missing alert after each
    digest, so a missing-id probe flood surfaces every window instead
    of going invisible after one alert. ``window_report()`` returns
    suppressed-per-order DELTAS since the last digest (watermarked),
    so a digest never double-reports the same suppressed repeats.
    """

    def __init__(self) -> None:
        self._counts: dict[str, int] = {}
        self._watermark: dict[str, int] = {}
        self._missing = 0
        self._missing_alerted = False

    def should_alert(self, order_id: str | None) -> bool:
        if not order_id or order_id == "unknown":
            self._missing += 1
            if self._missing_alerted:
                return False
            self._missing_alerted = True
            return True
        if order_id in self._counts:
            self._counts[order_id] += 1
            return False
        self._counts[order_id] = 1
        return True

    def suppressed_count(self, order_id: str) -> int:
        """Repeats suppressed after the first alert for this order."""
        return max(0, self._counts.get(order_id, 0) - 1)

    def counts(self) -> dict[str, int]:
        """Per-order delivery counts (missing ids never appear here)."""
        return dict(self._counts)

    def missing_count(self) -> int:
        """Missing-id deliveries since the last window report."""
        return self._missing

    def window_report(self) -> dict:
        """Suppressed deltas + missing total since the last report."""
        per_order = {}
        for order_id, count in self._counts.items():
            suppressed = count - 1
            delta = suppressed - self._watermark.get(order_id, 0)
            if delta > 0:
                per_order[order_id] = delta
            self._watermark[order_id] = suppressed
        missing = self._missing
        self._missing = 0
        self._missing_alerted = False
        return {"per_order": per_order,
                "suppressed_total": sum(per_order.values()),
                "missing": missing}


def build_window_digest(bad_throttle: BadSignatureThrottle,
                        dup_throttle: DuplicateAlertThrottle) -> dict:
    """Combined window-close report — ALWAYS emitted (R-A1-1/R-A1-2).

    Consumes the bad-signature window and the duplicate watermark, so
    every window's total is reported exactly once, by the scheduled
    digest, even when no further bad signature ever arrives. All-zero
    totals are a real report ("nothing happened this window"), not a
    reason to skip the digest.
    """
    bad = bad_throttle.close_window()
    dup = dup_throttle.window_report()
    return {
        "window_bucket": bad["window_bucket"],
        "bad_signature_total": bad["total"],
        "bad_signature_per_order": bad["per_key"],
        "bad_signature_missing": bad["missing"],
        "duplicate_suppressed_total": dup["suppressed_total"],
        "duplicate_suppressed_per_order": dup["per_order"],
        "duplicate_missing_total": dup["missing"],
        "total_events": bad["total"] + dup["suppressed_total"] + dup["missing"],
    }


def format_window_digest_text(report: dict) -> str:
    """Slack text for a window digest — sanitized per-order keys only."""
    def _pairs(mapping: dict) -> str:
        parts = [f"{sanitize_alert_value(k)}:{v}"
                 for k, v in mapping.items()]
        return ", ".join(parts) if parts else "none"

    bucket = report["window_bucket"]
    bucket_text = "none" if bucket is None else str(bucket)
    return (
        "Window digest (bad signatures + duplicates, always reported): "
        f"bad signatures {report['bad_signature_total']} "
        f"(missing-id {report['bad_signature_missing']}; per order: "
        f"{_pairs(report['bad_signature_per_order'])}), "
        f"duplicates suppressed {report['duplicate_suppressed_total']} "
        f"(per order: {_pairs(report['duplicate_suppressed_per_order'])}), "
        f"missing-id duplicates {report['duplicate_missing_total']}. "
        f"Window bucket {bucket_text}. "
        "A zero total is a real report: no bad signatures or duplicates "
        "in this window."
    )


def build_digest(pulled_data: dict, backorders: list[dict]) -> dict:
    """Mirror of Diff + low-stock digest (6h sync).

    Surfaces listV2 pagination truncation (``totalRecords`` beyond the
    pulled page) instead of silently truncating, and re-checks
    backordered orders against the pulled catalogue: ``backorder_ready``
    lists orders whose shortage SKUs are all back in stock at the
    needed quantities; ``backorders_pending`` lists every backordered
    order so ops re-checks the rest by hand.
    """
    content = pulled_data.get("content") or []
    products: list[dict] = []
    for entry in content:
        products.extend(entry.get("productList") or [])
    low = [{"sku": p.get("sku") or "", "name": p.get("nameEn") or "",
            "inventory": p.get("warehouseInventoryNum") or 0}
           for p in products
           if not _is_number(p.get("warehouseInventoryNum"))
           or p.get("warehouseInventoryNum", 0) < 5]
    total = pulled_data.get("totalRecords")
    page_size = pulled_data.get("pageSize") or 100
    page_number = pulled_data.get("pageNumber") or 1
    truncated = bool(_is_number(total)
                     and total > page_size * page_number)
    by_sku = {p.get("sku"): p for p in products}
    ready = []
    for order in backorders:
        ok = True
        for shortage in order.get("shortages") or []:
            product = by_sku.get(shortage.get("sku"))
            inv = product.get("warehouseInventoryNum") \
                if product else None
            if not _is_number(inv) or inv < shortage.get("qty", 0):
                ok = False
                break
        if ok:
            ready.append(order.get("order_id"))
    return {
        "low_stock": low,
        "count": len(low),
        "total_records": total if _is_number(total) else 0,
        "truncated": truncated,
        "backorders_pending": [o.get("order_id") for o in backorders],
        "backorder_ready": ready,
    }
