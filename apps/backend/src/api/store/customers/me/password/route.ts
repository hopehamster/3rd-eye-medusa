/**
 * POST /store/customers/me/password
 *
 * Change the signed-in customer's password.
 *
 * Medusa's built-in /auth/customer/emailpass/update route rejects a normal
 * customer session token (401 Invalid token), so password change is handled
 * here instead: the caller must hold a customer session, the CURRENT password is
 * verified against the emailpass provider, and only then is the provider
 * identity updated.
 */
import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"

type Body = {
  old_password?: string
  new_password?: string
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const { old_password, new_password } = (req.body ?? {}) as Body

  const customerId = (req as unknown as { auth_context?: { actor_id?: string } })
    .auth_context?.actor_id

  if (!customerId) {
    res.status(401).json({ type: "unauthorized", message: "Please sign in first." })
    return
  }

  if (!old_password || !new_password) {
    res
      .status(400)
      .json({ type: "invalid_data", message: "Both the current and new password are required." })
    return
  }

  if (String(new_password).length < 8) {
    res
      .status(400)
      .json({ type: "invalid_data", message: "Choose a password of at least 8 characters." })
    return
  }

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const { data } = (await query.graph({
    entity: "customer",
    fields: ["id", "email"],
    filters: { id: customerId },
  })) as { data: { id: string; email?: string | null }[] }

  const email = data?.[0]?.email
  if (!email) {
    res.status(400).json({ type: "invalid_data", message: "This account has no email on file." })
    return
  }

  const auth = req.scope.resolve(Modules.AUTH)

  // Prove ownership with the current password before changing anything.
  const check = await auth.authenticate("emailpass", {
    body: { email, password: old_password },
  })

  if (!check?.success) {
    res
      .status(400)
      .json({ type: "invalid_data", message: "That current password is not correct." })
    return
  }

  const updated = await auth.updateProvider("emailpass", {
    email,
    password: new_password,
    actor_id: customerId,
  } as unknown as Parameters<typeof auth.updateProvider>[1])

  if (!updated?.success) {
    res
      .status(400)
      .json({ type: "invalid_data", message: "Could not update the password. Please try again." })
    return
  }

  res.json({ success: true })
}
