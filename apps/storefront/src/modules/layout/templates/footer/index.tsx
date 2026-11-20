import { listCategories } from "@lib/data/categories"
import { listCollections } from "@lib/data/collections"
import { Text, clx } from "@modules/common/components/ui"
import { MotionConfig } from "framer-motion"

import BackToTop from "@modules/layout/templates/footer/back-to-top"
import FooterLiftLink from "./footer-lift-link"

/**
 * Footer link lift (issue #240): every footer link rises 2px on hover,
 * on top of the colour change it already had. Quiet and short: 0.2s,
 * easeOut, well under the half-second house limit.
 *
 * Reduced motion: the lift lives in FooterLiftLink
 * (./footer-lift-link.tsx), a client component that reads the OS
 * preference with useReducedMotion (the #203 pattern) and passes no
 * whileHover target at all when reduced motion is preferred — a true
 * no-op, so the link only changes colour, as before. MotionConfig
 * reducedMotion="user" below is only a backstop for any other transform
 * animation in the footer: on its own it would NOT make the lift a
 * no-op, because framer-motion still applies the target value, just
 * instantly. This file stays an async server component (it fetches
 * collections and categories), so the hook cannot run here.
 */
export default async function Footer() {
  const { collections } = await listCollections({
    fields: "*products",
  })
  const productCategories = await listCategories()

  return (
    <MotionConfig reducedMotion="user">
      <footer className="relative z-[5] bg-paper-surface border-t border-paper-border pt-16 pb-12 px-6 sm:px-12 w-full">
        <div className="content-container flex flex-col w-full">
          <div className="flex flex-col gap-y-10 xsmall:flex-row items-start justify-between">
            <div className="max-w-xs">
              <FooterLiftLink
                href="/"
                className="font-display text-[20px] tracking-tight font-medium text-paper-text hover:text-paper-accent transition-colors"
              >
                3RD EYE <span className="text-paper-accent">SUPPLY</span>
              </FooterLiftLink>
              <Text className="mt-4 font-humanist text-sm leading-relaxed text-paper-muted">
                Curated crystals, ritual objects, and spiritual goods — chosen
                for intention and beauty, shipped directly to you.
              </Text>
            </div>
            <div className="font-humanist gap-10 md:gap-x-16 grid grid-cols-2 sm:grid-cols-3">
              {productCategories && productCategories?.length > 0 && (
                <div className="flex flex-col">
                  <span className="font-display text-[15px] font-normal text-paper-text mb-4 pb-2 border-b border-paper-border">
                    Categories
                  </span>
                  <ul
                    className="grid grid-cols-1"
                    data-testid="footer-categories"
                  >
                    {productCategories?.slice(0, 6).map((c) => {
                      if (c.parent_category) {
                        return
                      }

                      const children =
                        c.category_children?.map((child) => ({
                          name: child.name,
                          handle: child.handle,
                          id: child.id,
                        })) || null

                      return (
                        <li className="flex flex-col" key={c.id}>
                          <FooterLiftLink
                            className={clx(
                              "font-humanist text-[13px] text-paper-muted leading-relaxed block hover:text-paper-accent hover:translate-x-0.5 transition-all mb-2.5",
                              children && "font-semibold"
                            )}
                            href={`/categories/${c.handle}`}
                            data-testid="category-link"
                          >
                            {c.name}
                          </FooterLiftLink>
                          {children && (
                            <ul className="grid grid-cols-1 ml-3">
                              {children &&
                                children.map((child) => (
                                  <li key={child.id}>
                                    <FooterLiftLink
                                      className="font-humanist text-[13px] text-paper-muted leading-relaxed block hover:text-paper-accent hover:translate-x-0.5 transition-all mb-2.5"
                                      href={`/categories/${child.handle}`}
                                      data-testid="category-link"
                                    >
                                      {child.name}
                                    </FooterLiftLink>
                                  </li>
                                ))}
                            </ul>
                          )}
                        </li>
                      )
                    })}
                  </ul>
                </div>
              )}
              {collections && collections.length > 0 && (
                <div className="flex flex-col">
                  <span className="font-display text-[15px] font-normal text-paper-text mb-4 pb-2 border-b border-paper-border">
                    Collections
                  </span>
                  <ul
                    className={clx("grid grid-cols-1", {
                      "grid-cols-2": (collections?.length || 0) > 3,
                    })}
                  >
                    {collections?.slice(0, 6).map((c) => (
                      <li key={c.id}>
                        <FooterLiftLink
                          className="font-humanist text-[13px] text-paper-muted leading-relaxed block hover:text-paper-accent hover:translate-x-0.5 transition-all mb-2.5"
                          href={`/collections/${c.handle}`}
                        >
                          {c.title}
                        </FooterLiftLink>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <div className="flex flex-col">
                <span className="font-display text-[15px] font-normal text-paper-text mb-4 pb-2 border-b border-paper-border">
                  Explore
                </span>
                <ul className="grid grid-cols-1">
                  <li>
                    <FooterLiftLink
                      href="/oracle"
                      className="font-humanist text-[13px] text-paper-muted leading-relaxed block hover:text-paper-accent hover:translate-x-0.5 transition-all mb-2.5"
                    >
                      The Oracle
                    </FooterLiftLink>
                  </li>
                  <li>
                    <FooterLiftLink
                      href="/ritual-builder"
                      className="font-humanist text-[13px] text-paper-muted leading-relaxed block hover:text-paper-accent hover:translate-x-0.5 transition-all mb-2.5"
                    >
                      Ritual Builder
                    </FooterLiftLink>
                  </li>
                  <li>
                    <FooterLiftLink
                      href="/guides"
                      className="font-humanist text-[13px] text-paper-muted leading-relaxed block hover:text-paper-accent hover:translate-x-0.5 transition-all mb-2.5"
                    >
                      Canon
                    </FooterLiftLink>
                  </li>
                </ul>
              </div>
              <div className="flex flex-col">
                <span className="font-display text-[15px] font-normal text-paper-text mb-4 pb-2 border-b border-paper-border">
                  Studio
                </span>
                <ul className="grid grid-cols-1">
                  <li>
                    <FooterLiftLink
                      href="/store"
                      className="font-humanist text-[13px] text-paper-muted leading-relaxed block hover:text-paper-accent hover:translate-x-0.5 transition-all mb-2.5"
                    >
                      Shop all
                    </FooterLiftLink>
                  </li>
                  <li>
                    <FooterLiftLink
                      href="/account"
                      className="font-humanist text-[13px] text-paper-muted leading-relaxed block hover:text-paper-accent hover:translate-x-0.5 transition-all mb-2.5"
                    >
                      Account
                    </FooterLiftLink>
                  </li>
                  <li>
                    <FooterLiftLink
                      href="/cart"
                      className="font-humanist text-[13px] text-paper-muted leading-relaxed block hover:text-paper-accent hover:translate-x-0.5 transition-all mb-2.5"
                    >
                      Cart
                    </FooterLiftLink>
                  </li>
                </ul>
              </div>
              <div className="flex flex-col">
                <span className="font-display text-[15px] font-normal text-paper-text mb-4 pb-2 border-b border-paper-border">
                  Policies
                </span>
                <ul className="grid grid-cols-1">
                  {[
                    { href: "/shipping", label: "Shipping" },
                    { href: "/returns", label: "Returns" },
                    { href: "/terms", label: "Terms" },
                    { href: "/privacy", label: "Privacy" },
                    { href: "/contact", label: "Contact" },
                  ].map((link) => (
                    <li key={link.href}>
                      <FooterLiftLink
                        href={link.href}
                        className="font-humanist text-[13px] text-paper-muted leading-relaxed block hover:text-paper-accent hover:translate-x-0.5 transition-all mb-2.5"
                      >
                        {link.label}
                      </FooterLiftLink>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
          <div className="flex w-full mt-12 pt-6 border-t border-paper-borderSoft justify-between items-center font-humanist text-[11px] text-paper-faint">
            <Text>
              © {new Date().getFullYear()} 3rd Eye Supply · Las Vegas, NV. All
              rights reserved.
            </Text>
            <Text className="hidden small:block">
              Intention · Craft · Beauty
            </Text>
          </div>
        </div>
        <BackToTop />
      </footer>
    </MotionConfig>
  )
}
