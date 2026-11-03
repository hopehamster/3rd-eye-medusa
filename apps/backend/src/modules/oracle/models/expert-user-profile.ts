import { model } from "@medusajs/framework/utils"

/**
 * Per-user, per-expert memory profile. The expert "remembers" the customer
 * across consultations by reading this before each session and updating it
 * after. Profile is a JSON blob — preferences, facts, past topics, anything
 * the expert learned that's worth keeping.
 *
 * The customer can see and remove their profile (transparency):
 * GET /store/oracle/profile and DELETE /store/oracle/profile. Nothing here is
 * shared across users or across experts.
 *
 * Do NOT declare updatedAt/createdAt here. Medusa manages those columns
 * itself; declaring `updatedAt: model.dateTime()` overrides that and makes
 * every create fail with "Value for ExpertUserProfile.updatedAt is required,
 * 'undefined' found" — which is exactly why this table stayed empty while
 * every call site swallowed the error.
 */
export const ExpertUserProfile = model.define("expert_user_profile", {
  id: model.id().primaryKey(),
  customerId: model.text(),
  expertId: model.text(),
  profile: model.json().default({}),
})

export default ExpertUserProfile
