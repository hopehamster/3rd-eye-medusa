/**
 * Triage configuration, read from the environment.
 *
 * No secrets here: credentials for the supplier stay in CJ_API_KEY / CJ_EMAIL,
 * which this module never reads. Every knob has a conservative default, so an
 * unconfigured deployment still runs in its safest shape.
 */
import type { TriageConfig } from "./types"

const positiveInt = (raw: string | undefined, fallback: number): number => {
  const parsed = Number(raw)
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback
  }
  return Math.floor(parsed)
}

export const DEFAULT_TRIAGE_CONFIG = {
  graceHours: 24,
  staleHours: 168,
  outOfStockRefundHours: 72,
  alertCooldownHours: 12,
  maxOrdersPerRun: 50,
  maxProbeCalls: 50,
  paidStatuses: [
    "captured",
    "partially_captured",
    "authorized",
    "partially_authorized",
  ],
} as const

export interface TriageEnv {
  [key: string]: string | undefined
}

/**
 * Read config from env. `nowIso` is injectable for tests; production callers
 * pass nothing and get the real clock.
 */
export function readTriageConfig(
  env: TriageEnv = process.env,
  nowIso: string = new Date().toISOString()
): TriageConfig {
  const paidStatuses = (env.FULFILLMENT_TRIAGE_PAID_STATUSES ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)

  return {
    nowIso,
    graceHours: positiveInt(
      env.FULFILLMENT_TRIAGE_GRACE_HOURS,
      DEFAULT_TRIAGE_CONFIG.graceHours
    ),
    staleHours: positiveInt(
      env.FULFILLMENT_TRIAGE_STALE_HOURS,
      DEFAULT_TRIAGE_CONFIG.staleHours
    ),
    outOfStockRefundHours: positiveInt(
      env.FULFILLMENT_TRIAGE_OUT_OF_STOCK_REFUND_HOURS,
      DEFAULT_TRIAGE_CONFIG.outOfStockRefundHours
    ),
    alertCooldownHours: positiveInt(
      env.FULFILLMENT_TRIAGE_ALERT_COOLDOWN_HOURS,
      DEFAULT_TRIAGE_CONFIG.alertCooldownHours
    ),
    maxOrdersPerRun: positiveInt(
      env.FULFILLMENT_TRIAGE_MAX_ORDERS,
      DEFAULT_TRIAGE_CONFIG.maxOrdersPerRun
    ),
    maxProbeCalls: positiveInt(
      env.FULFILLMENT_TRIAGE_MAX_PROBE_CALLS,
      DEFAULT_TRIAGE_CONFIG.maxProbeCalls
    ),
    paidStatuses:
      paidStatuses.length > 0
        ? paidStatuses
        : [...DEFAULT_TRIAGE_CONFIG.paidStatuses],
    // Opt-in, not opt-out: the probe makes live supplier calls. Default is off
    // so a misconfigured deployment never hammers the supplier API.
    probeEnabled: (env.FULFILLMENT_TRIAGE_PROBE ?? "").toLowerCase() === "cj",
  }
}
