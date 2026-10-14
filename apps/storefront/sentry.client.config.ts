// Sentry client-side init for 3rd Eye Supply storefront.
// DSN comes from NEXT_PUBLIC_SENTRY_DSN (Vercel env var) — never committed.
// Basic scope: error monitoring only. No-op until the DSN is set.
import * as Sentry from "@sentry/nextjs"

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN

Sentry.init({
  dsn,
  enabled: !!dsn,
  environment:
    process.env.NEXT_PUBLIC_VERCEL_ENV ||
    process.env.VERCEL_ENV ||
    process.env.NODE_ENV,
  // Keep it basic: errors only, no tracing/session replay in this pass.
  tracesSampleRate: 0,
})
