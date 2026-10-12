import { MedusaService } from "@medusajs/framework/utils"
import OracleLog from "./models/oracle-log"
import ExpertUserProfile from "./models/expert-user-profile"
import { ORACLE_INTENT_IDS, getIntent, intentTag } from "./taxonomy"

class OracleModuleService extends MedusaService({
  OracleLog,
  ExpertUserProfile,
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

  /**
   * Get a customer's memory profile for an expert. Returns empty object
   * if they've never talked to this expert before.
   */
  async getUserProfile(
    customerId: string,
    expertId: string
  ): Promise<Record<string, unknown>> {
    const profiles = await this.listExpertUserProfiles({
      customer_id: customerId,
      expert_id: expertId,
    })
    const profile = profiles?.[0]
    return (profile?.profile as Record<string, unknown>) ?? {}
  }

  /**
   * Merge new facts into a customer's profile for an expert.
   * Creates the profile if it doesn't exist yet.
   */
  async updateUserProfile(
    customerId: string,
    expertId: string,
    updates: Record<string, unknown>
  ): Promise<void> {
    const existing = await this.listExpertUserProfiles({
      customer_id: customerId,
      expert_id: expertId,
    })
    const current = (existing?.[0]?.profile as Record<string, unknown>) ?? {}
    const merged = { ...current, ...updates, updated_at: new Date().toISOString() }

    if (existing?.[0]) {
      await this.updateExpertUserProfiles({
        id: existing[0].id,
        profile: merged,
      })
    } else {
      await this.createExpertUserProfiles({
        customer_id: customerId,
        expert_id: expertId,
        profile: merged,
      })
    }
  }
}

export default OracleModuleService
