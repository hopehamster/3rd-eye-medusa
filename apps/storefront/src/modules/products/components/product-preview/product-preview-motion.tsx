"use client"

import { motion, useReducedMotion } from "framer-motion"
import type { ReactNode } from "react"

/**
 * Tile photo zoom on hover (issue #213): the photo grows slightly
 * inside its frame while the pointer is over the tile, and settles back
 * on mouse-out. The tile is the hover target, so the outer element
 * carries whileHover and the photo inherits the "hover" variant.
 * Quiet and short: 0.3s easeOut. Touch pointers never trigger it:
 * motion-dom's hover gesture returns early for touch pointerenter
 * events, so whileHover only fires for mouse/pen.
 *
 * The zoom is clipped by the plain rounded-soft overflow-hidden
 * wrapper, not by the moving element itself: a transformed element
 * clips to its own scaled box, so the clip has to sit outside the
 * scale. The wrapper matches the Thumbnail mat's own radius
 * (rounded-soft).
 *
 * Reduced motion: useReducedMotion() gates whileHover, so a visitor
 * who prefers reduced motion gets no zoom at all — the hover variant
 * is never armed. This matters because MotionConfig
 * reducedMotion="user" does NOT do this: it only forces the
 * transition type to false for transform values (scale included),
 * which applies the final keyframe immediately — the photo would
 * still jump to the hover scale on hover, instantly. The hook-gated pattern is
 * the one the best-sellers row (issue #215) uses. Note
 * useReducedMotion() returns null on the first render / SSR; null is
 * falsy, so the zoom is armed until the client reports the real
 * preference — hover only exists client-side, so a reduced-motion
 * visitor never sees the zoom.
 */
const photoVariants = {
  rest: { scale: 1 },
  hover: { scale: 1.02 },
}

export default function ProductPreviewMotion({
  photo,
  children,
}: {
  photo: ReactNode
  children: ReactNode
}) {
  const prefersReducedMotion = useReducedMotion()

  return (
    <motion.div
      initial="rest"
      animate="rest"
      whileHover={prefersReducedMotion ? undefined : "hover"}
    >
      <div className="rounded-specimen border border-paper-border bg-paper-raised p-3.5 transition-all duration-200 ease-out group-hover:-translate-y-[2px] group-hover:border-paper-accent group-hover:shadow-[0_4px_12px_rgba(35,32,27,0.06)]">
        <div className="rounded-soft overflow-hidden">
          <motion.div
            variants={photoVariants}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            {photo}
          </motion.div>
        </div>
        {children}
      </div>
    </motion.div>
  )
}
