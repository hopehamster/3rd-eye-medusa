/**
 * Supplier probes.
 *
 * `NullSupplierProbe` is the default: it reports "not investigated". Absence of
 * evidence is not evidence, so classification then simply does not produce
 * stock or supplier-order findings.
 *
 * `CjSupplierProbe` reads real supplier state through two read-only CJ calls:
 * stock per product (`getInventoryByPid`, keyed by pid) and order status plus
 * tracking (`getOrderDetail`). Both are GETs - the probe cannot place, cancel,
 * or pay for anything. It is opt-in via FULFILLMENT_TRIAGE_PROBE=cj because it
 * spends the supplier's rate limit.
 */
import type {
  SupplierProbe,
  SupplierProbeRequest,
  SupplierProbeResult,
  SupplierStock,
  TriageLogger,
} from "./types"
import { withTimeout } from "./guardrails"

/** Never probe more distinct products than this in one order (bounds API calls). */
const MAX_PIDS_PER_ORDER = 10

export class NullSupplierProbe implements SupplierProbe {
  readonly id = "none"

  async check(
    _request: SupplierProbeRequest,
    nowIso: string
  ): Promise<SupplierProbeResult> {
    return {
      checked: false,
      checkedAt: nowIso,
      stockByPid: {},
      failures: {},
    }
  }
}

export interface CjInventoryEntryLike {
  countryCode?: string
  totalInventoryNum?: number
  cjInventoryNum?: number
}

/** The slice of CJClient the probe needs. Structural, so tests need no network. */
export interface CjProbeClient {
  getInventory: (pid: string) => Promise<CjInventoryEntryLike[]>
  getOrderDetail: (orderId: string) => Promise<{
    trackingNumber?: string
    logisticName?: string
    orderStatus?: string
  }>
}

/**
 * Sum supplier warehouses into `us` and everything else.
 *
 * `totalInventoryNum` is what CJ reports per warehouse row. A missing or
 * non-numeric count contributes nothing rather than inventing stock.
 */
export function summarizeStock(entries: CjInventoryEntryLike[]): SupplierStock {
  let us = 0
  let other = 0
  for (const entry of entries ?? []) {
    const count = Number(entry?.totalInventoryNum ?? 0)
    if (!Number.isFinite(count) || count <= 0) {
      continue
    }
    if ((entry?.countryCode ?? "").trim().toUpperCase() === "US") {
      us += count
    } else {
      other += count
    }
  }
  return { us, other }
}

const errorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : String(error)

export class CjSupplierProbe implements SupplierProbe {
  readonly id = "cj-open-api"
  protected readonly client: CjProbeClient
  protected readonly timeoutMs: number
  protected readonly logger?: TriageLogger

  constructor(
    client: CjProbeClient,
    options: { timeoutMs?: number; logger?: TriageLogger } = {}
  ) {
    this.client = client
    this.timeoutMs = options.timeoutMs ?? 8000
    this.logger = options.logger
  }

  async check(
    request: SupplierProbeRequest,
    nowIso: string
  ): Promise<SupplierProbeResult> {
    const result: SupplierProbeResult = {
      checked: true,
      checkedAt: nowIso,
      stockByPid: {},
      failures: {},
    }

    const pids = [...new Set((request.pids ?? []).filter(Boolean))].slice(
      0,
      MAX_PIDS_PER_ORDER
    )
    for (const pid of pids) {
      try {
        const entries = await withTimeout(
          this.client.getInventory(pid),
          this.timeoutMs,
          `CJ inventory ${pid}`
        )
        result.stockByPid[pid] = summarizeStock(entries)
      } catch (error) {
        result.failures[`stock:${pid}`] = errorMessage(error)
      }
    }

    if (request.cjOrderId) {
      try {
        const detail = await withTimeout(
          this.client.getOrderDetail(request.cjOrderId),
          this.timeoutMs,
          `CJ order ${request.cjOrderId}`
        )
        result.order = {
          status: detail?.orderStatus,
          trackingNumber: detail?.trackingNumber,
          logisticName: detail?.logisticName,
        }
      } catch (error) {
        result.failures[`order:${request.cjOrderId}`] = errorMessage(error)
      }
    }

    if (Object.keys(result.failures).length > 0) {
      this.logger?.warn(
        `fulfilment triage: supplier probe had ${Object.keys(result.failures).length} failure(s)`
      )
    }
    return result
  }
}
