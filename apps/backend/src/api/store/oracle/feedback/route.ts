import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { ORACLE_MODULE } from "../../../../modules/oracle"
import type OracleModuleService from "../../../../modules/oracle/service"

/**
 * POST /store/oracle/feedback
 * Body: { logId: string, helpful: boolean }
 * Records thumbs up/down on an Oracle answer. Never fails the request
 * loudly — feedback is best-effort.
 */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const body = (req.body ?? {}) as { logId?: unknown; helpful?: unknown }
  const { logId, helpful } = body

  if (typeof logId !== "string" || typeof helpful !== "boolean") {
    res.status(400).json({ error: "logId and helpful are required." })
    return
  }

  try {
    const oracle = req.scope.resolve(ORACLE_MODULE) as OracleModuleService
    await oracle.updateOracleLogs({ id: logId, helpful })
    res.json({ ok: true })
  } catch (e) {
    const logger = req.scope.resolve(ContainerRegistrationKeys.LOGGER)
    logger.error(`[oracle] feedback failed: ${(e as Error).message}`)
    res.status(500).json({ error: "Could not record feedback." })
  }
}
