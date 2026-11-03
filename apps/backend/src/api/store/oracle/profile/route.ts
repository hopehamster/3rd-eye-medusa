import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"
import { ORACLE_MODULE } from "../../../../modules/oracle"
import type OracleModuleService from "../../../../modules/oracle/service"

/**
 * GET    /store/oracle/profile   — everything the Oracle remembers about you
 * DELETE /store/oracle/profile   — forget me (optionally one expert)
 *
 * The profile model promises "the customer can see and edit their profile
 * (transparency)", but nothing exposed it: an LLM-extracted profile was written
 * on every consultation and a member had no way to read or remove it. This route
 * is that way. Auth comes from the /store/oracle/* middleware, so guests get 401.
 *
 * DELETE also clears the consent flag, so a later consultation cannot silently
 * start remembering again — the member has to opt back in.
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const customerId = (req as { auth_context?: { actor_id?: string } }).auth_context
    ?.actor_id

  if (!customerId) {
    res.status(401).json({ message: "Sign in to see what the Oracle remembers." })
    return
  }

  const oracle = req.scope.resolve(ORACLE_MODULE) as OracleModuleService
  const profiles = await oracle.listUserProfiles(customerId)

  let consent = false
  try {
    const customers = req.scope.resolve(Modules.CUSTOMER)
    const customer = await customers.retrieveCustomer(customerId, {
      select: ["id", "metadata"],
    })
    consent = customer?.metadata?.oracle_profile_consent === true
  } catch {
    // Treat an unreadable record as "not consented" — fail closed.
    consent = false
  }

  res.json({
    consent,
    remembers: profiles.length > 0,
    profiles,
  })
}

export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  const customerId = (req as { auth_context?: { actor_id?: string } }).auth_context
    ?.actor_id

  if (!customerId) {
    res.status(401).json({ message: "Sign in to delete what the Oracle remembers." })
    return
  }

  const query = req.query as { expert_id?: string }
  const expertId =
    typeof query?.expert_id === "string" && query.expert_id.length > 0
      ? query.expert_id
      : undefined

  const oracle = req.scope.resolve(ORACLE_MODULE) as OracleModuleService
  const deleted = await oracle.deleteUserProfile(customerId, expertId)

  try {
    const customers = req.scope.resolve(Modules.CUSTOMER)
    await customers.updateCustomers(customerId, {
      metadata: { oracle_profile_consent: false, oracle_profile_cleared_at: new Date().toISOString() },
    })
  } catch {
    // The rows are gone, which is the part that matters. Reporting deletion as
    // failed because the consent flag did not clear would be misleading.
  }

  res.json({ deleted, expert_id: expertId ?? null, consent: false })
}
