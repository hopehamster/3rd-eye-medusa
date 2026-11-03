/**
 * The triage service: probe -> classify -> recommend -> narrate -> guard.
 *
 * One order in, one recommendation record out. The record is pure data (JSON
 * only: no Date, no client), because it crosses Medusa workflow step boundaries
 * and is persisted on order metadata.
 *
 * This file is also where the recommend-only rule is enforced at runtime:
 * assertRecommendOnly() runs on every record before it is returned.
 */
import { createHash } from "node:crypto"
import type {
  Finding,
  PriorTriage,
  SupplierProbeResult,
  TriageConfig,
  TriageEffect,
  TriageLogger,
  TriageRecord,
  TriageResult,
  TriageSnapshot,
  SupplierProbe,
} from "./types"
import { classify } from "./classify"
import { recommend } from "./recommend"
import { RuleReasoner, type TriageReasoner } from "./reasoner"
import {
  assertRecommendOnly,
  hoursBetween,
  redactAddress,
  withTimeout,
} from "./guardrails"

const DEFAULT_PROBE_TIMEOUT_MS = 15_000

export interface TriageDeps {
  config: TriageConfig
  probe: SupplierProbe
  reasoner?: TriageReasoner
  logger?: TriageLogger
  probeTimeoutMs?: number
}

/**
 * Idempotency key: order + the *set* of finding codes.
 *
 * Deliberately excludes ages and counts. The key answers "is this still the same
 * problem?", so an order does not re-alert every hour just because it got older -
 * but it does re-alert the moment the classification actually changes.
 */
export function triageKey(orderId: string, findings: Finding[]): string {
  const codes = [...new Set(findings.map((finding) => finding.code))]
    .sort()
    .join("|")
  return createHash("sha256")
    .update(`v1|${orderId}|${codes}`)
    .digest("hex")
    .slice(0, 16)
}

/**
 * True when this exact classification was already recorded recently enough that
 * re-recording it would only add noise.
 */
export function shouldSkip(
  prior: PriorTriage | undefined,
  key: string,
  config: TriageConfig
): { skip: boolean; reason?: string } {
  if (!prior || !prior.key) {
    return { skip: false }
  }
  if (prior.key !== key) {
    return { skip: false }
  }
  const ageHours = hoursBetween(prior.at, config.nowIso)
  if (ageHours < config.alertCooldownHours) {
    return {
      skip: true,
      reason:
        `identical classification (${key}) recorded ` +
        `${Math.round(ageHours)}h ago; cooldown is ` +
        `${config.alertCooldownHours}h`,
    }
  }
  return { skip: false }
}

async function runProbe(
  snapshot: TriageSnapshot,
  deps: TriageDeps,
  probeDisabledReason?: string
): Promise<SupplierProbeResult | null> {
  const { config } = deps
  if (!config.probeEnabled) {
    // Not promised, so "not checked" is not a finding.
    return null
  }
  if (probeDisabledReason) {
    return {
      checked: false,
      checkedAt: config.nowIso,
      stockByPid: {},
      failures: {},
      unavailableReason: probeDisabledReason,
    }
  }
  const pids = [
    ...new Set(
      snapshot.items
        .map((item) => item.cjPid)
        .filter((pid): pid is string => Boolean(pid))
    ),
  ]
  const cjOrderId = snapshot.supplier?.cjOrderId
  if (pids.length === 0 && !cjOrderId) {
    return null
  }

  try {
    return await withTimeout(
      deps.probe.check({ pids, cjOrderId }, config.nowIso),
      deps.probeTimeoutMs ?? DEFAULT_PROBE_TIMEOUT_MS,
      "supplier probe"
    )
  } catch (error) {
    const message =
      error instanceof Error ? error.message : String(error)
    deps.logger?.warn(
      `fulfilment triage: probe failed for order ${snapshot.id}: ${message}`
    )
    return {
      checked: false,
      checkedAt: config.nowIso,
      stockByPid: {},
      failures: {},
      unavailableReason: message,
    }
  }
}

