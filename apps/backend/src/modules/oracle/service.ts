import { MedusaService } from "@medusajs/framework/utils"
import OracleLog from "./models/oracle-log"
import OracleMessage from "./models/oracle-message"
import ExpertUserProfile from "./models/expert-user-profile"
import { ORACLE_INTENT_IDS, getIntent, intentTag } from "./taxonomy"

class OracleModuleService extends MedusaService({
  OracleLog,
  OracleMessage,
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
   * Recent conversation turns for a session + expert, oldest first.
   * Bounded — the expert reads these before answering.
   */
  async listRecentMessages(
    sessionId: string,
    expertId: string,
    limit = 10
  ): Promise<{ role: string; content: string }[]> {
    const messages = await this.listOracleMessages(
      { sessionId, expertId },
      { take: limit, order: { created_at: "DESC" } }
    )
    return (messages ?? [])
      .reverse()
      .map((m) => ({ role: m.role, content: m.content }))
  }

  /** Persist one conversation turn. Best-effort — never throws. */
  async saveMessage(
    sessionId: string,
    expertId: string,
    role: "user" | "expert",
    content: string
  ): Promise<void> {
    try {
      await this.createOracleMessages({
        sessionId,
        expertId,
        role,
        content: content.slice(0, 8000),
      })
    } catch {
      // History is a nice-to-have — never break the consultation
    }
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
      customerId,
      expertId,
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
      customerId,
      expertId,
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
        customerId,
        expertId,
        profile: merged,
      })
    }
  }
}

export default OracleModuleService
