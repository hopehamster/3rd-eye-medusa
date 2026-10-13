import { model } from "@medusajs/framework/utils"

/**
 * Per-user, per-expert memory profile. The expert "remembers" the customer
 * across consultations by reading this before each session and updating it
 * after. Profile is a JSON blob — preferences, facts, past topics, anything
 * the expert learned that's worth keeping.
 *
 * The customer can see and edit their profile (transparency). Nothing here
 * is shared across users or across experts.
 */
export const ExpertUserProfile = model.define("expert_user_profile", {
  id: model.id().primaryKey(),
  customerId: model.text(),
  expertId: model.text(),
  profile: model.json().default({}),
  updatedAt: model.dateTime(),
})

export default ExpertUserProfile
