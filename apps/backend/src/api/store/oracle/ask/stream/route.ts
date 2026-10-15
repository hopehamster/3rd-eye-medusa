import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { ORACLE_MODULE } from "../../../../../modules/oracle"
import type OracleModuleService from "../../../../../modules/oracle/service"
import {
  classifyQuestion,
  streamGuidanceAnswer,
  streamKnowledgeAnswer,
  selectPicks,
  extractMemorableFacts,
} from "../../../../../modules/oracle/deepseek"
import { retrieveProducts } from "../../../../../workflows/oracle-consultation"
import { retrieveCanon } from "../../../../../modules/oracle/canon"
import { EXPERT_PERSONAS } from "../../../../../modules/oracle/experts"

const ORACLE_RESTING =
  "The Oracle is resting at the moment — please try again soon."

const VALID_EXPERTS = new Set(Object.keys(EXPERT_PERSONAS))

type StreamEvent =
  | { type: "token"; text: string }
  | { type: "picks"; picks: { product_id: string; why_it_fits: string }[] }
  | { type: "products"; products: unknown[] }
  | { type: "done"; logId: string | null }
  | { type: "error"; error: string }

/**
 * POST /store/oracle/ask/stream
 * Server-sent events: token (answer chunks) -> picks/products -> done.
 * Body: { question, sessionId?, expertId? }
 * Customer identity comes from the auth session — never the request body.
 */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const body = (req.body ?? {}) as {
    question?: unknown
    sessionId?: unknown
    expertId?: unknown
  }
  const { question, sessionId, expertId } = body
  const cleanCustomer = (req as { auth_context?: { actor_id?: string } })
    .auth_context?.actor_id

  const cleanExpert =
    typeof expertId === "string" && VALID_EXPERTS.has(expertId)
      ? expertId
      : "general"
  const cleanSession = typeof sessionId === "string" ? sessionId : undefined

  if (
    typeof question !== "string" ||
    question.trim().length < 3 ||
    question.length > 500
  ) {
    res.status(400).json({
      error: "Ask the Oracle a real question (3–500 characters).",
    })
    return
  }

  if (!process.env.DEEPSEEK_API_KEY) {
    res.status(503).json({ error: ORACLE_RESTING })
    return
  }

  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no",
  })

  const send = (event: StreamEvent) => {
    res.write(`data: ${JSON.stringify(event)}\n\n`)
  }
  const fail = (message: string) => {
    try {
      send({ type: "error", error: message })
    } catch {
      // client already gone
    }
    res.end()
  }

  const logger = (() => {
    try {
      return req.scope.resolve(ContainerRegistrationKeys.LOGGER)
    } catch {
      return null
    }
  })() as { error: (m: string) => void; warn: (m: string) => void } | null

  try {
    const oracle = req.scope.resolve(ORACLE_MODULE) as OracleModuleService

    // Kick off independent I/O immediately. History and the user profile do
    // not depend on classification, so they run concurrently with the
    // classifier LLM call instead of blocking before it.
    const historyPromise =
      cleanSession && cleanExpert !== "general"
        ? oracle
            .listRecentMessages(cleanSession, cleanExpert, 10)
            .catch((): { role: string; content: string }[] => [])
        : Promise.resolve([] as { role: string; content: string }[])
    const profilePromise =
      cleanCustomer && cleanExpert !== "general"
        ? oracle
            .getUserProfile(cleanCustomer, cleanExpert)
            .catch((): Record<string, unknown> => ({}))
        : Promise.resolve({} as Record<string, unknown>)

    // History first — classification uses it for follow-up context
    const history = await historyPromise
    const [{ intents, mode }, userProfile] = await Promise.all([
      classifyQuestion(question.trim(), history),
      profilePromise,
    ])
    const cleanIntents = await oracle.sanitizeIntents(intents)

    // Products and canon retrieval are independent of each other — run
    // them concurrently so the slower one doesn't block the faster.
    const [products, canonDocs] = await Promise.all([
      retrieveProducts(req.scope, cleanIntents, mode, question.trim()),
      retrieveCanon(cleanIntents),
    ])
    send({ type: "products", products })

    const excerpts = canonDocs.map((d) => `### ${d.title}\n${d.excerpt}`)

    const composeParams = {
      question: question.trim(),
      intents: cleanIntents,
      canonExcerpts: excerpts,
      products,
      expertId: cleanExpert,
      userProfile,
      history,
    }

    // Stream the answer; select product picks concurrently
    const picksPromise =
      mode === "guidance" ? selectPicks(composeParams) : Promise.resolve([])
    const answer =
      mode === "knowledge"
        ? await streamKnowledgeAnswer(composeParams, (text) =>
            send({ type: "token", text })
          )
        : await streamGuidanceAnswer(composeParams, (text) =>
            send({ type: "token", text })
          )
    const picks = await picksPromise
    send({ type: "picks", picks })

    // Persist: messages, log, long-term memory (all best-effort)
    let logId: string | null = null
    try {
      if (cleanSession && cleanExpert !== "general" && answer) {
        await oracle.saveMessage(cleanSession, cleanExpert, "user", question.trim())
        await oracle.saveMessage(cleanSession, cleanExpert, "expert", answer)
      }
      const created = await oracle.createOracleLogs({
        question: question.trim(),
        intents: cleanIntents,
        mode,
        productIds: picks.map((p) => p.product_id),
        needsCanon: mode === "knowledge" && canonDocs.length === 0,
        sessionId: cleanSession ?? null,
        expertId: cleanExpert,
      })
      logId = created?.id ?? null
    } catch {
      // logging must never break the stream
    }

    // Background long-term memory for signed-in users (fire-and-forget)
    if (cleanCustomer && cleanExpert !== "general" && answer) {
      void (async () => {
        try {
          const current = await oracle.getUserProfile(
            cleanCustomer,
            cleanExpert
          )
          const facts = await extractMemorableFacts({
            question: question.trim(),
            answer,
            expertId: cleanExpert,
            currentProfile: current,
          })
          if (Object.keys(facts).length > 0) {
            await oracle.updateUserProfile(cleanCustomer, cleanExpert, facts)
          }
        } catch {
          // memory is best-effort
        }
      })()
    }

    send({ type: "done", logId })
    res.end()
  } catch (e) {
    logger?.error(`[oracle] stream failed: ${(e as Error).message}`)
    fail("The Oracle couldn't quite hear you — try asking again.")
  }
}
