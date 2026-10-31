import { loadEnv, defineConfig } from '@medusajs/framework/utils'
import { voyageEmbedder } from './src/search/voyage-embedder'

loadEnv(process.env.NODE_ENV || 'development', process.cwd())

/**
 * Providers are registered conditionally on their key being present.
 *
 * This file previously failed to build at all, and the production server had
 * drifted into its own hand-edited version (Twilio SMS, SMTP mail, passwordless
 * auth) that was never committed. This is now the reconciled version: it keeps
 * every provider the live server runs, drops the `"supersecret"` secret
 * fallbacks, and passes STRIPE_WEBHOOK_SECRET so async payments can be verified.
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
const hasTwilio = optional(
  'TWILIO_ACCOUNT_SID',
  process.env.TWILIO_ACCOUNT_SID,
  'Twilio SMS'
)
const hasSmtp = optional('SMTP_HOST', process.env.SMTP_HOST, 'SMTP transactional email')

if (!process.env.JWT_SECRET || !process.env.COOKIE_SECRET) {
  console.warn(
    '[medusa-config] JWT_SECRET / COOKIE_SECRET are missing. Medusa will refuse to start. ' +
      'There is deliberately no fallback value.'
  )
}

module.exports = defineConfig({
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL,
    http: {
      storeCors: process.env.STORE_CORS!,
      adminCors: process.env.ADMIN_CORS!,
      authCors: process.env.AUTH_CORS!,
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
                    // pending after a successful charge.
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
          {
            resolve: '@medusajs/medusa/fulfillment-manual',
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
              embedder: voyageEmbedder,
            },
          },
        ],
      },
    },
    ...(hasTwilio || hasSmtp
      ? [
          {
            resolve: '@medusajs/medusa/notification',
            options: {
              providers: [
                ...(hasTwilio
                  ? [
                      {
                        resolve: './src/modules/twilio-notification',
                        id: 'twilio-sms',
                        options: {
                          accountSid: process.env.TWILIO_ACCOUNT_SID,
                          authToken: process.env.TWILIO_AUTH_TOKEN,
                          fromNumber: process.env.TWILIO_PHONE_NUMBER,
                        },
                      },
                    ]
                  : []),
                ...(hasSmtp
                  ? [
                      {
                        resolve: './src/modules/smtp-notification',
                        id: 'smtp',
                        options: {
                          host: process.env.SMTP_HOST,
                          port: process.env.SMTP_PORT
                            ? parseInt(process.env.SMTP_PORT, 10)
                            : undefined,
                          secure: process.env.SMTP_SECURE === 'true',
                          user: process.env.SMTP_USER,
                          pass: process.env.SMTP_PASS,
                          from: process.env.SMTP_FROM,
                        },
                      },
                    ]
                  : []),
              ],
            },
          },
        ]
      : []),
    {
      resolve: '@medusajs/medusa/auth',
      options: {
        providers: [
          {
            resolve: '@medusajs/medusa/auth-emailpass',
            id: 'emailpass',
            options: {},
          },
          {
            resolve: '@devx-commerce/passwordless/providers/passwordless',
            id: 'passwordless',
            options: {
              jwtSecret: process.env.JWT_SECRET,
              codeLength: 6,
              codeExpiryMinutes: 10,
              maxAttempts: 5,
              smsRateLimitMinutes: 5,
              blockDurationMinutes: 10,
            },
          },
        ],
      },
    },
  ],
})
