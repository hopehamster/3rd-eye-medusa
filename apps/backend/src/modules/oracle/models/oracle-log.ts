import { model } from "@medusajs/framework/utils"

/**
 * One Oracle consultation: what was asked, how it was classified,
 * what was shown, and how it landed. Powers the admin feedback loop
 * and the "needs canon" content queue.
 */
export const OracleLog = model.define("oracle_log", {
  id: model.id().primaryKey(),
  question: model.text(),
  intents: model.array().nullable(),
  mode: model.text().default("guidance"), // guidance | knowledge
  productIds: model.array().nullable(),
  helpful: model.boolean().nullable(), // thumbs up/down, null = no feedback yet
  needsCanon: model.boolean().default(false),
  sessionId: model.text().nullable(),
  customerId: model.text().nullable(),
  expertId: model.text().nullable(), // crystal | tarot | numerology | general
})

export default OracleLog
