const checkEnvVariables = require("./check-env-variables")
const { withSentryConfig } = require("@sentry/nextjs/config")

checkEnvVariables()

/**
 * Medusa Cloud-related environment variables
 */
const S3_HOSTNAME = process.env.MEDUSA_CLOUD_S3_HOSTNAME
const S3_PATHNAME = process.env.MEDUSA_CLOUD_S3_PATHNAME

/**
 * @type {import('next').NextConfig}
 */
const nextConfig = {
  reactStrictMode: true,
  // Include the canon markdown guides in the server bundle so the
  // /guides/[slug] pages can read them at runtime on Vercel.
  outputFileTracingIncludes: {
    "/[countryCode]/(main)/guides/[slug]": ["./canon/**/*"],
  },
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
  // Type errors FAIL the build. This gate was previously off, which meant
  // "the build passed" said nothing about whether the code was type-correct.
  typescript: {
    ignoreBuildErrors: false,
  },
  // ESLint does NOT gate the build: the rule set here (react/no-unescaped-
  // entities, no-explicit-any, ban-ts-comment) is stylistic and would block
  // deploys over formatting. Lint runs as its own command: `pnpm lint`.
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
      },
      {
        protocol: "https",
        hostname: "*.s3.*.amazonaws.com",
      },
      {
        protocol: "https",
        hostname: "*.s3.amazonaws.com",
      },
      ...(S3_HOSTNAME && S3_PATHNAME
        ? [
            {
              protocol: "https",
              hostname: S3_HOSTNAME,
              pathname: S3_PATHNAME,
            },
          ]
        : []),
    ],
  },
}

// Sentry: error monitoring only (basic scope). Source-map upload is skipped
// unless SENTRY_AUTH_TOKEN + org/project are configured; runtime error
// capture works from the DSN env vars alone.
module.exports = withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG || "702-ai-services",
  project: process.env.SENTRY_PROJECT || "3rd-eye-supply",
  silent: true,
  widenClientFileUpload: true,
  tunnelRoute: "/monitoring",
  sourcemaps: {
    disable: !process.env.SENTRY_AUTH_TOKEN,
  },
})
