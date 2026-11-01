"use client"

import { ConsentValue } from "@lib/consent"

/**
 * Shown until the visitor decides. Deliberately plain and non-blocking:
 * the store stays fully usable whether they accept, decline or ignore it.
 */
export default function ConsentBanner({
  onDecide,
}: {
  onDecide: (value: ConsentValue) => void
}) {
  return (
    <div
      role="dialog"
      aria-label="Analytics consent"
      className="fixed inset-x-0 bottom-0 z-[60] border-t border-paper-border bg-paper-surface px-6 py-5 shadow-lg"
    >
      <div className="mx-auto flex max-w-4xl flex-col gap-4 small:flex-row small:items-center small:justify-between">
        <p className="font-humanist text-sm leading-6 text-paper-text">
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
        <div className="flex shrink-0 gap-3">
          <button
            type="button"
            onClick={() => onDecide("denied")}
            className="border border-paper-border px-4 py-2 font-humanist text-sm text-paper-muted transition-colors hover:text-paper-text"
          >
            Essential only
          </button>
          <button
            type="button"
            onClick={() => onDecide("granted")}
            className="border border-paper-accent bg-paper-accent px-4 py-2 font-humanist text-sm font-semibold text-paper-bg transition-opacity hover:opacity-90"
          >
            Allow analytics
          </button>
        </div>
      </div>
    </div>
  )
}
