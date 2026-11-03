/**
 * Recommendation decision table.
 *
 * This is deliberately a rule table, not a model call. The LLM writes the
 * explanation (reasoner.ts); it does not pick the recommendation. Two reasons:
 *
 * 1. The decision space is tiny and fully enumerable, so a table is more
 *    accurate than a prompt and can be unit-tested case by case.
 * 2. A recommendation is what a human will act on. A verdict that changes
 *    between identical runs is a defect in a fulfilment queue, not a feature.
 *
 * Money actions stay recommend-only (issue #125): "retry" and "refund" are
 * recommendations a human executes, never instructions the code carries out.
 */
import type {
  Finding,
  FindingCode,
  Recommendation,
  TriageConfig,
} from "./types"
import { hoursBetween } from "./guardrails"

export interface RecommendationDecision {
  recommendation: Recommendation
  /** 0..1. Anything below the caller's trust threshold must surface as an alert. */
  confidence: number
  confidenceRationale: string
}

const has = (findings: Finding[], code: FindingCode): boolean =>
  findings.some((finding) => finding.code === code)

const onlyInfo = (findings: Finding[]): boolean =>
  findings.every((finding) => finding.severity === "info")

/**
 * Rules are evaluated top to bottom; the first match wins.
 *
 * Ordering is the policy: a blocker (no supplier link, unusable address) is
 * checked before anything that assumes a supplier order is possible, because a
 * retry that cannot succeed is worse than an honest alert.
 */
export function recommend(
  findings: Finding[],
  config: TriageConfig,
  context: { orderId: string; createdAt: string }
): RecommendationDecision {
  const ageHours = hoursBetween(context.createdAt, config.nowIso)

  if (findings.length === 0 || onlyInfo(findings)) {
    return {
      recommendation: "none",
      confidence: 1,
      confidenceRationale: "No exception conditions were detected.",
    }
  }

  // A retry is impossible while the order cannot be addressed to a supplier.
  if (has(findings, "no_supplier_link")) {
    return {
      recommendation: "alert",
      confidence: 0.95,
      confidenceRationale:
        "A supplier order cannot be placed until every line item has a cj_vid; " +
        "retrying first would fail the same way.",
    }
  }

  if (has(findings, "address_unusable")) {
    return {
      recommendation: "alert",
      confidence: 0.9,
      confidenceRationale:
        "The shipping address is incomplete, so the supplier would reject the " +
        "order; the fix belongs with the customer, not with a retry.",
    }
  }

  // Out of stock is a demand problem: once the customer has waited past the
  // refund window, refunding is the honest option, not a third retry.
  if (has(findings, "supplier_stock_absent")) {
    if (ageHours >= config.outOfStockRefundHours) {
      return {
        recommendation: "refund",
        confidence: 0.7,
        confidenceRationale:
          `No US stock and the order is ${Math.round(ageHours)}h old, past the ` +
          `${config.outOfStockRefundHours}h restock window; a human should refund ` +
          "rather than keep the customer waiting.",
      }
    }
    return {
      recommendation: "alert",
      confidence: 0.8,
      confidenceRationale:
        "No US warehouse stock; wait for a restock, ship from another " +
        "warehouse with the customer's consent, or refund.",
    }
  }

  // The supplier killed the order it was given. A replacement is the fix, and
  // the external order reference is idempotent, so retrying cannot double-ship.
  if (has(findings, "supplier_order_cancelled")) {
    return {
      recommendation: "retry",
      confidence: has(findings, "probe_unavailable") ? 0.5 : 0.8,
      confidenceRationale:
        "The supplier cancelled the placed order; the customer is still owed " +
        "the goods, so a replacement supplier order is the next step.",
    }
  }

  if (has(findings, "supplier_order_absent")) {
    const probeLimited = has(findings, "probe_unavailable")
    return {
      recommendation: "retry",
      confidence: probeLimited ? 0.55 : 0.85,
      confidenceRationale: probeLimited
        ? "The order is fully mapped and addressable, but supplier stock could " +
          "not be verified, so a retry may hit an out-of-stock rejection."
        : "Every line item is mapped and the address is shippable; the only " +
          "missing step is placing the supplier order.",
    }
  }

  if (has(findings, "shipment_not_tracked")) {
    return {
      recommendation: "alert",
      confidence: 0.7,
      confidenceRationale:
        "The supplier order exists, so re-placing it would double-ship; a human " +
        "must chase the supplier for tracking.",
    }
  }

  // Anything left is partial knowledge. Per #125, alert beats a confident guess.
  return {
    recommendation: "alert",
    confidence: 0.3,
    confidenceRationale:
      "The picture is incomplete, so this needs a human rather than an action.",
  }
}
