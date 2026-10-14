/**
 * Shipping update email.
 *
 * Fires on `shipment.created`. Tells the customer their order is on its
 * way, with tracking info when available.
 */
import type {
  SubscriberArgs,
  SubscriberConfig,
} from "@medusajs/framework"
import { Modules } from "@medusajs/framework/utils"

type ShipmentCreatedEvent = {
  id: string
}

function shipmentHtml(opts: {
  displayId: string | number
  name: string
  trackingNumber?: string
  trackingUrl?: string
}): string {
  const trackingBlock = opts.trackingNumber
    ? `<p style="background: #f4f1ec; padding: 16px; border-radius: 8px; text-align: center;">
        <span style="color: #888; font-size: 13px;">Tracking number</span><br/>
        <strong style="font-size: 18px; letter-spacing: 1px;">${opts.trackingNumber}</strong>
        ${opts.trackingUrl ? `<br/><a href="${opts.trackingUrl}" style="color: #7a6a53;">Track your package</a>` : ""}
      </p>`
    : `<p>Tracking details will follow in a separate note once the carrier picks it up.</p>`

  return `
<!DOCTYPE html>
<html>
<body style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #2a2a2a; background: #faf8f5;">
  <div style="text-align: center; margin-bottom: 32px;">
    <h1 style="font-size: 28px; margin: 0; letter-spacing: 2px;">3RD EYE SUPPLY</h1>
    <p style="color: #888; font-size: 13px; margin-top: 4px;">crystals &amp; sacred tools</p>
  </div>

  <p>Hi ${opts.name},</p>

  <p>Good news — your order #${opts.displayId} just shipped. It's on its way to you now.</p>

  ${trackingBlock}

  <p>Give the carrier a day or so for tracking to go live. If anything seems stuck after a few days, reply to this email and we'll look into it.</p>

  <p style="margin-top: 32px; color: #888; font-size: 13px; text-align: center;">
    — The 3rd Eye Supply team
  </p>
</body>
</html>`
}

export default async function shipmentCreatedHandler({
  event: { data },
  container,
}: SubscriberArgs<ShipmentCreatedEvent>) {
  const logger = container.resolve("logger")
  const fulfillmentModule = container.resolve(Modules.FULFILLMENT)
  const orderModule = container.resolve(Modules.ORDER)
  const notificationModule = container.resolve(Modules.NOTIFICATION)

  try {
    const shipment = await fulfillmentModule.retrieveShipment(data.id, {
      relations: ["labels", "order"],
    })

    // The shipment's order may be a stub — fetch the full order for the email
    const orderId = (shipment as any).order_id ?? (shipment as any).order?.id
    if (!orderId) {
      logger.warn(`shipment-created: shipment ${data.id} has no order, skipping`)
      return
    }

    const order = await orderModule.retrieveOrder(orderId, {
      relations: ["shipping_address"],
    })

    if (!order.email) {
      logger.warn(`shipment-created: order ${orderId} has no email, skipping`)
      return
    }

    const name =
      (order.shipping_address as any)?.first_name || "friend"

    // Tracking info lives on shipment labels in v2
    const labels = (shipment as any).labels ?? []
    const trackingNumber =
      labels[0]?.tracking_number ?? (shipment as any).tracking_number
    const trackingUrl =
      labels[0]?.tracking_url ?? (shipment as any).tracking_url

    const html = shipmentHtml({
      displayId: (order as any).display_id ?? orderId,
      name,
      trackingNumber,
      trackingUrl,
    })

    await notificationModule.createNotifications({
      to: order.email,
      channel: "email",
      template: "shipment-created",
      data: {
        subject: `Your 3rd Eye Supply order is on its way`,
        html,
      },
    })

    logger.info(`shipment-created: shipping update sent to ${order.email}`)
  } catch (err) {
    logger.error(
      `shipment-created: failed for shipment ${data.id}: ${(err as Error).message}`
    )
  }
}

export const config: SubscriberConfig = {
  event: "shipment.created",
}
