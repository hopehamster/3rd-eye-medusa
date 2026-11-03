"use client"

import { usePathname } from "next/navigation"
import { useEffect } from "react"

/**
 * The storefront shell scrolls <main> (see app/layout.tsx), not the document,
 * so Next.js can no longer restore scroll on route change. Reset the shell's
 * scroll area to the top whenever the path changes, and leave hash targets to
 * the browser.
 */
export default function ScrollReset() {
  const pathname = usePathname()

  useEffect(() => {
    const scrollArea = document.querySelector<HTMLElement>(
      "[data-scroll-root]"
    )

    if (scrollArea) {
      scrollArea.scrollTop = 0
      scrollArea.scrollLeft = 0
    }

    window.scrollTo(0, 0)
  }, [pathname])

  return null
}
