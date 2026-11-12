"use client"

import { motion, useReducedMotion } from "framer-motion"

/**
 * Scroll-reveal — restrained. Opacity only, no movement.
 * The hero is the signature moment; everything else stays nearly still.
 * The stillness makes the hero land.
 *
 * Duration is overridable per use (default 0.7s); quiet sections pass a
 * shorter one so no single fade runs over about half a second.
 *
 * Reduced motion: when the user prefers reduced motion, there is no fade
 * at all — the content renders in its final state, instantly (same
 * pattern as the hero, which skips its entrance entirely).
 */
const Reveal = ({
  children,
  delay = 0,
  duration = 0.7,
  className = "",
}: {
  children: React.ReactNode
  delay?: number
  duration?: number
  className?: string
}) => {
  const prefersReducedMotion = useReducedMotion()

  if (prefersReducedMotion) {
    return <div className={className}>{children}</div>
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration, ease: "easeOut", delay }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

export default Reveal
