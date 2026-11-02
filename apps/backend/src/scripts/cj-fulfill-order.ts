import { ExecArgs } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"
import CJFulfillmentService from "../modules/cj-fulfillment/service"

/**
 * Send a Medusa order to CJ Dropshipping.
 *
 * Why this exists instead of the stock "create fulfillment" admin action:
 * Medusa's createFulfillmentWorkflow cannot build fulfilment items for this
 * catalogue. Every variant has manage_inventory=false, so there are no
 * inventory items to map line items onto, and the workflow dies with
 * "Value for FulfillmentItem.title is required, 'undefined' found" — for any
 * input shape, before the provider is ever reached. That makes the admin
 * fulfilment screen unusable for a dropship catalogue.
 *
 * This script therefore drives the registered CJ provider directly, with the
 * real order (real shipping address, real cj_vid lookups), and records the
 * supplier order id on the order's metadata. CJ_DRY_RUN still governs whether
 * a real supplier order is placed.
 *
 * Usage:
 *   npx medusa exec ./src/scripts/cj-fulfill-order.ts <order_id>
 */
export default async function cjFulfillOrder({ container, args }: ExecArgs) {
  const orderId = typeof args?.[0] === "string" ? args[0] : ""
  if (!orderId) {
    throw new Error("usage: medusa exec ./src/scripts/cj-fulfill-order.ts <order_id>")
  }

  const query = container.resolve("query")
  const { data } = await query.graph({
    entity: "order",
    fields: [
      "id",
      "display_id",
      "email",
      "metadata",
      "shipping_address.*",
      "items.id",
      "items.title",
      "items.quantity",
      "items.variant_id",
    ],
    filters: { id: orderId },
  })
  const order = data[0]
  if (!order) {
    throw new Error(`cj-fulfill-order: order ${orderId} not found`)
  }
  if (!order.shipping_address) {
    throw new Error(`cj-fulfill-order: order ${orderId} has no shipping address`)
  }

  const items = (order.items ?? []).map((i: { id: string; quantity: number }) => ({
    line_item_id: i.id,
    quantity: i.quantity,
  }))
  if (items.length === 0) {
    throw new Error(`cj-fulfill-order: order ${orderId} has no items`)
  }

  const provider = new CJFulfillmentService(
    { logger: console as never, query } as never,
    { apiKey: process.env.CJ_API_KEY, email: process.env.CJ_EMAIL } as never
  )

  const result = await provider.createFulfillment(
    { order_id: orderId, provider_id: "cj-fulfillment_cj-fulfillment" },
    items,
    order as never,
    {}
  )

  const data_ = (result.data ?? {}) as Record<string, unknown>
  const dryRun = data_.dry_run === true

  const orderService = container.resolve(Modules.ORDER)
  await orderService.updateOrders([
    {
      id: orderId,
      metadata: {
        ...(order.metadata ?? {}),
        cj_fulfillment: dryRun
          ? { dry_run: true, payload: data_.cj_payload }
          : { cj_order_id: data_.cj_order_id, cj_order_number: data_.cj_order_number },
      },
    },
  ])

  console.log(
    dryRun
      ? "CJ DRY RUN — nothing was sent. Payload: " + JSON.stringify(data_.cj_payload)
      : `CJ order created: ${String(data_.cj_order_id)} (${String(data_.cj_order_number)})`
  )
}
