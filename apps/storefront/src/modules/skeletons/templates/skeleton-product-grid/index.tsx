"use client"

import { MotionConfig, motion } from "framer-motion"

import repeat from "@lib/util/repeat"
import SkeletonProductPreview from "@modules/skeletons/components/skeleton-product-preview"

const SkeletonProductGrid = ({
  numberOfProducts = 8,
}: {
  numberOfProducts?: number
}) => {
  return (
    <MotionConfig reducedMotion="user">
      <ul
        className="grid grid-cols-2 small:grid-cols-3 medium:grid-cols-4 gap-x-6 gap-y-8 flex-1"
        data-testid="products-list-loader"
      >
        {repeat(numberOfProducts).map((index) => (
          <li key={index} className="relative overflow-hidden">
            <SkeletonProductPreview />
            {/* Soft shimmer (issue #212): a light gradient band sweeps across
              each placeholder tile while search/filter results load. One
              sweep is half a second, then a long pause before the next, so
              it reads as a quiet glint, not motion for its own sake; the
              small per-tile delay staggers the sweep gently down the grid.
              The band always stays mounted, even with reduced motion
              preferred: MotionConfig snaps its sweep to the final keyframe
              instantly, parking it off-screen, so the server and client
              render the same DOM. Removing it conditionally would mismatch
              hydration, because useReducedMotion returns null during SSR. */}
            <motion.div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent"
              initial={{ x: "-100%" }}
              animate={{ x: "100%" }}
              transition={{
                duration: 0.5,
                ease: "easeInOut",
                repeat: Infinity,
                repeatDelay: 1.6,
                delay: Math.min(index * 0.08, 0.4),
              }}
            />
          </li>
        ))}
      </ul>
    </MotionConfig>
  )
}

export default SkeletonProductGrid
