import {
  authenticate,
  configureStoreSearch,
  defineMiddlewares,
  type MedusaNextFunction,
  type MedusaRequest,
  type MedusaResponse,
} from '@medusajs/framework/http'

/**
 * Simple in-memory rate limiter. Protects the DeepSeek bill on the
 * Oracle endpoints — one instance, so a process-local bucket is fine.
 * If we ever scale past one backend, move this to Redis.
 */
const WINDOW_MS = 60_000
const MAX_REQUESTS = 20

const buckets = new Map<string, number[]>()

function isRateLimited(key: string): boolean {
  const now = Date.now()
  const hits = (buckets.get(key) ?? []).filter((t) => now - t < WINDOW_MS)
  if (hits.length >= MAX_REQUESTS) {
    buckets.set(key, hits)
    return true
  }
  hits.push(now)
  buckets.set(key, hits)
  // Opportunistic cleanup so the map can't grow forever
  if (buckets.size > 10_000) {
    for (const [k, v] of buckets) {
      if (v.length === 0 || now - v[v.length - 1] > WINDOW_MS) {
        buckets.delete(k)
      }
    }
  }
  return false
}

async function oracleRateLimit(
  req: MedusaRequest,
  res: MedusaResponse,
  next: MedusaNextFunction
) {
  const ip =
    (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ??
    req.ip ??
    "unknown"
  if (isRateLimited(`oracle:${ip}`)) {
    res.status(429).json({
      error: "The Oracle needs a moment — please wait a minute and try again.",
    })
    return
  }
  next()
}

// The product index declares filterable `status` and `sales_channel_ids`, so
// the route narrows it to published products in the key's sales channels.
export default defineMiddlewares({
  routes: [
    {
      method: ['POST'],
      matcher: '/store/search',
      middlewares: [
        configureStoreSearch({
          allowed_indexes: {
            product: true,
          },
        }),
      ],
    },
    {
      matcher: '/store/oracle/*',
      middlewares: [
        // Populates req.auth_context for signed-in customers; guests pass
        // through with an empty context (memory stays guest-scoped).
        authenticate("customer", ["session", "bearer"], { allowUnregistered: true }),
        oracleRateLimit,
      ],
    },
  ],
})
