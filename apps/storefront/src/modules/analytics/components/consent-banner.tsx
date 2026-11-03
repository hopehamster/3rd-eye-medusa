"use client"

import { ConsentValue } from "@lib/consent"
import { useEffect, useRef } from "react"

/**
 * Shown until the visitor decides. Deliberately plain and non-blocking:
 * the store stays fully usable whether they accept, decline or ignore it.
 *
 * Placement (issue #149): this is a band the page reserves space for, not a
 * layer floating over the storefront. It is the last flex child of <body>, so
 * the scroll area (<main>, flex-1, overflow-y-auto) ends above it: nothing can
 * scroll underneath it, which is what keeps the hero CTA and the PDP
 * add-to-cart bar tappable. Fixed bars stack on top of it through
 * --consent-dock, which this component publishes from its measured height.
 * Answering removes the band from the column and gives the space back; content
 * above it never moves, so there is no shift on load or on answer.
 */
export default function ConsentBanner({
  onDecide,
}: {
  onDecide: (value: ConsentValue) => void
}) {
  const bandRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const band = bandRef.current
    const root = document.documentElement
    if (!band) {
      return
    }

    // Publish the band's height so fixed bars (mobile add-to-cart,
    // free-shipping popup) sit above it instead of on top of it.
    const publish = () =>
      root.style.setProperty("--consent-dock", `${band.offsetHeight}px`)

    publish()

    const observer = new ResizeObserver(publish)
    observer.observe(band)

    return () => {
      observer.disconnect()
      root.style.removeProperty("--consent-dock")
    }
  }, [])

  return (
    <div
      ref={bandRef}
      role="dialog"
      aria-label="Analytics consent"
      data-testid="consent-banner"
      className="shrink-0 border-t border-paper-border bg-paper-surface px-6 py-4"
    >
      <div className="mx-auto flex max-w-4xl flex-col gap-3 small:flex-row small:items-center small:justify-between small:gap-6">
        <p className="font-humanist text-[13px] leading-5 text-paper-text small:text-sm small:leading-6">
          We would like to measure how the shop is used so we can improve it.
          Nothing beyond what the cart needs runs until you say yes — and saying
          no changes nothing about your order.{" "}
          <a
            href="/privacy"
            className="underline underline-offset-4 hover:text-paper-accent"
          >
            Read the privacy policy
          </a>
          .
        </p>
        <div className="grid shrink-0 grid-cols-2 gap-3 small:flex">
          <button
            type="button"
            onClick={() => onDecide("denied")}
            className="inline-flex items-center justify-center border border-paper-border bg-paper-raised px-4 py-3 font-humanist text-sm font-semibold text-paper-text transition-colors hover:border-paper-accent small:px-5"
          >
            Essential only
          </button>
          <button
            type="button"
            onClick={() => onDecide("granted")}
            className="inline-flex items-center justify-center border border-paper-accent bg-paper-accent px-4 py-3 font-humanist text-sm font-semibold text-paper-bg transition-opacity hover:opacity-90 small:px-5"
          >
            Allow analytics
          </button>
        </div>
      </div>
    </div>
  )
}
