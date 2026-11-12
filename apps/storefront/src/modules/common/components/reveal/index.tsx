"use client"

import { motion, useReducedMotion } from "framer-motion"

/**
 * Scroll-reveal — restrained. Opacity only, no movement.
 * The hero is the signature moment; everything else stays nearly still.
 * The stillness makes the hero land.
 *
 * Reduced motion: renders children immediately with no fade.
 * Duration: 0.7s is the shelves' established fade; new home-section
 * wraps pass 0.5s to comply with the ~0.5s house rule (#230).
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
