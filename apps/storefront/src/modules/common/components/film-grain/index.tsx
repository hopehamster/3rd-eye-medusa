"use client"

import { motion, useScroll, useSpring, useTransform, useVelocity } from "framer-motion"

/**
 * Sitewide film grain that intensifies with scroll velocity.
 * Base 0.03 opacity, up to 0.15 at high scroll speed. Spring-damped.
 * Respects prefers-reduced-motion.
 */
const FilmGrain = () => {
  const { scrollY } = useScroll()
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
