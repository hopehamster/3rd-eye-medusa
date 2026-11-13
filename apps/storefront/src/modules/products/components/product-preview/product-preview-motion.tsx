"use client"

import { motion, useReducedMotion } from "framer-motion"
import type { ReactNode } from "react"

/**
 * Tile photo zoom on hover (issue #213): the photo grows to about 105%
 * inside its frame while the pointer is over the tile, and settles back
 * on mouse-out. The tile is the hover target, so the outer element
 * carries whileHover and the photo inherits the "hover" variant.
 * Quiet and short: 0.3s easeOut. Touch pointers never trigger it:
 * motion-dom's hover gesture returns early for touch pointerenter
 * events, so whileHover only fires for mouse/pen.
 *
 * The zoom is clipped by the plain rounded-large overflow-hidden
 * wrapper, not by the moving element itself: a transformed element
 * clips to its own scaled box, so the clip has to sit outside the
 * scale. The wrapper matches the frame's own radius — the Thumbnail
 * carries both rounded-base and rounded-large, and the built CSS puts
 * rounded-large (16px) later, so rounded-large wins.
 *
 * Reduced motion: useReducedMotion() gates whileHover, so a visitor
 * who prefers reduced motion gets no zoom at all — the hover variant
 * is never armed. This matters because MotionConfig
 * reducedMotion="user" does NOT do this: it only forces the
 * transition type to false for transform values (scale included),
 * which applies the final keyframe immediately — the photo would
 * still jump to 105% on hover, instantly. The hook-gated pattern is
 * the one the best-sellers row (issue #215) uses. Note
 * useReducedMotion() returns null on the first render / SSR; null is
 * falsy, so the zoom is armed until the client reports the real
 * preference — hover only exists client-side, so a reduced-motion
 * visitor never sees the zoom.
 */
const photoVariants = {
  rest: { scale: 1 },
  hover: { scale: 1.05 },
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
      <div className="rounded-large border border-cosmos-borderSoft bg-cosmos-surface p-3 transition-all duration-300 ease-out group-hover:-translate-y-1 group-hover:border-cosmos-border group-hover:shadow-[0_16px_48px_rgba(0,0,0,0.45)]">
        <div className="rounded-large overflow-hidden">
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
