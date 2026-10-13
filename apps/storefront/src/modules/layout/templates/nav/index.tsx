import { Suspense } from "react"

import { listLocales } from "@lib/data/locales"
import { getLocale } from "@lib/data/locale-actions"
import { listRegions } from "@lib/data/regions"
import { StoreRegion } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import CartButton from "@modules/layout/components/cart-button"
import Search from "@modules/layout/components/search"
import SideMenu from "@modules/layout/components/side-menu"

export default async function Nav() {
  const [regions, locales, currentLocale] = await Promise.all([
    listRegions().then((regions: StoreRegion[]) => regions),
    listLocales(),
    getLocale(),
  ])

  return (
    <div className="sticky top-0 inset-x-0 z-50 group">
      <header className="relative h-16 mx-auto border-b duration-200 bg-cosmos-bg/90 backdrop-blur-md border-cosmos-borderSoft">
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
                className="hover:text-cosmos-text transition-colors text-[13px] tracking-wide text-cosmos-gold"
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
      </header>
    </div>
  )
}
