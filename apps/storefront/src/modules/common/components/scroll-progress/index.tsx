"use client"

import { motion, useReducedMotion, useScroll } from "framer-motion"
import { useEffect, useMemo, useState } from "react"

/**
 * Scroll progress hairline (issue #254). A 1px gold line pinned to the very
 * top of the viewport fills left to right as the page scrolls. Fixed
 * positioning, so it never shifts page content. Direct scaleX from the
 * scroll progress: no spring, no duration, nothing over half a second by
 * construction.
 *
 * The storefront shell scrolls <main> rather than the document (issue #149),
 * so the scroll source is the shell's scroll area; falling back to the
 * window keeps this working anywhere the shell is not mounted. (Same
 * container pattern as FilmGrain.)
 *
 * With reduced motion preferred, the bar is omitted entirely: a progress
 * line that cannot move conveys nothing, and a static full line would read
 * as a border.
 */
const ScrollProgress = () => {
  const prefersReducedMotion = useReducedMotion()
  const [scrollRoot, setScrollRoot] = useState<HTMLElement | null>(null)
  const container = useMemo(() => ({ current: scrollRoot }), [scrollRoot])

  useEffect(() => {
    setScrollRoot(document.querySelector<HTMLElement>("[data-scroll-root]"))
  }, [])

  const { scrollYProgress } = useScroll(scrollRoot ? { container } : undefined)

  if (prefersReducedMotion) {
    return null
  }

  return (
    <motion.div
      aria-hidden="true"
      style={{ scaleX: scrollYProgress }}
      className="pointer-events-none fixed inset-x-0 top-0 z-50 h-px origin-left bg-cosmos-gold"
    />
  )
}

export default ScrollProgress
