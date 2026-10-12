import { MedusaService } from "@medusajs/framework/utils"
import OracleLog from "./models/oracle-log"
import { ORACLE_INTENT_IDS, getIntent, intentTag } from "./taxonomy"

class OracleModuleService extends MedusaService({
  OracleLog,
}) {
  /**
   * Validate a classifier's intent ids against the taxonomy.
   * The LLM may never invent intents — unknown ids are dropped.
   */
  async sanitizeIntents(ids: unknown): Promise<string[]> {
    if (!Array.isArray(ids)) {
      return []
    }
    return ids.filter(
      (id): id is string =>
        typeof id === "string" && ORACLE_INTENT_IDS.includes(id)
    )
  }

  /** Product tag values for a set of intent ids, e.g. ["intent:protection"]. */
  async tagsForIntents(ids: string[]): Promise<string[]> {
    const clean = await this.sanitizeIntents(ids)
    return clean.map(intentTag)
  }

  async describeIntent(id: string): Promise<string> {
    return getIntent(id)?.description ?? id
  }
}

export default OracleModuleService
