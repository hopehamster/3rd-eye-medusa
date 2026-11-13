"use client"

import type { ReactNode } from "react"
import { usePathname } from "next/navigation"
import { motion, useReducedMotion } from "framer-motion"

import LocalizedClientLink from "@modules/common/components/localized-client-link"

/**
 * Nav link underline (issue #239): the link for the page you are on gets
 * a gold underline that draws itself in, growing left to right with
 * scaleX. Quiet and short: 0.3s easeOut, well under the half-second
 * house limit. Navigating away shrinks it back out at the same speed.
 *
 * Active matching is by path prefix, so /store stays active on a product
 * or category page under /store, and /guides stays active on a guide
 * article. The pathname carries the country code first (e.g. /us/store),
 * so that segment is stripped before comparing.
 *
 * Reduced motion: no draw-in at all — the underline is simply present
 * under the active link and absent elsewhere, so the active state is
 * still readable without movement. Same guard as the store tiles (#203)
 * and the footer lift (#240).
 *
 * This lives in its own client component because Nav is an async Server
 * Component: usePathname cannot run in nav/index.tsx (the production
 * build rejects hooks there). Nav renders this component.
 */
const NavLink = ({
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
  const pathname = usePathname()
  const prefersReducedMotion = useReducedMotion()

  const path = pathname?.replace(/^\/[^/]+/, "") || "/"
  const active = path === href || path.startsWith(`${href}/`)

  return (
    <LocalizedClientLink
      href={href}
      className={`${className ?? ""} relative`}
      aria-current={active ? "page" : undefined}
      {...props}
    >
      {children}
      {prefersReducedMotion ? (
        active ? (
          <span className="absolute -bottom-1 left-0 h-px w-full bg-cosmos-gold" />
        ) : null
      ) : (
        <motion.span
          aria-hidden="true"
          className="absolute -bottom-1 left-0 h-px w-full origin-left bg-cosmos-gold"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: active ? 1 : 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        />
      )}
    </LocalizedClientLink>
  )
}

export default NavLink
