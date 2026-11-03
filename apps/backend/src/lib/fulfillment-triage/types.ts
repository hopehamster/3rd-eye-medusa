/**
 * Fulfilment exception triage - domain types.
 *
 * This layer is read-only by construction: nothing here can place a supplier
 * order, take a payment, or refund. A triage run produces a recommendation
 * record; a human decides and runs the existing ops scripts.
 *
 * See agents/langgraph-agents/fulfilment-exception-agent-spec.md (issue #125):
 * money actions are RECOMMEND-ONLY. That rule is enforced in code by
 * `executed: false` on every record plus assertRecommendOnly() in guardrails.ts.
 */

export type Severity = "info" | "warning" | "critical"

/** Failure taxonomy. One code per observable condition - nothing speculative. */
export type FindingCode =
  /** Not a paid, still-open order: nothing to triage. */
  | "ineligible_order"
  /** A line item's variant carries no `cj_vid`, so the supplier cannot be told what to ship. */
  | "no_supplier_link"
  /** The shipping address cannot be turned into a shippable supplier payload. */
  | "address_unusable"
  /** Paid past the grace window and no CJ order id was ever recorded. */
  | "supplier_order_absent"
  /** The supplier cancelled / closed the order it was given. */
  | "supplier_order_cancelled"
  /** A mapped product has no US warehouse stock (only when the CJ probe ran). */
  | "supplier_stock_absent"
  /** A CJ order exists but the order still has no shipment past the stale window. */
  | "shipment_not_tracked"
  /** Supplier state could not be checked, so any conclusion is partial. */
  | "probe_unavailable"

export interface Finding {
  code: FindingCode
  severity: Severity
  /** One human sentence. Must not contain customer PII - see guardrails.redactEmail. */
  detail: string
  /** Ids, counts and booleans only - this is what a reviewer checks against. */
  evidence: Record<string, string | number | boolean>
}

export type Recommendation = "retry" | "refund" | "alert" | "none"

/**
 * The only effects a triage record may declare. Anything that spends money or
 * moves stock is deliberately absent and is rejected by assertRecommendOnly().
 */
export type TriageEffect = "record_recommendation" | "emit_alert"

export interface TriageLineItem {
  id: string
  title?: string
  quantity: number
  variantId?: string
  sku?: string
  /** Supplier variant id from variant metadata. Absent = the order cannot be placed. */
  cjVid?: string
  /** Supplier product id from product metadata. Needed to read supplier stock. */
  cjPid?: string
}

export interface TriageAddress {
  firstName?: string
  lastName?: string
  address1?: string
  address2?: string
  city?: string
  province?: string
  postalCode?: string
  countryCode?: string
  phone?: string
}

export interface SupplierOrderRef {
  cjOrderId?: string
  cjOrderNumber?: string
  /** When the supplier order was recorded in Medusa metadata. */
  placedAt?: string
}

export interface PriorTriage {
  key: string
  recommendation: Recommendation
  at: string
}

/** Everything the classifier is allowed to see about one order. */
export interface TriageSnapshot {
  id: string
  displayId?: string | number
  email?: string
  status?: string
  paymentStatus?: string
  fulfillmentStatus?: string
  /** ISO timestamp of order creation. */
  createdAt: string
  items: TriageLineItem[]
  shippingAddress?: TriageAddress
  supplier?: SupplierOrderRef
  priorTriage?: PriorTriage
}

export interface SupplierStock {
  /** Units in the US warehouse - the only pool that ships on the promised SLA. */
  us: number
  /** Units anywhere else (slower, and a different promise to the customer). */
  other: number
}

/** What the probe is asked to check. Both parts are optional work. */
export interface SupplierProbeRequest {
  /** Supplier product ids whose US stock matters for this order. */
  pids: string[]
  /** The supplier order recorded in Medusa, if one exists. */
  cjOrderId?: string
}

export interface SupplierOrderState {
  /** Raw supplier status string, lower-cased for matching only. */
  status?: string
  trackingNumber?: string
  logisticName?: string
}

export interface SupplierProbeResult {
  /** True when the supplier was actually queried. False means "not investigated". */
  checked: boolean
  checkedAt: string
  /** Stock by supplier product id. Missing key = unknown, not zero. */
  stockByPid: Record<string, SupplierStock>
  /** Supplier order state, when an order id was supplied and could be read. */
  order?: SupplierOrderState
  /** Per-subject failure reasons. Any entry means the picture is partial. */
  failures: Record<string, string>
  /** Set when the whole probe could not run (no credentials, supplier down). */
  unavailableReason?: string
}

export interface SupplierProbe {
  id: string
  check(
    request: SupplierProbeRequest,
    nowIso: string
  ): Promise<SupplierProbeResult>
}

export interface TriageConfig {
  /** Injected clock so classification is deterministic under test. */
  nowIso: string
  /** Hours after payment before a missing supplier order counts as an exception. */
  graceHours: number
  /** Hours after the supplier order before "no shipment yet" counts as stuck. */
  staleHours: number
  /** After this long, an out-of-stock order recommends refund instead of alert. */
  outOfStockRefundHours: number
  /** Do not re-record an identical recommendation for the same order inside this window. */
  alertCooldownHours: number
  maxOrdersPerRun: number
  maxProbeCalls: number
  paidStatuses: string[]
  probeEnabled: boolean
}

export interface TriageRecord {
  orderId: string
  displayId?: string | number
  /** Stable hash of (order, finding codes) - the idempotency key. */
  key: string
  recommendation: Recommendation
  /** 0..1. Low confidence always resolves to an alert, never to an action. */
  confidence: number
  confidenceRationale: string
  findings: Finding[]
  summary: string
  checklist: string[]
  effects: TriageEffect[]
  /** Compile-time and runtime proof that triage executed nothing. */
  executed: false
  reasoner: string
  probe: string
  createdAt: string
}

export interface TriageResult {
  record: TriageRecord
  skipped: boolean
  skipReason?: string
}

export interface TriageLogger {
  info: (message: string) => void
  warn: (message: string) => void
}
