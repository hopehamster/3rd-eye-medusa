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
 *
 * KEYING NOTE: this used to key on the first value of the client-supplied
 * `x-forwarded-for` header, which any caller can rotate freely — so the limit
 * protected nothing and the DeepSeek bill was effectively unbounded. Now:
 *   - signed-in customers are keyed by customer id (stable, unspoofable);
 *   - everyone else is keyed by req.ip, and the forwarded header is only
 *     honoured when TRUST_PROXY=true is set explicitly (i.e. we are genuinely
 *     behind our own proxy and the header is not attacker-controlled).
 */
const WINDOW_MS = 60_000
const MAX_REQUESTS = 20
const TRUST_PROXY = process.env.TRUST_PROXY === "true"

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
  const customerId = (req as any).auth_context?.actor_id as string | undefined

  let key: string
  if (customerId) {
    key = `oracle:cust:${customerId}`
  } else if (TRUST_PROXY) {
    const forwarded = (req.headers["x-forwarded-for"] as string)
      ?.split(",")[0]
      ?.trim()
    key = `oracle:ip:${forwarded ?? req.ip ?? "unknown"}`
  } else {
    key = `oracle:ip:${req.ip ?? "unknown"}`
  }

  if (isRateLimited(key)) {
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