/**
 * Triage one order. Never throws for business conditions; the only throw is a
 * GuardrailViolation, which is a programming error and must not be swallowed.
 */
export async function triageOrder(
  snapshot: TriageSnapshot,
  deps: TriageDeps,
  options: { probeDisabledReason?: string } = {}
): Promise<TriageResult> {
  const { config } = deps
  const probe = await runProbe(snapshot, deps, options.probeDisabledReason)
  const findings = classify(snapshot, probe, config)
  const decision = recommend(findings, config, {
    orderId: snapshot.id,
    createdAt: snapshot.createdAt,
  })

  const reasoner = deps.reasoner ?? new RuleReasoner()
  let summary = ""
  let checklist: string[] = []
  try {
    const reasoning = await reasoner.explain({
      orderId: snapshot.id,
      displayId: snapshot.displayId,
      recommendation: decision.recommendation,
      confidence: decision.confidence,
      findings,
      context: {
        itemCount: snapshot.items.reduce(
          (total, item) => total + (item.quantity || 0),
          0
        ),
        shippingRegion: redactAddress(snapshot.shippingAddress),
      },
    })
    summary = reasoning.summary
    checklist = reasoning.checklist
  } catch (error) {
    // Narration is optional; the recommendation is not.
    deps.logger?.warn(
      `fulfilment triage: reasoner failed for order ${snapshot.id}: ${
        error instanceof Error ? error.message : String(error)
      }`
    )
    summary = `Order ${snapshot.displayId ?? snapshot.id}: ${decision.confidenceRationale}`
    checklist = []
  }

  const key = triageKey(snapshot.id, findings)
  const effects: TriageEffect[] = ["record_recommendation"]
  if (decision.recommendation !== "none") {
    effects.push("emit_alert")
  }

  const record: TriageRecord = {
    orderId: snapshot.id,
    displayId: snapshot.displayId,
    key,
    recommendation: decision.recommendation,
    confidence: decision.confidence,
    confidenceRationale: decision.confidenceRationale,
    findings,
    summary: summary.slice(0, 400),
    checklist,
    effects,
    executed: false,
    reasoner: reasoner.id,
    probe: probe?.unavailableReason
      ? `${deps.probe.id}:unavailable`
      : deps.probe.id,
    createdAt: config.nowIso,
  }

  assertRecommendOnly(record)

  const skip = shouldSkip(snapshot.priorTriage, key, config)
  if (skip.skip) {
    deps.logger?.info(
      `fulfilment triage: order ${snapshot.id} unchanged - ${skip.reason}`
    )
  }

  return { record, skipped: skip.skip, skipReason: skip.reason }
}

export interface TriageBatchResult {
  results: TriageResult[]
  scanned: number
  truncated: boolean
  probeCalls: number
}

/**
 * Triage a batch under two explicit budgets: orders per run, and supplier probe
 * calls per run. When the probe budget is spent the remaining orders are still
 * triaged - they just record "supplier state could not be checked" rather than
 * silently claiming the supplier was fine.
 */
export async function triageBatch(
  snapshots: TriageSnapshot[],
  deps: TriageDeps
): Promise<TriageBatchResult> {
  const limited = snapshots.slice(0, deps.config.maxOrdersPerRun)
  const truncated = snapshots.length > limited.length
  const results: TriageResult[] = []
  let probeCalls = 0

  for (const snapshot of limited) {
    const budgetLeft = probeCalls < deps.config.maxProbeCalls
    const result = await triageOrder(
      snapshot,
      deps,
      budgetLeft
        ? {}
        : {
            probeDisabledReason:
              `probe budget of ${deps.config.maxProbeCalls} calls for this run ` +
              "was exhausted, so supplier state was not checked for this order",
          }
    )
    if (deps.config.probeEnabled && budgetLeft) {
      probeCalls += 1
    }
    results.push(result)
  }

  return {
    results,
    scanned: limited.length,
    truncated,
    probeCalls,
  }
}
