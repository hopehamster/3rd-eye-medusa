/**
 * Cancel one order by display id or id — ops tool.
 *
 *   npx medusa exec ./src/scripts/cancel-order.ts <display_id|order_id>
 *
 * Written after verifying the Stripe integration end to end: a verification
 * order has to be cancellable without hand-editing the database, and the admin
 * UI is not always to hand.
 */
import { cancelOrderWorkflow } from "@medusajs/medusa/core-flows"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import type { ExecArgs } from "@medusajs/framework/types"

type Row = { id: string; display_id: number; status: string }

export default async function cancelOrder({ container, args }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)

  const target = (args ?? []).find((a) => a && !a.startsWith("-"))
  if (!target) {
    logger.error("cancel-order: pass a display id or an order id")
    return
  }

  const isDisplayId = /^\d+$/.test(target)

  // Filter in JS: the order filter type only accepts indexed columns, and this
  // tool is used rarely enough that reading the (short) order list is fine.
  const { data } = (await query.graph({
    entity: "order",
    fields: ["id", "display_id", "status"],
  })) as unknown as { data: Row[] }

  const order = (data ?? []).find((o) =>
    isDisplayId ? String(o.display_id) === target : o.id === target
  )

  if (!order) {
    logger.error(`cancel-order: no order matching ${target}`)
    return
  }
  if (order.status === "canceled") {
    logger.info(`cancel-order: order #${order.display_id} is already canceled`)
    return
  }

  await cancelOrderWorkflow(container).run({ input: { order_id: order.id } })
  logger.info(`cancel-order: order #${order.display_id} (${order.id}) canceled`)
}
