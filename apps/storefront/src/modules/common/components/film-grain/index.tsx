"use client"

import { motion, useScroll, useSpring, useTransform, useVelocity } from "framer-motion"
import { useEffect, useMemo, useState } from "react"

/**
 * Sitewide film grain that intensifies with scroll velocity.
 * Base 0.03 opacity, up to 0.15 at high scroll speed. Spring-damped.
 * Respects prefers-reduced-motion.
 *
 * The storefront shell scrolls <main> rather than the document (issue #149),
 * so the scroll source is the shell's scroll area; falling back to the window
 * keeps this working anywhere the shell is not mounted.
 */
const FilmGrain = () => {
  const [scrollRoot, setScrollRoot] = useState<HTMLElement | null>(null)
  const container = useMemo(() => ({ current: scrollRoot }), [scrollRoot])

  useEffect(() => {
    setScrollRoot(document.querySelector<HTMLElement>("[data-scroll-root]"))
  }, [])

  const { scrollY } = useScroll(scrollRoot ? { container } : undefined)
  const scrollVelocity = useVelocity(scrollY)
  const smoothVelocity = useSpring(scrollVelocity, { damping: 50, stiffness: 400 })
  const opacity = useTransform(smoothVelocity, [-2000, 0, 2000], [0.15, 0.03, 0.15])

  return (
    <motion.div
      aria-hidden="true"
      style={{ opacity }}
      className="pointer-events-none fixed inset-0 z-[9999] mix-blend-overlay motion-reduce:hidden"
    >
      <svg className="h-full w-full">
        <filter id="site-grain">
          <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" stitchTiles="stitch" />
        </filter>
        <rect width="100%" height="100%" filter="url(#site-grain)" />
      </svg>
    </motion.div>
  )
}

export default FilmGrain