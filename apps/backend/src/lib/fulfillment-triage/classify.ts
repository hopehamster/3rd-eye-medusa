/**
 * Deterministic classification of a fulfilment exception.
 *
 * Every finding is derived from data the backend already holds - the order, its
 * line items, variant/product metadata, the recorded supplier order - plus, when
 * the probe is enabled, live supplier stock and supplier order status. Nothing
 * is inferred. If the supplier could not be checked, the finding says so instead
 * of guessing: alert beats a confident wrong recommendation (issue #125).
 */
import type {
  Finding,
  SupplierProbeResult,
  TriageConfig,
  TriageSnapshot,
} from "./types"
import { hoursBetween } from "./guardrails"

/** Orders in these states are not waiting on anyone. */
const CLOSED_ORDER_STATUSES = ["canceled", "cancelled", "draft"]

/** Fulfilment in these states means the goods are already out the door. */
const CLOSED_FULFILLMENT_STATUSES = [
  "fulfilled",
  "delivered",
  "shipped",
  "partially_shipped",
  "canceled",
  "cancelled",
]

/** Supplier statuses that mean the order will never ship as placed. */
const DEAD_SUPPLIER_STATUS = /cancel|closed|invalid|lapsed/

const normalize = (value?: string): string => (value ?? "").trim().toLowerCase()

/**
 * Returns an `ineligible_order` finding when this order is not something the
 * agent should touch, or null when it is a live candidate.
 */
export function ineligibility(
  snapshot: TriageSnapshot,
  config: TriageConfig
): Finding | null {
  const orderStatus = normalize(snapshot.status)
  if (CLOSED_ORDER_STATUSES.includes(orderStatus)) {
    return {
      code: "ineligible_order",
      severity: "info",
      detail: `Order is ${orderStatus}, so it is not waiting on fulfilment.`,
      evidence: { order_status: orderStatus },
    }
  }

  const fulfillmentStatus = normalize(snapshot.fulfillmentStatus)
  if (CLOSED_FULFILLMENT_STATUSES.includes(fulfillmentStatus)) {
    return {
      code: "ineligible_order",
      severity: "info",
      detail: `Order is already ${fulfillmentStatus}; there is nothing to recover.`,
      evidence: { fulfillment_status: fulfillmentStatus },
    }
  }

  const paymentStatus = normalize(snapshot.paymentStatus)
  if (!config.paidStatuses.includes(paymentStatus)) {
    return {
      code: "ineligible_order",
      severity: "info",
      detail: `Order is not paid (${paymentStatus || "unknown"}); fulfilment must not start.`,
      evidence: { payment_status: paymentStatus || "unknown" },
    }
  }

  if (snapshot.items.length === 0) {
    return {
      code: "ineligible_order",
      severity: "info",
      detail: "Order has no line items.",
      evidence: { line_items: 0 },
    }
  }

  return null
}

/**
 * Classify one order. Findings are ordered most-actionable first so a reader
 * (human or model) reads the blocking problem before the context.
 */
