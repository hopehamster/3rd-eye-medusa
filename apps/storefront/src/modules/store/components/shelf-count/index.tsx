"use client"

import { useEffect } from "react"
import {
  animate,
  motion,
  useMotionValue,
  useReducedMotion,
  useTransform,
} from "framer-motion"

// Count tick, seconds. When a shelf filter changes the visible piece
// count, the number counts up or down to its new value (issue #217)
// instead of swapping instantly — 0.35s, quiet and well under the
// half-second house rule. Only the visible count animates: the shelf
// total never changes for a shelf, so it stays plain text.
const COUNT_TICK_S = 0.35

/**
 * Shelf piece count ("N pieces", or "N of M pieces" while filtering).
 *
 * A client component because the shelf template is a server component
 * and the tick is Framer Motion state. It keeps its identity across
 * soft navigations (pill clicks, Apply, Clear filters), so the motion
 * value survives a filter change and animates from the old count to
 * the new one instead of remounting. First load shows the count as-is
 * with no animation: the motion value starts at the count and the
 * effect only runs when the count actually changes.
 *
 * With prefers-reduced-motion the count swaps instantly, no tick.
 * The wording, pluralisation and data-testid are the template's
 * originals, unchanged.
 */
export default function ShelfCount({
  visible,
  total,
  isFiltering,
}: {
  visible: number
  total: number
  isFiltering: boolean
}) {
  // Null on first render/SSR; the effect below only animates on a real
  // count change, by which time the hook has resolved.
  const prefersReducedMotion = useReducedMotion()
  const count = useMotionValue(visible)
  const rounded = useTransform(count, (value) => String(Math.round(value)))

  useEffect(() => {
    if (count.get() === visible) {
      return
    }
    if (prefersReducedMotion) {
      count.set(visible)
      return
    }
    const controls = animate(count, visible, {
      duration: COUNT_TICK_S,
      ease: "easeOut",
    })
    return () => controls.stop()
  }, [visible, prefersReducedMotion, count])

  return (
    <span
      className="font-humanist text-sm text-paper-muted"
      data-testid="shelf-count"
    >
      <motion.span>{rounded}</motion.span>
      {isFiltering ? (
        <>
          {" "}
          of {total} {total === 1 ? "piece" : "pieces"}
        </>
      ) : (
        <> {total === 1 ? "piece" : "pieces"}</>
      )}
    </span>
  )
}
