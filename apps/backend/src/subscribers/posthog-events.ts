/**
 * PostHog backend event tracking.
 *
 * Sends order lifecycle events directly to PostHog's capture API.
 * Deliberately avoids the Analytics Module (it caused container crash loops).
 * Uses only Node's global fetch — no extra dependencies.
 *
 * Events:
 *   order.placed    -> "order_placed"    (order_id, total, currency, item_count)
 *   order.fulfilled -> "order_fulfilled" (order_id)
 */
import type {
  SubscriberArgs,
  SubscriberConfig,
} from "@medusajs/framework"
import { Modules } from "@medusajs/framework/utils"

const POSTHOG_HOST = (
  process.env.POSTHOG_HOST || "https://us.i.posthog.com"
).replace(/\/+$/, "")
const POSTHOG_KEY = process.env.POSTHOG_EVENTS_API_KEY

type LoggerLike = {
  info: (m: string) => void
  warn: (m: string) => void
  error: (m: string) => void
}

/**
 * Fire-and-forget capture call. Never throws — analytics must never
 * break the order flow.
 */
async function captureEvent(opts: {
  event: string
  distinctId: string
  properties?: Record<string, unknown>
  logger: LoggerLike
}): Promise<void> {
  const { event, distinctId, properties, logger } = opts

  if (!POSTHOG_KEY) {
    logger.warn(
      `posthog-events: POSTHOG_EVENTS_API_KEY not set, skipping "${event}"`
    )
    return
  }

  try {
    const res = await fetch(`${POSTHOG_HOST}/capture/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: POSTHOG_KEY,
        event,
        distinct_id: distinctId,
        properties: {
          $lib: "medusa-backend",
          source: "3rd-eye-supply",
          ...(properties ?? {}),
        },
        timestamp: new Date().toISOString(),
      }),
    })
    if (!res.ok) {
      logger.warn(
        `posthog-events: capture failed for "${event}" — HTTP ${res.status}`
      )
    }
  } catch (err) {
    logger.error(
      `posthog-events: capture error for "${event}": ${(err as Error).message}`
    )
  }
}

type OrderEventData = {
  id: string
}

async function trackOrderPlaced({
  event: { data },
  container,
}: SubscriberArgs<OrderEventData>) {
  const logger = container.resolve("logger") as LoggerLike
  const orderModule = container.resolve(Modules.ORDER)

  try {
    const order = await orderModule.retrieveOrder(data.id, {
      relations: ["items", "summary"],
    })
    const o = order as any
    const summary = o.summary ?? {}
    const items: any[] = o.items ?? []
    const total =
      summary.total ??
      summary.current_order_total ??
      items.reduce((s, i) => s + (i.unit_price ?? 0) * (i.quantity ?? 0), 0)
    const itemCount = items.reduce((n, i) => n + (i.quantity ?? 0), 0)

    await captureEvent({
      event: "order_placed",
      distinctId: o.email || o.customer_id || data.id,
      properties: {
        order_id: data.id,
        display_id: o.display_id,
        total,
        currency: (o.currency_code ?? "usd").toLowerCase(),
        item_count: itemCount,
      },
      logger,
    })
    logger.info(`posthog-events: tracked order_placed for order ${data.id}`)
  } catch (err) {
    logger.error(
      `posthog-events: order_placed failed for order ${data.id}: ${(err as Error).message}`
    )
  }
}

async function trackOrderFulfilled({
  event: { data },
  container,
}: SubscriberArgs<OrderEventData>) {
  const logger = container.resolve("logger") as LoggerLike
  const orderModule = container.resolve(Modules.ORDER)

  try {
    // Fetch the order so distinct_id matches the order_placed event (email).
    let distinctId: string = data.id
    try {
      const order = await orderModule.retrieveOrder(data.id)
      const o = order as any
      distinctId = o.email || o.customer_id || data.id
    } catch {
      // Fall back to the raw id — still track the event.
    }

    await captureEvent({
      event: "order_fulfilled",
      distinctId,
      properties: { order_id: data.id },
      logger,
    })
    logger.info(`posthog-events: tracked order_fulfilled for order ${data.id}`)
  } catch (err) {
    logger.error(
      `posthog-events: order_fulfilled failed for order ${data.id}: ${(err as Error).message}`
    )
  }
}

export default async function posthogEventsHandler(
  args: SubscriberArgs<OrderEventData>
) {
  const eventName = (args.event as unknown as { name?: string })?.name
  if (eventName === "order.fulfilled") {
    return trackOrderFulfilled(args)
  }
  return trackOrderPlaced(args)
}

export const config: SubscriberConfig = {
  event: ["order.placed", "order.fulfilled"],
}