export function classify(
  snapshot: TriageSnapshot,
  probe: SupplierProbeResult | null,
  config: TriageConfig
): Finding[] {
  const ineligible = ineligibility(snapshot, config)
  if (ineligible) {
    return [ineligible]
  }

  const findings: Finding[] = []
  const ageHours = hoursBetween(snapshot.createdAt, config.nowIso)
  const address = snapshot.shippingAddress
  const supplierStatus = normalize(probe?.order?.status)
  const supplierDead = Boolean(supplierStatus) && DEAD_SUPPLIER_STATUS.test(supplierStatus)
  const trackingNumber = (probe?.order?.trackingNumber ?? "").trim()

  // 1. Can the supplier be told what to ship?
  const unmapped = snapshot.items.filter((item) => !item.cjVid)
  if (unmapped.length > 0) {
    findings.push({
      code: "no_supplier_link",
      severity: "critical",
      detail:
        `${unmapped.length} line item(s) have no supplier variant mapping, ` +
        "so no supplier order can be placed for this order.",
      evidence: {
        unmapped_line_items: unmapped.length,
        line_item_ids: unmapped.map((i) => i.id).join(","),
        unmapped_skus:
          unmapped
            .map((i) => i.sku ?? "none")
            .filter(Boolean)
            .join(",") || "none",
      },
    })
  }

  // 2. Can the supplier ship there?
  const missingAddressFields: string[] = []
  if (!(address?.countryCode ?? "").trim()) {
    missingAddressFields.push("country_code")
  }
  if (!(address?.address1 ?? "").trim()) {
    missingAddressFields.push("address_1")
  }
  if (
    normalize(address?.countryCode) === "us" &&
    !(address?.postalCode ?? "").trim()
  ) {
    missingAddressFields.push("postal_code")
  }
  if (missingAddressFields.length > 0) {
    findings.push({
      code: "address_unusable",
      severity: "critical",
      detail:
        "The shipping address is missing fields the supplier needs, " +
        "so the order would be rejected at the supplier.",
      evidence: {
        missing_fields: missingAddressFields.join(","),
        country_code: (address?.countryCode ?? "").trim() || "missing",
      },
    })
  }

  // 3. How much do we actually know? Partial knowledge is a finding, not a gap.
  if (probe?.unavailableReason) {
    findings.push({
      code: "probe_unavailable",
      severity: "warning",
      detail:
        "Supplier state could not be checked, so this recommendation is " +
        "based on Medusa's own records only.",
      evidence: {
        probe_checked: false,
        reason: probe.unavailableReason.slice(0, 120),
      },
    })
  } else if (probe && Object.keys(probe.failures).length > 0) {
    const failed = Object.keys(probe.failures)
    findings.push({
      code: "probe_unavailable",
      severity: "warning",
      detail:
        `Supplier state could not be read for ${failed.length} subject(s); ` +
        "part of the picture is unknown.",
      evidence: {
        probe_checked: true,
        failed_subjects: failed.length,
        subjects: failed.slice(0, 5).join(","),
        reason: String(probe.failures[failed[0]] ?? "").slice(0, 120),
      },
    })
  }

  // 4. Is there stock behind the mapping?
  if (probe?.checked) {
    const zeroStockPids: string[] = []
    let unitsAtRisk = 0
    let otherWarehouseUnits = 0
    for (const item of snapshot.items) {
      if (!item.cjPid) {
        continue
      }
      const stock = probe.stockByPid[item.cjPid]
      if (!stock) {
        continue
      }
      if (stock.us <= 0) {
        zeroStockPids.push(item.cjPid)
        unitsAtRisk += item.quantity
        otherWarehouseUnits += stock.other
      }
    }
    if (zeroStockPids.length > 0) {
      findings.push({
        code: "supplier_stock_absent",
        severity: "warning",
        detail:
          "No US warehouse stock for " +
          `${zeroStockPids.length} supplier product(s); the supplier cannot ship ` +
          "on the promised timeline from the US.",
        evidence: {
          zero_stock_pids: zeroStockPids.join(","),
          us_units: 0,
          units_at_risk: unitsAtRisk,
          other_warehouse_units: otherWarehouseUnits,
        },
      })
    }
  }

  // 5. Did the supplier kill the order it was given?
  if (supplierDead) {
    findings.push({
      code: "supplier_order_cancelled",
      severity: "critical",
      detail:
        "The supplier reports this order as " +
        `"${supplierStatus}", so it will never ship as placed.`,
      evidence: {
        supplier_status: supplierStatus,
        cj_order_id: String(snapshot.supplier?.cjOrderId ?? "none"),
      },
    })
  }

  // 6. Was a supplier order ever placed?
  const hasSupplierOrder = Boolean(snapshot.supplier?.cjOrderId)
  if (!hasSupplierOrder && ageHours >= config.graceHours) {
    findings.push({
      code: "supplier_order_absent",
      severity: "critical",
      detail:
        `Order was paid ${Math.round(ageHours)}h ago and has no supplier order ` +
        "recorded, so it is waiting on a human.",
      evidence: {
        age_hours: Math.round(ageHours),
        grace_hours: config.graceHours,
        supplier_order_recorded: false,
      },
    })
  }

  // 7. Was it placed but never shipped? A tracking number settles it.
  if (hasSupplierOrder && !supplierDead) {
    const sinceIso = snapshot.supplier?.placedAt ?? snapshot.createdAt
    const hoursSince = hoursBetween(sinceIso, config.nowIso)
    if (hoursSince >= config.staleHours && !trackingNumber) {
      findings.push({
        code: "shipment_not_tracked",
        severity: "warning",
        detail:
          `Supplier order has been open ${Math.round(hoursSince)}h with no ` +
          "tracking recorded; it needs chasing.",
        evidence: {
          hours_since_supplier_order: Math.round(hoursSince),
          stale_hours: config.staleHours,
          cj_order_id: String(snapshot.supplier?.cjOrderId ?? "none"),
        },
      })
    }
  }

  return findings
}
