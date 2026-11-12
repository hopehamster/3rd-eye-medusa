import { listCategories } from "@lib/data/categories"
import { listCollections } from "@lib/data/collections"
import { Text, clx } from "@modules/common/components/ui"
import { MotionConfig, motion } from "framer-motion"

import LocalizedClientLink from "@modules/common/components/localized-client-link"

/**
 * Footer link lift (issue #240): every footer link rises 2px on hover,
 * on top of the colour change it already had. Quiet and short: 0.2s,
 * easeOut, well under the half-second house limit.
 *
 * Reduced motion: this file is an async server component (it fetches
 * collections and categories), so the useReducedMotion hook cannot run
 * here — it is a client hook. The guard is MotionConfig
 * reducedMotion="user" instead, framer-motion's own mechanism: with
 * "user", transform animations are disabled when the OS prefers reduced
 * motion, so the lift becomes a no-op and the link only changes colour,
 * as today. The wrapper span is inline-block so the transform applies.
 */
const FooterLiftLink = ({
  href,
  className,
  children,
  ...props
}: {
  href: string
  className?: string
  children: React.ReactNode
  "data-testid"?: string
}) => (
  <motion.span
    className="inline-block"
    whileHover={{ y: -2 }}
    transition={{ duration: 0.2, ease: "easeOut" }}
  >
    <LocalizedClientLink href={href} className={className} {...props}>
      {children}
    </LocalizedClientLink>
  </motion.span>
)

export default async function Footer() {
  const { collections } = await listCollections({
    fields: "*products",
  })
  const productCategories = await listCategories()

  return (
    <MotionConfig reducedMotion="user">
      <footer className="border-t border-cosmos-borderSoft w-full bg-cosmos-surface">
        <div className="content-container flex flex-col w-full">
          <div className="flex flex-col gap-y-10 xsmall:flex-row items-start justify-between py-20">
            <div className="max-w-xs">
              <FooterLiftLink
                href="/"
                className="font-display text-lg tracking-[0.18em] text-cosmos-text hover:text-cosmos-goldBright transition-colors"
              >
                3RD EYE <span className="text-cosmos-gold">SUPPLY</span>
              </FooterLiftLink>
              <Text className="mt-4 text-sm leading-relaxed text-cosmos-muted">
                Curated crystals, ritual objects, and spiritual goods — chosen
                for intention and beauty, shipped directly to you.
              </Text>
            </div>
            <div className="text-small-regular gap-10 md:gap-x-16 grid grid-cols-2 sm:grid-cols-3">
              {productCategories && productCategories?.length > 0 && (
                <div className="flex flex-col gap-y-2">
                  <span className="txt-small-plus text-cosmos-text">
                    Categories
                  </span>
                  <ul
                    className="grid grid-cols-1 gap-2"
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
                        <li
                          className="flex flex-col gap-2 text-cosmos-muted txt-small"
                          key={c.id}
                        >
                          <FooterLiftLink
                            className={clx(
                              "hover:text-cosmos-goldBright transition-colors",
                              children && "txt-small-plus"
                            )}
                            href={`/categories/${c.handle}`}
                            data-testid="category-link"
                          >
                            {c.name}
                          </FooterLiftLink>
                          {children && (
                            <ul className="grid grid-cols-1 ml-3 gap-2">
                              {children &&
                                children.map((child) => (
                                  <li key={child.id}>
                                    <FooterLiftLink
                                      className="hover:text-cosmos-goldBright transition-colors"
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
                <div className="flex flex-col gap-y-2">
                  <span className="txt-small-plus text-cosmos-text">
                    Collections
                  </span>
                  <ul
                    className={clx(
                      "grid grid-cols-1 gap-2 text-cosmos-muted txt-small",
                      {
                        "grid-cols-2": (collections?.length || 0) > 3,
                      }
                    )}
                  >
                    {collections?.slice(0, 6).map((c) => (
                      <li key={c.id}>
                        <FooterLiftLink
                          className="hover:text-cosmos-goldBright transition-colors"
                          href={`/collections/${c.handle}`}
                        >
                          {c.title}
                        </FooterLiftLink>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <div className="flex flex-col gap-y-2">
                <span className="txt-small-plus text-cosmos-text">Explore</span>
                <ul className="grid grid-cols-1 gap-y-2 text-cosmos-muted txt-small">
                  <li>
                    <FooterLiftLink
                      href="/oracle"
                      className="hover:text-cosmos-goldBright transition-colors"
                    >
                      The Oracle
                    </FooterLiftLink>
                  </li>
                  <li>
                    <FooterLiftLink
                      href="/ritual-builder"
                      className="hover:text-cosmos-goldBright transition-colors"
                    >
                      Ritual Builder
                    </FooterLiftLink>
                  </li>
                  <li>
                    <FooterLiftLink
                      href="/guides"
                      className="hover:text-cosmos-goldBright transition-colors"
                    >
                      Guides
                    </FooterLiftLink>
                  </li>
                </ul>
              </div>
              <div className="flex flex-col gap-y-2">
                <span className="txt-small-plus text-cosmos-text">Studio</span>
                <ul className="grid grid-cols-1 gap-y-2 text-cosmos-muted txt-small">
                  <li>
                    <FooterLiftLink
                      href="/store"
                      className="hover:text-cosmos-goldBright transition-colors"
                    >
                      Shop all
                    </FooterLiftLink>
                  </li>
                  <li>
                    <FooterLiftLink
                      href="/account"
                      className="hover:text-cosmos-goldBright transition-colors"
                    >
                      Account
                    </FooterLiftLink>
                  </li>
                  <li>
                    <FooterLiftLink
                      href="/cart"
                      className="hover:text-cosmos-goldBright transition-colors"
                    >
                      Cart
                    </FooterLiftLink>
                  </li>
                </ul>
              </div>
              <div className="flex flex-col gap-y-2">
                <span className="txt-small-plus text-cosmos-text">Policies</span>
                <ul className="grid grid-cols-1 gap-y-2 text-cosmos-muted txt-small">
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
                        className="hover:text-cosmos-goldBright transition-colors"
                      >
                        {link.label}
                      </FooterLiftLink>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
          <div className="gold-hairline w-full" aria-hidden="true" />
          <div className="flex w-full my-8 justify-between text-cosmos-faint items-center">
            <Text className="txt-compact-small">
              © {new Date().getFullYear()} 3rd Eye Supply · Las Vegas, NV. All
              rights reserved.
            </Text>
            <Text className="txt-compact-small hidden small:block">
              Intention · Craft · Beauty
            </Text>
          </div>
        </div>
      </footer>
    </MotionConfig>
  )
}
