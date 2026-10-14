// Sentry server-side init for 3rd Eye Supply storefront.
// Reads SENTRY_DSN (falls back to NEXT_PUBLIC_SENTRY_DSN) from Vercel env vars.
// No-op until a DSN is set.
import * as Sentry from "@sentry/nextjs"

const dsn = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN

Sentry.init({
  dsn,
  enabled: !!dsn,
  environment:
    process.env.VERCEL_ENV || process.env.NEXT_PUBLIC_VERCEL_ENV || process.env.NODE_ENV,
  tracesSampleRate: 0,
})
