/**
 * Order confirmation email.
 *
 * Fires on `order.placed`. Sends a warm confirmation via the Resend
 * notification provider with order details.
 */
import type {
  SubscriberArgs,
  SubscriberConfig,
} from "@medusajs/framework"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"

type OrderPlacedEvent = {
  id: string
}

/**
 * Customer-supplied values (names, addresses, and AI-generated product titles)
 * go into email HTML. Escape every interpolation — an unescaped "<" turns a
 * confirmation email into a phishing vector or a broken layout.
 */
const escapeHtml = (value: unknown): string =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")

function formatMoney(amount: number, currency: string): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(amount)
}

function orderConfirmationHtml(opts: {
  displayId: string | number
  email: string
  items: { title: string; quantity: number; unitPrice: number }[]
  currency: string
  total: number
  shippingAddress?: {
    first_name?: string
    last_name?: string
    address_1?: string
    city?: string
    province?: string
    postal_code?: string
  }
}): string {
  const name = opts.shippingAddress?.first_name || "friend"
  const itemRows = opts.items
    .map(
      (item) => `
      <tr>
        <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${escapeHtml(item.title)}</td>
        <td style="padding: 8px 0; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
        <td style="padding: 8px 0; border-bottom: 1px solid #eee; text-align: right;">${formatMoney(item.unitPrice, opts.currency)}</td>
      </tr>`
    )
    .join("")

  const addr = opts.shippingAddress
  const addressBlock = addr
    ? `<p style="margin: 4px 0; color: #555;">
        ${escapeHtml([addr.first_name, addr.last_name].filter(Boolean).join(" "))}<br/>
        ${escapeHtml(addr.address_1 || "")}<br/>
        ${escapeHtml([addr.city, addr.province, addr.postal_code].filter(Boolean).join(", "))}
      </p>`
    : ""

  return `
<!DOCTYPE html>
<html>
<body style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #2a2a2a; background: #faf8f5;">
  <div style="text-align: center; margin-bottom: 32px;">
    <h1 style="font-size: 28px; margin: 0; letter-spacing: 2px;">3RD EYE SUPPLY</h1>
    <p style="color: #888; font-size: 13px; margin-top: 4px;">crystals &amp; sacred tools</p>
  </div>

  <p>Hi ${escapeHtml(name)},</p>

  <p>Your order's confirmed — we've got it, and your pieces are being prepared with care. Here's what you picked up:</p>

  <table style="width: 100%; border-collapse: collapse; margin: 24px 0;">
    <tr style="text-align: left; color: #888; font-size: 13px;">
      <th style="padding-bottom: 8px;">Item</th>
      <th style="padding-bottom: 8px; text-align: center;">Qty</th>
      <th style="padding-bottom: 8px; text-align: right;">Price</th>
    </tr>
    ${itemRows}
    <tr>
      <td colspan="2" style="padding-top: 12px; font-weight: bold;">Total</td>
      <td style="padding-top: 12px; text-align: right; font-weight: bold;">${formatMoney(opts.total, opts.currency)}</td>
    </tr>
  </table>

  <p style="color: #555; font-size: 14px;">Order #${escapeHtml(opts.displayId)}</p>

  ${addressBlock ? `<p style="font-weight: bold; margin-bottom: 4px;">Shipping to:</p>${addressBlock}` : ""}

  <p>You'll get another note from us the moment your order ships, with tracking. If anything looks off, just reply to this email — a real person reads these.</p>

  <p>Thanks for trusting us with your practice.</p>

  <p style="margin-top: 32px; color: #888; font-size: 13px; text-align: center;">
    — The 3rd Eye Supply team
  </p>
</body>
</html>`
}

export default async function orderPlacedHandler({
  event: { data },
  container,
}: SubscriberArgs<OrderPlacedEvent>) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const orderModule = container.resolve(Modules.ORDER)
  const notificationModule = container.resolve(Modules.NOTIFICATION)

  try {
    const order = await orderModule.retrieveOrder(data.id, {
      relations: ["items", "shipping_address", "summary"],
    })

    if (!order.email) {
      logger.warn(`order-placed: order ${data.id} has no email, skipping notification`)
      return
    }

    const items = (order.items ?? []).map((item: any) => ({
      title: item.title ?? item.product_title ?? "Item",
      quantity: item.quantity ?? 1,
      unitPrice: item.unit_price ?? 0,
    }))

    // v2: totals live on the summary; fall back to 0
    const summary = (order as any).summary
    const total =
      summary?.total ??
      summary?.current_order_total ??
      items.reduce((s, i) => s + i.unitPrice * i.quantity, 0)

    const html = orderConfirmationHtml({
      displayId: (order as any).display_id ?? data.id,
      email: order.email,
      items,
      currency: order.currency_code ?? "usd",
      total,
      shippingAddress: order.shipping_address as any,
    })

    await notificationModule.createNotifications({
      to: order.email,
      channel: "email",
      template: "order-confirmation",
      data: {
        subject: `Your 3rd Eye Supply order is confirmed (#${(order as any).display_id ?? ""})`,
        html,
      },
    })

    logger.info(`order-placed: confirmation sent to ${order.email}`)
  } catch (err) {
    logger.error(
      `order-placed: failed to send confirmation for order ${data.id}: ${(err as Error).message}`
    )
  }
}

export const config: SubscriberConfig = {
  event: "order.placed",
}
