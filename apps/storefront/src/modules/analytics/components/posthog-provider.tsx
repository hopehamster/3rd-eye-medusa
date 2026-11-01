"use client"

import { useCallback, useEffect, useState } from "react"
import { initAnalytics, setAnalyticsConsent } from "@lib/analytics"
import { ConsentValue, readConsent, writeConsent } from "@lib/consent"
import ConsentBanner from "./consent-banner"

/**
 * Initializes PostHog once on the client — but only after the visitor has
 * granted consent. Renders the consent banner until a decision is stored.
 * Safe no-op when NEXT_PUBLIC_POSTHOG_KEY is unset.
 */
export default function PostHogProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [choice, setChoice] = useState<ConsentValue | null>(null)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    const stored = readConsent()
    setChoice(stored)
    setLoaded(true)
    if (stored === "granted") {
      initAnalytics()
    }
  }, [])

  const decide = useCallback((value: ConsentValue) => {
    writeConsent(value)
    setChoice(value)
    setAnalyticsConsent(value === "granted")
  }, [])

  return (
    <>
      {children}
      {loaded && choice === null ? <ConsentBanner onDecide={decide} /> : null}
    </>
  )
}
