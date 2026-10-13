"use client"

import { motion } from "framer-motion"

/**
 * Scroll-reveal — restrained. Opacity only, no movement.
 * The hero is the signature moment; everything else stays nearly still.
 * The stillness makes the hero land.
 */
const Reveal = ({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode
  delay?: number
  className?: string
}) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.7, ease: "easeOut", delay }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

export default Reveal
