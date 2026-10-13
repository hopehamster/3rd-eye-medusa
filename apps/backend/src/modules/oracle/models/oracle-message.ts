import { model } from "@medusajs/framework/utils"

/**
 * One turn in an Oracle conversation. Session-scoped (works for guests)
 * and expert-scoped (switching experts starts fresh). The expert reads
 * recent turns before answering, so the conversation actually flows.
 */
export const OracleMessage = model.define("oracle_message", {
  id: model.id().primaryKey(),
  sessionId: model.text(),
  expertId: model.text(),
  role: model.text(), // "user" | "expert"
  content: model.text(),
})

export default OracleMessage
