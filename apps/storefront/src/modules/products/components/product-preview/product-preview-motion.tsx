"use client"

import { motion } from "framer-motion"
import type { ReactNode } from "react"

/**
 * Card hover is zero-motion (appearance addendum, Delta 4, overriding
 * the earlier issue #213 photo zoom): no lift, no shadow, no photo
 * scale on hover. The only hover effect is the card border colour
 * transition on the inner card div (transition-colors). This wrapper
 * keeps the same rendered structure the zoom version had — an outer
 * div and a rounded-soft overflow-hidden clip around the photo — with
 * the whileHover / scale-variant machinery removed.
 */
export default function ProductPreviewMotion({
  photo,
  children,
}: {
  photo: ReactNode
  children: ReactNode
}) {
  return (
    <motion.div>
      <div className="rounded-specimen border border-paper-border bg-paper-raised p-3.5 transition-colors duration-150 group-hover:border-paper-accent">
        <div className="rounded-soft overflow-hidden">
          <motion.div>{photo}</motion.div>
        </div>
        {children}
      </div>
    </motion.div>
  )
}
