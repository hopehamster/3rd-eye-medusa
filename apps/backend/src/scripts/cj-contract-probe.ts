import type { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { CJClient } from "../modules/cj-fulfillment/cj-client"

/**
 * How far can the CJ order path be proven without spending money?
 *
 * CJ has no sandbox: the first successful /shopping/order/createOrder buys and
 * ships real goods. This probe stops one step short of that by sending a payload
 * that is structurally complete but references a product id CJ cannot resolve,
 * so the answer can only be a validation error — never an order.
 *
 * What it proves when CJ answers with a product/validation error rather than an
 * auth error:
 *   - the API key and email authenticate,
 *   - the endpoint and payload shape are accepted by CJ's parser,
 *   - the failure is our fake pid, not our integration.
 *
 * What it does not prove: that a valid order is accepted and paid. That needs
 * one real order, which is the owner's call (#135).
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
  logger.info(`cj-contract-probe: real product for reference -> ${sample.title} (${sample.metadata?.cj_pid})`)

  const fakePid = "CJ_PROBE_DOES_NOT_EXIST_000000"
  const payload = {
    orderNumber: `probe-${Date.now()}`,
    shippingCustomerName: "Contract Probe",
    fromCountryCode: "CN",
    shippingCountryCode: "US",
    shippingProvince: "NV",
    shippingCity: "Las Vegas",
    shippingAddress: "1 Probe Street",
    shippingZip: "89101",
    shippingPhone: "7020000000",
    remark: "integration probe - must never create an order",
    products: [
      {
        vid: `${fakePid}-VID`,
        quantity: 1,
      },
    ],
  } as Record<string, unknown>

  try {
    const result = await client.createOrder(payload as never)
    logger.error(
      `cj-contract-probe: CJ ACCEPTED the bogus order — investigate immediately: ${JSON.stringify(result)}`
    )
  } catch (error) {
    const message = (error as Error).message ?? String(error)
    logger.info(`cj-contract-probe: CJ replied -> ${message.slice(0, 400)}`)
  }
}