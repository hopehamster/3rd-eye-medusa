"use client"

import { motion, useReducedMotion } from "framer-motion"
import type { ReactNode } from "react"

type SkeletonShimmerProps = {
  className?: string
  children?: ReactNode
}

// One placeholder block with a soft light sweeping across it, replacing
// the old whole-block blink (animate-pulse). The sweep itself is 0.5s,
// quiet, with a pause between passes. When reduced motion is preferred
// the block renders static: no sweep, no blink.
const SkeletonShimmer = ({ className, children }: SkeletonShimmerProps) => {
  const prefersReducedMotion = useReducedMotion()

  return (
    <div className={`relative overflow-hidden ${className ?? ""}`}>
      {children}
      {!prefersReducedMotion && (
        <motion.div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 w-1/2 bg-[linear-gradient(100deg,transparent_0%,rgba(255,255,255,0.45)_50%,transparent_100%)]"
          initial={{ x: "-100%" }}
          animate={{ x: "200%" }}
          transition={{
            duration: 0.5,
            ease: "easeInOut",
            repeat: Infinity,
            repeatDelay: 1.5,
          }}
        />
      )}
    </div>
  )
}

export default SkeletonShimmer
