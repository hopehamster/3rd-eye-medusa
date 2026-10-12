import { listCategories } from "@lib/data/categories"
import { listCollections } from "@lib/data/collections"
import { Text, clx } from "@modules/common/components/ui"

import LocalizedClientLink from "@modules/common/components/localized-client-link"

export default async function Footer() {
  const { collections } = await listCollections({
    fields: "*products",
  })
  const productCategories = await listCategories()

  return (
    <footer className="border-t border-cosmos-borderSoft w-full bg-cosmos-surface">
      <div className="content-container flex flex-col w-full">
        <div className="flex flex-col gap-y-10 xsmall:flex-row items-start justify-between py-20">
          <div className="max-w-xs">
            <LocalizedClientLink
              href="/"
              className="font-display text-lg tracking-[0.18em] text-cosmos-text hover:text-cosmos-goldBright transition-colors"
            >
              3RD EYE <span className="text-cosmos-gold">SUPPLY</span>
            </LocalizedClientLink>
            <Text className="mt-4 text-sm leading-relaxed text-cosmos-muted">
              A Las Vegas spiritual goods house. Crystals, wood rings, and
              orgone art — chosen for intention, craft, and beauty.
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
                        <LocalizedClientLink
                          className={clx(
                            "hover:text-cosmos-goldBright transition-colors",
                            children && "txt-small-plus"
                          )}
                          href={`/categories/${c.handle}`}
                          data-testid="category-link"
                        >
                          {c.name}
                        </LocalizedClientLink>
                        {children && (
                          <ul className="grid grid-cols-1 ml-3 gap-2">
                            {children &&
                              children.map((child) => (
                                <li key={child.id}>
                                  <LocalizedClientLink
                                    className="hover:text-cosmos-goldBright transition-colors"
                                    href={`/categories/${child.handle}`}
                                    data-testid="category-link"
                                  >
                                    {child.name}
                                  </LocalizedClientLink>
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
                      <LocalizedClientLink
                        className="hover:text-cosmos-goldBright transition-colors"
                        href={`/collections/${c.handle}`}
                      >
                        {c.title}
                      </LocalizedClientLink>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <div className="flex flex-col gap-y-2">
              <span className="txt-small-plus text-cosmos-text">Studio</span>
              <ul className="grid grid-cols-1 gap-y-2 text-cosmos-muted txt-small">
                <li>
                  <LocalizedClientLink
                    href="/store"
                    className="hover:text-cosmos-goldBright transition-colors"
                  >
                    Shop all
                  </LocalizedClientLink>
                </li>
                <li>
                  <LocalizedClientLink
                    href="/account"
                    className="hover:text-cosmos-goldBright transition-colors"
                  >
                    Account
                  </LocalizedClientLink>
                </li>
                <li>
                  <LocalizedClientLink
                    href="/cart"
                    className="hover:text-cosmos-goldBright transition-colors"
                  >
                    Cart
                  </LocalizedClientLink>
                </li>
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
  )
}
