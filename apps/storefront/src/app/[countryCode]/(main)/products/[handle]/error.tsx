"use client"

import { useEffect } from "react"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

/**
 * Customer-facing PDP error boundary.
 *
 * The error message, digest and stack go to the console (and are captured by
 * Sentry) — never to the page. A storefront should never show a stack trace to
 * a shopper: it leaks file paths, internal identifiers and framework internals.
 */
export default function ProductError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("PDP error:", error.message, error.digest, error.stack)
  }, [error])

  return (
    <div className="content-container flex flex-col items-center justify-center gap-6 py-24 text-center">
      <h1 className="font-display text-2xl text-paper-text">
        This piece isn&apos;t available right now
      </h1>
      <p className="max-w-md text-sm text-paper-text-muted">
        Something went wrong while loading this product. It may have sold out or
        moved. Please try again, or browse the shelves.
      </p>
      {error.digest && (
        <p className="text-xs text-paper-text-subtle">
          Reference: {error.digest}
        </p>
      )}
      <div className="flex items-center gap-3">
        <button
          onClick={() => reset()}
          className="rounded-soft border border-paper-border bg-paper-raised px-4 py-2 text-sm text-paper-text"
        >
          Try again
        </button>
        <LocalizedClientLink
          href="/store"
          className="text-sm underline text-paper-text-muted"
        >
          Browse all pieces
        </LocalizedClientLink>
      </div>
    </div>
  )
}
