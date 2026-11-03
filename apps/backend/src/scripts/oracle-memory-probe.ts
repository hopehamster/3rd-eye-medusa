import type { ExecArgs } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"
import { ORACLE_MODULE } from "../modules/oracle"
import { extractMemorableFacts } from "../modules/oracle/deepseek"

/**
 * Find out which link in "consent -> extract -> write -> read" is broken.
 */
export default async function oracleMemoryProbe({ container }: ExecArgs) {
  const customerId = process.env.PROBE_CUSTOMER_ID ?? ""
  const expertId = process.env.PROBE_EXPERT_ID ?? "rootwork"
  const customers = container.resolve(Modules.CUSTOMER)
  const oracle = container.resolve(ORACLE_MODULE) as any

  try {
    const c = await customers.retrieveCustomer(customerId, { select: ["id", "metadata"] })
    console.log("1 customer metadata:", JSON.stringify(c?.metadata))
  } catch (e) {
    console.log("1 customer read FAILED:", (e as Error).message.slice(0, 120))
  }

  try {
    const facts = await extractMemorableFacts({
      question: "I love rose quartz and keep one by my bed. I prefer silver to gold.",
      answer: "Rose quartz is traditionally the stone of the heart.",
      expertId,
      currentProfile: {},
    })
    console.log("2 extracted facts:", JSON.stringify(facts).slice(0, 300))
  } catch (e) {
    console.log("2 extract FAILED:", (e as Error).message.slice(0, 160))
  }

  try {
    await oracle.updateUserProfile(customerId, expertId, { prefers: "silver", stone: "rose quartz" })
    console.log("3 write: ok")
  } catch (e) {
    console.log("3 write FAILED:", (e as Error).message.slice(0, 200))
  }

  try {
    const all = await oracle.listExpertUserProfiles({})
    console.log("4 rows now:", Array.isArray(all) ? all.length : typeof all)
    console.log("5 getUserProfile:", JSON.stringify(await oracle.getUserProfile(customerId, expertId)).slice(0, 200))
  } catch (e) {
    console.log("4/5 FAILED:", (e as Error).message.slice(0, 160))
  }
}
