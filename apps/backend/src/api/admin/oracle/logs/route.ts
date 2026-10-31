import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { ORACLE_MODULE } from "../../../../modules/oracle"
import type OracleModuleService from "../../../../modules/oracle/service"

/**
 * GET /admin/oracle/logs
 * Query: limit (default 20), offset (default 0), needs_canon (true/false)
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const limit = Math.min(
    parseInt((req.query.limit as string) || "20", 10) || 20,
    100
  )
  const offset = parseInt((req.query.offset as string) || "0", 10) || 0
  const filters: Record<string, unknown> = {}
  if (req.query.needs_canon === "true") {
    filters.needsCanon = true
  }

  try {
    const oracle = req.scope.resolve(ORACLE_MODULE) as unknown as OracleModuleService
    const [logs, count] = await oracle.listAndCountOracleLogs(filters, {
      take: limit,
      skip: offset,
      order: { created_at: "DESC" },
    })
    res.json({ logs, count, limit, offset })
  } catch (e) {
    const logger = req.scope.resolve(ContainerRegistrationKeys.LOGGER)
    logger.error(`[oracle] admin logs failed: ${(e as Error).message}`)
    res.status(500).json({ error: "Could not load Oracle consultations." })
  }
}
