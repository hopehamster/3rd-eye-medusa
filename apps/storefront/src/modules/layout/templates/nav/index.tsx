import { Suspense, useEffect, useMemo, useState } from "react"

import { motion, useMotionValueEvent, useReducedMotion, useScroll } from "framer-motion"
import { listLocales } from "@lib/data/locales"
import { getLocale } from "@lib/data/locale-actions"
import { listRegions } from "@lib/data/regions"
import { StoreRegion } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import CartButton from "@modules/layout/components/cart-button"
import Search from "@modules/layout/components/search"
import SideMenu from "@modules/layout/components/side-menu"

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
 */
function ShrinkingHeader({ children }: { children: React.ReactNode }) {
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

export default async function Nav() {
  const [regions, locales, currentLocale] = await Promise.all([
    listRegions().then((regions: StoreRegion[]) => regions),
    listLocales(),
    getLocale(),
  ])

  return (
    <div className="sticky top-0 inset-x-0 z-50 group">
      <ShrinkingHeader>
        <nav className="content-container txt-xsmall-plus text-cosmos-muted flex items-center justify-between w-full h-full text-small-regular">
          <div className="flex-1 basis-0 h-full flex items-center">
            <div className="h-full">
              <SideMenu
                regions={regions}
                locales={locales}
                currentLocale={currentLocale}
              />
            </div>
            <div className="hidden small:flex items-center gap-x-6 h-full ml-2">
              <LocalizedClientLink
                className="hover:text-cosmos-text transition-colors text-[13px] tracking-wide"
                href="/store"
                data-testid="nav-shop-link"
              >
                <span className="text-cosmos-faint mr-1">I.</span> Stones
              </LocalizedClientLink>
              <LocalizedClientLink
                className="hover:text-cosmos-text transition-colors text-[13px] tracking-wide"
                href="/oracle"
                data-testid="nav-oracle-link"
              >
                <span className="text-cosmos-faint mr-1">II.</span> Oracle
              </LocalizedClientLink>
              <LocalizedClientLink
                className="hover:text-cosmos-text transition-colors text-[13px] tracking-wide"
                href="/guides"
                data-testid="nav-guides-link"
              >
                <span className="text-cosmos-faint mr-1">III.</span> Canon
              </LocalizedClientLink>
              <LocalizedClientLink
                className="hover:text-cosmos-text transition-colors text-[13px] tracking-wide"
                href="/ritual-builder"
                data-testid="nav-ritual-link"
              >
                <span className="text-cosmos-faint mr-1">IV.</span> Rituals
              </LocalizedClientLink>
            </div>
          </div>

          <div className="flex items-center h-full">
            <LocalizedClientLink
              href="/"
              className="font-display text-xl tracking-[0.18em] text-cosmos-text hover:text-cosmos-goldBright transition-colors"
              data-testid="nav-store-link"
            >
              3RD EYE <span className="text-cosmos-gold">SUPPLY</span>
            </LocalizedClientLink>
          </div>

          <div className="flex items-center gap-x-6 h-full flex-1 basis-0 justify-end">
            <div className="hidden small:flex items-center gap-x-6 h-full">
              <LocalizedClientLink
                className="hover:text-cosmos-text transition-colors text-[13px] tracking-wide"
                href="/account"
                data-testid="nav-account-link"
              >
                Account
              </LocalizedClientLink>
            </div>
            <Suspense
              fallback={
                <LocalizedClientLink
                  className="hover:text-cosmos-text transition-colors flex gap-2 text-[13px] tracking-wide"
                  href="/cart"
                  data-testid="nav-cart-link"
                >
                  Cart (0)
                </LocalizedClientLink>
              }
            >
              <CartButton />
            </Suspense>
            <Search />
          </div>
        </nav>
      </ShrinkingHeader>
    </div>
  )
}
