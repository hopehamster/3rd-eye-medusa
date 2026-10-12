import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { oracleConsultationWorkflow } from "../../../../workflows/oracle-consultation"

const ORACLE_RESTING =
  "The Oracle is resting at the moment — please try again soon."
const ORACLE_MISHEARD =
  "The Oracle couldn't quite hear you — try asking again."

/**
 * POST /store/oracle/ask
 * Body: { question: string, sessionId?: string, expertId?: string }
 */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const body = (req.body ?? {}) as {
    question?: unknown
    sessionId?: unknown
    expertId?: unknown
  }
  const { question, sessionId, expertId } = body

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

  try {
    const { result } = await oracleConsultationWorkflow(req.scope).run({
      input: {
        question: question.trim(),
        sessionId: typeof sessionId === "string" ? sessionId : undefined,
        expertId: typeof expertId === "string" ? expertId : undefined,
      },
    })
    res.json(result)
  } catch (e) {
    try {
      const logger = req.scope.resolve(ContainerRegistrationKeys.LOGGER)
      logger.error(`[oracle] consultation failed: ${(e as Error).message}`)
    } catch {
      // logger unavailable — nothing to do
    }
    res.status(500).json({ error: ORACLE_MISHEARD })
  }
}
