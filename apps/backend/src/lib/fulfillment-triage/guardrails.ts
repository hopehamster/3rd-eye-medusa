/**
 * Guardrails for fulfilment exception triage.
 *
 * The repo's rule (issue #125) is that money actions are recommend-only. This
 * file is where that stops being a promise and becomes something the compiler
 * and the test suite can check:
 *
 *   - TriageRecord.executed is the literal type `false`, so a record that
 *     claims to have done something cannot even be constructed.
 *   - effects is a closed set. `place_supplier_order`, `refund`, `charge` are
 *     not members, so assertRecommendOnly() throws if a future edit widens it.
 *   - assertRecommendOnly() runs on every record on the production path
 *     (lib/fulfillment-triage/triage.ts), not only in tests.
 */
import type {
  Recommendation,
  TriageEffect,
  TriageRecord,
} from "./types"

export class GuardrailViolation extends Error {
  constructor(message: string) {
    super(message)
    this.name = "GuardrailViolation"
  }
}

export const ALLOWED_RECOMMENDATIONS: readonly Recommendation[] = [
  "retry",
  "refund",
  "alert",
  "none",
]

/**
 * Effects a triage run is permitted to claim. Adding anything that spends money,
 * moves stock, contacts a customer, or changes a payment belongs in a separate,
 * explicitly approved scope - see the doc's guardrails section.
 */
export const ALLOWED_EFFECTS: readonly TriageEffect[] = [
  "record_recommendation",
  "emit_alert",
]

/**
 * Throws unless the record is provably side-effect free.
 * Called on every produced record, so a regression fails loudly at runtime.
 */
export function assertRecommendOnly(record: TriageRecord): void {
  if (record.executed !== false) {
    throw new GuardrailViolation(
      `triage record for order ${record.orderId} claims execution; triage is recommend-only`
    )
  }
  if (!ALLOWED_RECOMMENDATIONS.includes(record.recommendation)) {
    throw new GuardrailViolation(
      `triage record for order ${record.orderId} has unknown recommendation "${String(
        record.recommendation
      )}"`
    )
  }
  const effects = record.effects ?? []
  if (effects.length === 0) {
    throw new GuardrailViolation(
      `triage record for order ${record.orderId} declares no effects; a recommendation must at least be recorded`
    )
  }
  for (const effect of effects) {
    if (!ALLOWED_EFFECTS.includes(effect)) {
      throw new GuardrailViolation(
        `triage record for order ${record.orderId} declares forbidden effect "${String(
          effect
        )}"`
      )
    }
  }
}

/** Hours from `fromIso` to `toIso`. Invalid input yields 0 (conservative: no age-based finding fires). */
export function hoursBetween(fromIso: string, toIso: string): number {
  const from = Date.parse(fromIso)
  const to = Date.parse(toIso)
  if (!Number.isFinite(from) || !Number.isFinite(to)) {
    return 0
  }
  return Math.max(0, (to - from) / 3_600_000)
}

/**
 * Mask an email for logs and evidence: `jane@example.com` -> `j***@example.com`.
 * The domain is kept so a reviewer can still spot a typo'd domain (the most
 * common cause of undeliverable receipts) without exposing the mailbox.
 */
export function redactEmail(email?: string): string {
  const value = (email ?? "").trim()
  if (!value) {
    return "none"
  }
  const at = value.lastIndexOf("@")
  if (at <= 0) {
    return "***"
  }
  return `${value[0]}***@${value.slice(at + 1)}`
}

/** `Las Vegas, NV, US` - enough to sanity-check an address, no street line. */
export function redactAddress(
  address?: { city?: string; province?: string; countryCode?: string }
): string {
  const parts = [address?.city, address?.province, address?.countryCode]
    .map((p) => (p ?? "").trim())
    .filter(Boolean)
  return parts.length > 0 ? parts.join(", ") : "unknown"
}

/**
 * Reject a promise that takes too long, so one wedged supplier request cannot
 * hold a scheduled run open. The underlying promise keeps running (there is no
 * cancellation in the promise contract) but its result is ignored.
 */
export function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  label: string
): Promise<T> {
  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) {
    return promise
  }
  return new Promise<T>((resolve, reject) => {
    let settled = false
    const timer = setTimeout(() => {
      if (settled) {
        return
      }
      settled = true
      reject(new Error(`${label} timed out after ${timeoutMs}ms`))
    }, timeoutMs)

    promise.then(
      (value) => {
        if (settled) {
          return
        }
        settled = true
        clearTimeout(timer)
        resolve(value)
      },
      (error) => {
        if (settled) {
          return
        }
        settled = true
        clearTimeout(timer)
        reject(error)
      }
    )
  })
}
