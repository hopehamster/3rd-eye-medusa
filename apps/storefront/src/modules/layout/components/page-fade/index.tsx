"use client"

import { motion, useReducedMotion } from "framer-motion"

/**
 * Page fade-in (issue #251).
 *
 * The page content fades in once when the page lands, over about 400ms.
 * Quiet and short — opacity only, no movement.
 *
 * Reduced motion: when the user prefers reduced motion, the fade is
 * skipped entirely — the content renders in its final state, no fade
 * (same pattern as the hero, issue #198, and the gallery).
 */
const PageFade = ({ children }: { children: React.ReactNode }) => {
  const prefersReducedMotion = useReducedMotion()

  return (
    <motion.div
      initial={prefersReducedMotion ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  )
}

export default PageFade
