import type { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { CJClient } from "../modules/cj-fulfillment/cj-client"
import { buildCJOrderPayload } from "../modules/cj-fulfillment/service"

/**
 * How far can the CJ order path be proven without spending money?
 *
 * CJ has no sandbox: the first successful /shopping/order/createOrder buys and
 * ships real goods. This probe builds the REAL payload (the same function the
 * fulfilment provider uses) and swaps in a product id CJ cannot resolve, so the
 * answer can only be a validation error — never an order.
 *
 * What it proves when CJ names a field rather than complaining about auth:
 *   - the API key and email authenticate,
 *   - the endpoint and our payload shape are accepted by CJ's parser,
 *   - the failure is the fake product id.
 *
 * It has already caught two real defects this way: a missing fromCountryCode and
 * (before that) our belief that the payload was complete.
 *
 * It does NOT prove that a valid order is accepted and paid. That needs one real
 * order, which is the owner's call (#135).
 */
export default async function cjContractProbe({ container }: ExecArgs) {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)

  const client = new CJClient({
    apiKey: process.env.CJ_API_KEY ?? "",
    email: process.env.CJ_EMAIL ?? "",
  })

  const { data } = (await query.graph({
    entity: "product",
    fields: ["id", "title", "metadata"],
  })) as { data: { id: string; title?: string; metadata?: Record<string, unknown> | null }[] }

  const linked = (data ?? []).filter((p) => p.metadata?.cj_pid)
  logger.info(`cj-contract-probe: ${linked.length} CJ-linked products on the site`)
  if (!linked.length) {
    logger.warn("cj-contract-probe: nothing CJ-linked to stand in for")
    return
  }

  const sample = linked[0]
  logger.info(
    `cj-contract-probe: reference product -> ${sample.title} (${sample.metadata?.cj_pid})`
  )

  const payload = buildCJOrderPayload(
    {
      id: "probe_order",
      display_id: `probe-${Date.now()}`,
      email: "probe@3rdeyesupply.com",
      shipping_address: {
        first_name: "Contract",
        last_name: "Probe",
        country_code: "us",
        province: "NV",
        city: "Las Vegas",
        address_1: "1 Probe Street",
        postal_code: "89101",
        phone: "7020000000",
      },
    },
    { cj_option_id: "cj-standard" },
    [{ vid: "CJ_PROBE_DOES_NOT_EXIST_000000", quantity: 1 }]
  )

  logger.info(`cj-contract-probe: sending real payload shape -> ${JSON.stringify(payload)}`)

  try {
    const result = await client.createOrder(payload)
    logger.error(
      `cj-contract-probe: CJ ACCEPTED the bogus order — investigate immediately: ${JSON.stringify(result)}`
    )
  } catch (error) {
    logger.info(`cj-contract-probe: CJ replied -> ${String((error as Error).message ?? error).slice(0, 400)}`)
  }
}
