/**
 * The reasoner seam: turns findings into the sentence a human reads.
 *
 * `RuleReasoner` is the default and has no dependencies - deterministic text,
 * so a queue never shows two different stories for the same evidence.
 *
 * `LlmReasoner` is opt-in (FULFILLMENT_TRIAGE_REASONER=llm). It is used ONLY
 * for narration: the recommendation was already decided by the rule table, and
 * the model is not allowed to change it. Every failure mode - timeout, bad
 * JSON, wrong shape, over-long text, a model that tries to invent an action -
 * falls back to the rule text. The recommendation is unaffected either way.
 */
import type { Finding, Recommendation, Severity } from "./types"
import { withTimeout } from "./guardrails"

export interface ReasonerInput {
  orderId: string
  displayId?: string | number
  recommendation: Recommendation
  confidence: number
  findings: Finding[]
  /** Non-PII summary produced by guardrails.redactAddress / redactEmail. */
  context: { itemCount: number; shippingRegion: string }
}

export interface TriageReasoning {
  summary: string
  checklist: string[]
}

export interface TriageReasoner {
  id: string
  explain(input: ReasonerInput): Promise<TriageReasoning>
}

const severityRank: Record<Severity, number> = {
  critical: 0,
  warning: 1,
  info: 2,
}

const bySeverity = (findings: Finding[]): Finding[] =>
  [...findings].sort((a, b) => severityRank[a.severity] - severityRank[b.severity])

const CHECKLISTS: Record<Recommendation, string[]> = {
  retry: [
    "Confirm the order still has no CJ order id in its metadata.",
    "Run the existing ops script: npx medusa exec ./src/scripts/cj-fulfill-order.ts <order_id>",
    "With CJ_DRY_RUN unset/false, check the printed payload before it reaches the supplier.",
    "Record the resulting CJ order id so the next triage sees it.",
  ],
  refund: [
    "Check the supplier listing for a restock date before refunding.",
    "If a restock is close, ask the customer whether they will wait instead.",
    "A refund is a money action: issue it in the payment dashboard, not from this tool.",
    "Add a note to the order explaining what the customer was told.",
  ],
  alert: [
    "Open the order in admin and read the listed findings.",
    "Fix the blocking data (variant cj_vid or customer address) before retrying.",
    "If the fix needs the customer, send one clear message rather than several.",
  ],
  none: [],
}

export class RuleReasoner implements TriageReasoner {
  readonly id = "rule-v1"

  async explain(input: ReasonerInput): Promise<TriageReasoning> {
    const ordered = bySeverity(input.findings)
    const primary = ordered[0]
    const label =
      input.displayId !== undefined ? `Order #${input.displayId}` : `Order ${input.orderId}`

    if (!primary || input.recommendation === "none") {
      return {
        summary: `${label}: nothing to recover.`,
        checklist: [],
      }
    }

    const extras = ordered
      .slice(1)
      .map((finding) => finding.code)
      .filter((code, index, all) => all.indexOf(code) === index)

    const summary =
      `${label}: ${primary.detail} Recommendation: ${input.recommendation} ` +
      `(confidence ${input.confidence.toFixed(2)}).` +
      (extras.length > 0 ? ` Also seen: ${extras.join(", ")}.` : "")

    return {
      summary: summary.slice(0, 400),
      checklist: CHECKLISTS[input.recommendation],
    }
  }
}

export type ChatFn = (
  messages: { role: "system" | "user"; content: string }[],
  options: { json?: boolean; maxTokens?: number }
) => Promise<string>

export const REASONER_SYSTEM_PROMPT = [
  "You are the narration step of a fulfilment exception triage tool for a small dropshipping store.",
  "A rule table has already chosen the recommendation. You may NOT change it, and you may not propose an action other than reading, checking, or fixing data.",
  "Never suggest refunding, charging, or placing a supplier order that the tool should do itself - a human performs those.",
  "Never invent order ids, tracking numbers, supplier replies, or customer details.",
  "Reply with JSON only: {\"summary\": string (<= 400 chars, plain sentences), \"checklist\": string[] (0-5 short imperative steps for the human)}.",
  "Write for a busy operator: say what is wrong, what it costs, and the next single step.",
].join("\n")

const MAX_SUMMARY = 400
const MAX_CHECKLIST_ITEMS = 5
const MAX_CHECKLIST_ITEM = 160

/**
 * Validate model output. Anything outside the contract is rejected so the
 * caller falls back - a malformed narration must never reach the queue.
 */
export function parseReasoning(raw: string): TriageReasoning | null {
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return null
  }
  if (typeof parsed !== "object" || parsed === null) {
    return null
  }
  const { summary, checklist } = parsed as {
    summary?: unknown
    checklist?: unknown
  }
  if (typeof summary !== "string" || summary.trim().length === 0) {
    return null
  }
  const items = Array.isArray(checklist) ? checklist : []
  const cleanItems: string[] = []
  for (const item of items) {
    if (typeof item !== "string") {
      return null
    }
    const text = item.trim()
    if (!text) {
      continue
    }
    cleanItems.push(text.slice(0, MAX_CHECKLIST_ITEM))
    if (cleanItems.length >= MAX_CHECKLIST_ITEMS) {
      break
    }
  }
  return { summary: summary.trim().slice(0, MAX_SUMMARY), checklist: cleanItems }
}

export class LlmReasoner implements TriageReasoner {
  readonly id: string
  protected readonly chat: ChatFn
  protected readonly fallback: TriageReasoner
  protected readonly timeoutMs: number

  constructor(
    chat: ChatFn,
    fallback: TriageReasoner = new RuleReasoner(),
    options: { timeoutMs?: number; modelTag?: string } = {}
  ) {
    this.chat = chat
    this.fallback = fallback
    this.timeoutMs = options.timeoutMs ?? 8000
    this.id = `llm(${options.modelTag ?? "default"})+${fallback.id}`
  }

  async explain(input: ReasonerInput): Promise<TriageReasoning> {
    const fallback = await this.fallback.explain(input)
    try {
      const raw = await withTimeout(
        this.chat(
          [
            { role: "system", content: REASONER_SYSTEM_PROMPT },
            { role: "user", content: buildReasonerPrompt(input) },
          ],
          { json: true, maxTokens: 600 }
        ),
        this.timeoutMs,
        "fulfilment triage reasoner"
      )
      const parsed = parseReasoning(raw)
      if (!parsed) {
        return fallback
      }
      return {
        summary: parsed.summary,
        checklist:
          parsed.checklist.length > 0 ? parsed.checklist : fallback.checklist,
      }
    } catch {
      // Timeout, network failure, provider error: narration is optional.
      return fallback
    }
  }
}

/** The prompt carries findings and counts only - no name, email, or street. */
export function buildReasonerPrompt(input: ReasonerInput): string {
  const findings = bySeverity(input.findings).map((finding) => ({
    code: finding.code,
    severity: finding.severity,
    detail: finding.detail,
    evidence: finding.evidence,
  }))
  return JSON.stringify({
    order_reference: input.displayId ?? input.orderId,
    recommendation: input.recommendation,
    confidence: input.confidence,
    line_items: input.context.itemCount,
    shipping_region: input.context.shippingRegion,
    findings,
    instruction:
      "Explain the situation in one or two sentences and give the operator a short checklist. " +
      "Do not propose that the tool places orders, refunds, or charges anything.",
  })
}
