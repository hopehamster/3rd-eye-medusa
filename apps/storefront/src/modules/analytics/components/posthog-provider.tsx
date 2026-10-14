"use client"

import { useEffect } from "react"
import { initAnalytics } from "@lib/analytics"

/**
 * Initializes PostHog once on the client.
 * Renders nothing. Safe no-op when NEXT_PUBLIC_POSTHOG_KEY is unset,
 * so the storefront works fine before the self-hosted PostHog exists.
 */
export default function PostHogProvider({
  children,
}: {
  children: React.ReactNode
}) {
  useEffect(() => {
    initAnalytics()
  }, [])

  return <>{children}</>
}
