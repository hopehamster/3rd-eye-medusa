import { loadEnv, defineConfig } from '@medusajs/framework/utils'
import { voyageEmbedder } from './src/search/voyage-embedder'

loadEnv(process.env.NODE_ENV || 'development', process.cwd())

/**
 * Provider wiring is conditional on the key being present.
 *
 * CJ and Resend providers throw in their constructors when unconfigured, and
 * registering them unconditionally meant a missing env var took down the whole
 * backend instead of just disabling one feature. Now a missing key means the
 * provider is not registered at all, and we say so loudly once at boot.
 */
const optional = (name: string, value: string | undefined, label: string) => {
  if (!value) {
    console.warn(
      `[medusa-config] ${label} is not configured (${name} is empty) — provider not registered.`
    )
  }
  return Boolean(value)
}

const hasStripe = optional('STRIPE_API_KEY', process.env.STRIPE_API_KEY, 'Stripe payments')
const hasCj = optional('CJ_API_KEY', process.env.CJ_API_KEY, 'CJ dropship fulfilment')
const hasResend = optional(
  'RESEND_API_KEY',
  process.env.RESEND_API_KEY,
  'Resend transactional email'
)

if (!process.env.JWT_SECRET || !process.env.COOKIE_SECRET) {
  console.warn(
    '[medusa-config] JWT_SECRET / COOKIE_SECRET are missing. Medusa will refuse to start. ' +
      'Set them explicitly — there is deliberately no fallback value.'
  )
}

module.exports = defineConfig({
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL,
    http: {
      storeCors: process.env.STORE_CORS!,
      adminCors: process.env.ADMIN_CORS!,
      authCors: process.env.AUTH_CORS!,
      // No `|| "supersecret"` fallback: an unset secret must fail loudly
      // rather than silently sign sessions with a known value.
      jwtSecret: process.env.JWT_SECRET,
      cookieSecret: process.env.COOKIE_SECRET,
    },
  },
  modules: [
    ...(hasStripe
      ? [
          {
            resolve: '@medusajs/medusa/payment',
            options: {
              providers: [
                {
                  resolve: '@medusajs/payment-stripe',
                  id: 'stripe',
                  options: {
                    apiKey: process.env.STRIPE_API_KEY,
                    // Required for signature verification of async payment
                    // events (3DS, redirects). Without it those orders stay
                    // stuck in "pending" after a successful charge.
                    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
                  },
                },
              ],
            },
          },
        ]
      : []),
    {
      resolve: './src/modules/oracle',
    },
    {
      resolve: './src/modules/ai-content',
    },
    {
      resolve: '@medusajs/medusa/fulfillment',
      options: {
        providers: [
          // The built-in manual provider always stays available: it is the
          // fallback for non-dropship stock and for local pickup.
          {
            resolve: '@medusajs/fulfillment-manual',
            id: 'manual',
          },
          ...(hasCj
            ? [
                {
                  resolve: './src/modules/cj-fulfillment',
                  id: 'cj-fulfillment',
                  options: {
                    apiKey: process.env.CJ_API_KEY,
                    email: process.env.CJ_EMAIL,
                    // Dry run unless CJ_DRY_RUN is explicitly "false".
                    dryRun: process.env.CJ_DRY_RUN !== 'false',
                  },
                },
              ]
            : []),
        ],
      },
    },
    {
      resolve: '@medusajs/medusa/search',
      options: {
        providers: [
          {
            resolve: '@medusajs/medusa/search-postgres',
            id: 'search-postgres',
            options: {
              // Voyage AI embeddings for the `semantic` vector field.
              // Reads VOYAGE_API_KEY lazily at index/query time.
              embedder: voyageEmbedder,
            },
          },
        ],
      },
    },
    ...(hasResend
      ? [
          {
            resolve: '@medusajs/medusa/notification',
            options: {
              providers: [
                {
                  resolve: './src/modules/resend-notification',
                  id: 'resend',
                  options: {
                    apiKey: process.env.RESEND_API_KEY,
                    from: process.env.RESEND_FROM_EMAIL,
                  },
                },
              ],
            },
          },
        ]
      : []),
  ],
})
