"use client"

import { motion } from "framer-motion"

/**
 * Scroll-reveal wrapper — sections and cards animate in on view.
 * Stagger via the `delay` prop. Respects prefers-reduced-motion.
 */
const Reveal = ({
  children,
  delay = 0,
  y = 28,
  className = "",
}: {
  children: React.ReactNode
  delay?: number
  y?: number
  className?: string
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

export default Reveal
