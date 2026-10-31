/**
 * Shipping update email.
 *
 * Fires on `shipment.created` (emitted by the core create-shipment workflow,
 * payload: { id: fulfillmentId, no_notification }).
 *
 * Two rules this subscriber enforces, because getting them wrong emails the
 * customer something false:
 *
 *  1. Never send without a real tracking number. A dry-run CJ fulfillment
 *     produces no labels; telling the customer "it just shipped" in that case
 *     is a lie, so we skip and log instead.
 *  2. Respect `no_notification` from the event — the admin UI sets it when a
 *     shipment is cancelled or manually corrected.
 *
 * Medusa v2 has no Shipment entity; a "shipment" is a Fulfillment that has been
 * marked shipped. Labels live on the fulfillment.
 */
import type {
  SubscriberArgs,
  SubscriberConfig,
} from "@medusajs/framework"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"

type ShipmentCreatedEvent = {
  id: string
  no_notification?: boolean
}

const escapeHtml = (value: unknown): string =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")

function shipmentHtml(opts: {
  displayId: string | number
  name: string
  trackingNumber: string
  trackingUrl?: string
}): string {
  const trackingBlock = `<p style="background: #f4f1ec; padding: 16px; border-radius: 8px; text-align: center;">
        <span style="color: #888; font-size: 13px;">Tracking number</span><br/>
        <strong style="font-size: 18px; letter-spacing: 1px;">${escapeHtml(opts.trackingNumber)}</strong>
        ${opts.trackingUrl ? `<br/><a href="${escapeHtml(opts.trackingUrl)}" style="color: #7a6a53;">Track your package</a>` : ""}
      </p>`

  return `
<!DOCTYPE html>
<html>
<body style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #2a2a2a; background: #faf8f5;">
  <div style="text-align: center; margin-bottom: 32px;">
    <h1 style="font-size: 28px; margin: 0; letter-spacing: 2px;">3RD EYE SUPPLY</h1>
    <p style="color: #888; font-size: 13px; margin-top: 4px;">crystals &amp; sacred tools</p>
  </div>

  <p>Hi ${escapeHtml(opts.name)},</p>

  <p>Good news — your order #${escapeHtml(opts.displayId)} just shipped. It's on its way to you now.</p>

  ${trackingBlock}

  <p>Give the carrier a day or so for tracking to go live. If anything seems stuck after a few days, reply to this email and we'll look into it.</p>

  <p style="margin-top: 32px; color: #888; font-size: 13px; text-align: center;">
    — The 3rd Eye Supply team
  </p>
</body>
</html>`
}

export default async function shipmentCreatedHandler({
  event,
  container,
}: SubscriberArgs<ShipmentCreatedEvent>) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const notificationModule = container.resolve(Modules.NOTIFICATION)

  const fulfillmentId = event.data?.id

  if (!fulfillmentId) {
    logger.warn("shipment-created: event had no fulfillment id, skipping")
    return
  }

  if (event.data?.no_notification) {
    logger.info(
      `shipment-created: no_notification set for fulfillment ${fulfillmentId}, skipping`
    )
    return
  }

  try {
    const { data } = await query.graph({
      entity: "fulfillment",
      fields: [
        "id",
        "labels.tracking_number",
        "labels.tracking_url",
        "order.id",
        "order.email",
        "order.display_id",
        "order.shipping_address.first_name",
      ],
      filters: { id: fulfillmentId },
    })

    const fulfillment = data?.[0] as
      | {
          id: string
          labels?: { tracking_number?: string | null; tracking_url?: string | null }[]
          order?: {
            id: string
            email?: string | null
            display_id?: number | string | null
            shipping_address?: { first_name?: string | null } | null
          } | null
        }
      | undefined

    if (!fulfillment) {
      logger.warn(
        `shipment-created: fulfillment ${fulfillmentId} not found, skipping`
      )
      return
    }

    const order = fulfillment.order

    if (!order?.id) {
      logger.warn(
        `shipment-created: fulfillment ${fulfillmentId} has no order, skipping`
      )
      return
    }

    if (!order.email) {
      logger.warn(
        `shipment-created: order ${order.id} has no email, skipping`
      )
      return
    }

    const label = fulfillment.labels?.find((l) => l.tracking_number)
    const trackingNumber = label?.tracking_number?.trim()

    // Rule 1: no tracking number means nothing has actually shipped as far as
    // the customer is concerned. Do not send a "shipped" email.
    if (!trackingNumber) {
      logger.info(
        `shipment-created: fulfillment ${fulfillmentId} has no tracking number ` +
          `(dry run or label pending) — no shipping email sent`
      )
      return
    }

    const html = shipmentHtml({
      displayId: order.display_id ?? order.id,
      name: order.shipping_address?.first_name || "friend",
      trackingNumber,
      trackingUrl: label?.tracking_url ?? undefined,
    })

    await notificationModule.createNotifications({
      to: order.email,
      channel: "email",
      template: "shipment-created",
      data: {
        subject: "Your 3rd Eye Supply order is on its way",
        html,
      },
    })

    logger.info(
      `shipment-created: shipping update sent for fulfillment ${fulfillmentId}`
    )
  } catch (err) {
    logger.error(
      `shipment-created: failed for fulfillment ${fulfillmentId}: ${(err as Error).message}`
    )
  }
}

export const config: SubscriberConfig = {
  event: "shipment.created",
}
