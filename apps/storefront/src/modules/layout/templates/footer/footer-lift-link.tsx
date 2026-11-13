"use client"

import type { ReactNode } from "react"
import { motion, useReducedMotion } from "framer-motion"

import LocalizedClientLink from "@modules/common/components/localized-client-link"

/**
 * Footer link lift (issue #240): every footer link rises 2px on hover,
 * on top of the colour change it already had. Quiet and short: 0.2s,
 * easeOut, well under the half-second house limit.
 *
 * Reduced motion: this is a client component, so it can read the OS
 * preference with useReducedMotion (the #203 pattern). When reduced
 * motion is preferred it passes no whileHover target at all — a true
 * no-op, so the link only changes colour, as before. MotionConfig
 * reducedMotion="user" alone is not enough: framer-motion would still
 * apply the 2px move, just instantly. The guard is the missing target.
 * (The hook cannot run in the footer file itself: that file is an async
 * server component, and the hook needs useState, which does not exist
 * in a server render.)
 *
 * The span is inline-block so the transform applies, and self-start so
 * it shrink-wraps to the link text even inside a flex-column parent
 * (the category rows): without it the span would stretch to the full
 * column width and the link would lift when hovering blank space.
 */
const FooterLiftLink = ({
  href,
  className,
  children,
  ...props
}: {
  href: string
  className?: string
  children: ReactNode
  "data-testid"?: string
}) => {
  const prefersReducedMotion = useReducedMotion()

  return (
    <motion.span
      className="inline-block self-start"
      whileHover={prefersReducedMotion ? undefined : { y: -2 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
    >
      <LocalizedClientLink href={href} className={className} {...props}>
        {children}
      </LocalizedClientLink>
    </motion.span>
  )
}

export default FooterLiftLink
