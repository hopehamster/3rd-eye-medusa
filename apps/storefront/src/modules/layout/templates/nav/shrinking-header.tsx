"use client"

import { useEffect, useMemo, useState } from "react"

import { motion, useMotionValueEvent, useReducedMotion, useScroll } from "framer-motion"

const HEADER_HEIGHT = 64
const HEADER_HEIGHT_SCROLLED = 48
const SCROLL_THRESHOLD = 120

/**
 * Header shrink on scroll (issue #237). Once the shell's scroll area has
 * moved past a short threshold, the header shortens from 64px to 48px and
 * its backdrop turns solid; scrolling back restores both. Quiet and short:
 * 0.3s easeOut for the height, the existing 200ms class transition for the
 * backdrop. Nothing over half a second.
 *
 * The shell scrolls <main data-scroll-root>, not the document (issue #149),
 * so the scroll source is that element, the same way FilmGrain reads it;
 * falling back to the page scroll keeps this working anywhere the shell
 * is not mounted.
 *
 * Reduced motion: no shrink at all, and no backdrop change either (the
 * calmer option) — the header stays at its normal height with its usual
 * translucent backdrop. Same guard as the store tiles (#203).
 *
 * This lives in its own client component because Nav is an async Server
 * Component: hooks cannot be colocated in nav/index.tsx (the production
 * build rejects useEffect/useState there). Nav renders this component.
 */
export default function ShrinkingHeader({
  children,
}: {
  children: React.ReactNode
}) {
  const prefersReducedMotion = useReducedMotion()
  const [scrollRoot, setScrollRoot] = useState<HTMLElement | null>(null)
  const container = useMemo(() => ({ current: scrollRoot }), [scrollRoot])

  useEffect(() => {
    setScrollRoot(document.querySelector<HTMLElement>("[data-scroll-root]"))
  }, [])

  const { scrollY } = useScroll(scrollRoot ? { container } : undefined)
  const [scrolled, setScrolled] = useState(false)

  useMotionValueEvent(scrollY, "change", (y) => {
    setScrolled(y > SCROLL_THRESHOLD)
  })

  useEffect(() => {
    if (prefersReducedMotion) {
      setScrolled(false)
    }
  }, [prefersReducedMotion])

  const shrunk = !prefersReducedMotion && scrolled

  return (
    <motion.header
      initial={{ height: HEADER_HEIGHT }}
      animate={{ height: shrunk ? HEADER_HEIGHT_SCROLLED : HEADER_HEIGHT }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={`relative h-16 mx-auto border-b duration-200 ${
        shrunk
          ? "bg-cosmos-bg border-cosmos-borderSoft"
          : "bg-cosmos-bg/90 backdrop-blur-md border-cosmos-borderSoft"
      }`}
    >
      {children}
    </motion.header>
  )
}
