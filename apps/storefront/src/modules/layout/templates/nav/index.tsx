import { Suspense } from "react"

import { listLocales } from "@lib/data/locales"
import { getLocale } from "@lib/data/locale-actions"
import { listRegions } from "@lib/data/regions"
import { StoreRegion } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import CartButton from "@modules/layout/components/cart-button"
import Search from "@modules/layout/components/search"
import SideMenu from "@modules/layout/components/side-menu"
import NavLink from "./nav-link"
import ShrinkingHeader from "./shrinking-header"

export default async function Nav() {
  const [regions, locales, currentLocale] = await Promise.all([
    listRegions().then((regions: StoreRegion[]) => regions),
    listLocales(),
    getLocale(),
  ])

  return (
    <div className="sticky top-0 inset-x-0 z-40 group">
      <ShrinkingHeader>
        <nav className="content-container txt-xsmall-plus font-humanist text-paper-muted flex items-center justify-between w-full h-full text-small-regular">
          <div className="flex-1 basis-0 h-full flex items-center">
            <div className="h-full">
              <SideMenu
                regions={regions}
                locales={locales}
                currentLocale={currentLocale}
              />
            </div>
            <div className="hidden small:flex items-center gap-x-6 h-full ml-2">
              <NavLink
                className="font-humanist text-[12px] font-semibold uppercase tracking-[0.14em] text-paper-muted hover:text-paper-accent px-3 py-2 transition-colors"
                href="/store"
                data-testid="nav-shop-link"
              >
                <span className="inline-block font-humanist text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.18em] text-paper-accent bg-paper-raised border border-paper-border px-2 py-0.5 rounded-soft mr-1.5">
                  I.
                </span>{" "}
                Stones
              </NavLink>
              <NavLink
                className="font-humanist text-[12px] font-semibold uppercase tracking-[0.14em] text-paper-muted hover:text-paper-accent px-3 py-2 transition-colors"
                href="/oracle"
                data-testid="nav-oracle-link"
              >
                <span className="inline-block font-humanist text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.18em] text-paper-accent bg-paper-raised border border-paper-border px-2 py-0.5 rounded-soft mr-1.5">
                  II.
                </span>{" "}
                Oracle
              </NavLink>
              <NavLink
                className="font-humanist text-[12px] font-semibold uppercase tracking-[0.14em] text-paper-muted hover:text-paper-accent px-3 py-2 transition-colors"
                href="/guides"
                data-testid="nav-guides-link"
              >
                <span className="inline-block font-humanist text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.18em] text-paper-accent bg-paper-raised border border-paper-border px-2 py-0.5 rounded-soft mr-1.5">
                  III.
                </span>{" "}
                Canon
              </NavLink>
              <NavLink
                className="font-humanist text-[12px] font-semibold uppercase tracking-[0.14em] text-paper-muted hover:text-paper-accent px-3 py-2 transition-colors"
                href="/ritual-builder"
                data-testid="nav-ritual-link"
              >
                <span className="inline-block font-humanist text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.18em] text-paper-accent bg-paper-raised border border-paper-border px-2 py-0.5 rounded-soft mr-1.5">
                  IV.
                </span>{" "}
                Rituals
              </NavLink>
            </div>
          </div>

          <div className="flex items-center h-full">
            <LocalizedClientLink
              href="/"
              className="flex items-center gap-2.5 font-display text-[20px] tracking-tight font-medium text-paper-text hover:text-paper-accent transition-colors"
              data-testid="nav-store-link"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/logo-mark.png"
                alt=""
                className="h-9 w-auto shrink-0"
              />
              3RD EYE <span className="text-paper-accent">SUPPLY</span>
            </LocalizedClientLink>
          </div>

          <div className="flex items-center gap-x-6 h-full flex-1 basis-0 justify-end">
            <div className="hidden small:flex items-center gap-x-6 h-full">
<NavLink
                className="font-humanist text-[12px] font-semibold uppercase tracking-[0.14em] text-paper-muted hover:text-paper-accent px-3 py-2 transition-colors"
                href="/account"
                data-testid="nav-account-link"
              >
                Account
              </NavLink>
            </div>
            <Suspense
              fallback={
                <LocalizedClientLink
                  className="border border-paper-border bg-paper-raised rounded-specimen px-2.5 py-1 text-[11px] font-semibold text-paper-text hover:border-paper-accent transition-colors flex gap-2"
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
