"use client"

import { AnimatePresence, motion, useMotionValueEvent, useReducedMotion, useScroll } from "framer-motion"
import { useEffect, useMemo, useState } from "react"

// Show once the visitor has scrolled a long way down, hide once they are
// near the top again. Two thresholds so the button does not flicker when
// the scroll position hovers on one boundary.
const SHOW_THRESHOLD = 600
const HIDE_THRESHOLD = 200

/**
 * Back-to-top button (issue #241). A small round button in the bottom-right
 * corner that fades in after a long scroll down and fades out near the top.
 * Quiet and short: opacity only, 0.3s easeOut. Nothing over half a second.
 *
 * The shell scrolls <main data-scroll-root>, not the document (issue #149),
 * so the scroll source is that element, the same way the shrinking header
 * (#237) and FilmGrain read it; falling back to the page scroll keeps this
 * working anywhere the shell is not mounted.
 *
 * Reduced motion: the button still appears and works, but instantly — no
 * fade — and clicking it jumps straight to the top instead of smooth
 * scrolling. Same useReducedMotion() guard as the hero (#198) and the store
 * tiles (#203).
 *
 * This lives in its own client component because Footer is an async Server
 * Component: hooks cannot be colocated in footer/index.tsx (the production
 * build rejects useEffect/useState there). Footer renders this component.
 */
export default function BackToTop() {
  const prefersReducedMotion = useReducedMotion()
  const [scrollRoot, setScrollRoot] = useState<HTMLElement | null>(null)
  const container = useMemo(() => ({ current: scrollRoot }), [scrollRoot])

  useEffect(() => {
    setScrollRoot(document.querySelector<HTMLElement>("[data-scroll-root]"))
  }, [])

  const { scrollY } = useScroll(scrollRoot ? { container } : undefined)
  const [visible, setVisible] = useState(false)

  useMotionValueEvent(scrollY, "change", (y) => {
    setVisible((prev) =>
      y > SHOW_THRESHOLD ? true : y < HIDE_THRESHOLD ? false : prev
    )
  })

  const scrollToTop = () => {
    const behavior = prefersReducedMotion ? "auto" : "smooth"
    if (scrollRoot) {
      scrollRoot.scrollTo({ top: 0, behavior })
    } else {
      window.scrollTo({ top: 0, behavior })
    }
  }

  const buttonClassName =
    "fixed bottom-[calc(var(--consent-dock)+1.25rem)] right-5 z-50 flex h-10 w-10 items-center justify-center rounded-full border border-cosmos-borderSoft bg-cosmos-surface text-cosmos-text shadow-lg transition-colors hover:border-cosmos-gold hover:text-cosmos-goldBright focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cosmos-gold"

  // Reduced motion: instant show and hide, no fade. The button still
  // appears and disappears at the same thresholds.
  if (prefersReducedMotion) {
    return visible ? (
      <button
        type="button"
        aria-label="Back to top"
        onClick={scrollToTop}
        className={buttonClassName}
      >
        <svg
          aria-hidden="true"
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M3 10l5-5 5 5" />
        </svg>
      </button>
    ) : null
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.button
          type="button"
          aria-label="Back to top"
          onClick={scrollToTop}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className={buttonClassName}
        >
          <svg
            aria-hidden="true"
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M3 10l5-5 5 5" />
          </svg>
        </motion.button>
      )}
    </AnimatePresence>
  )
}
