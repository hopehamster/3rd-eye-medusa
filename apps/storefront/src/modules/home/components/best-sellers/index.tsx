import Image from "next/image"
import { HttpTypes } from "@medusajs/types"
import { listProducts } from "@lib/data/products"
import { getProductPrice } from "@lib/util/get-product-price"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

/**
 * Featured row (issue #21) — live products in specimen cards.
 *
 * NOTE on the label: there is no sales-velocity data source yet, so
 * this renders the current published catalog selection under an
 * honest "From the shelves" heading. When order data exists, a real
 * best-sellers ranking can replace the selection. Flagged for the
 * coordinator / Agent Voice.
 * Product photography: Agent Daylight (issue #22) replaces thumbnails
 * catalog-wide; this row inherits the new shots automatically.
 */
export default async function BestSellers({
  region,
}: {
  region: HttpTypes.StoreRegion
}) {
  const {
    response: { products },
  } = await listProducts({
    regionId: region.id,
    queryParams: {
      limit: 8,
      fields: "*variants.calculated_price",
    },
  })

  if (!products?.length) {
    return null
  }

  return (
    <section className="border-y border-paper-borderSoft bg-paper-surface paper-grain text-paper-text">
      <div className="content-container relative z-[2] py-16 small:py-24">
        <div className="mb-10 flex flex-wrap items-baseline justify-between gap-4">
          <h2 className="font-display text-4xl font-light tracking-tight text-paper-text small:text-5xl">
            From the shelves
          </h2>
          <LocalizedClientLink
            href="/store"
            className="font-humanist text-sm font-semibold text-paper-accent hover:text-paper-accentBright"
          >
            See the whole collection
          </LocalizedClientLink>
        </div>

        <ul className="grid grid-cols-2 gap-5 small:grid-cols-4">
          {products.map((product) => {
            const { cheapestPrice } = getProductPrice({ product })
            const image = product.thumbnail || product.images?.[0]?.url
            return (
              <li key={product.id}>
                <LocalizedClientLink
                  href={`/products/${product.handle}`}
                  className="group block"
                >
                  <article className="specimen-card overflow-hidden transition-colors duration-200 group-hover:border-paper-accent">
                    <div className="relative aspect-square w-full overflow-hidden">
                      {image && (
                        <Image
                          src={image}
                          alt={product.title}
                          fill
                          loading="lazy"
                          sizes="(max-width: 1024px) 50vw, 25vw"
                          className="object-cover"
                        />
                      )}
                    </div>
                    <div className="px-4 pb-4 pt-3">
                      <div className="specimen-label !py-2 text-base">
                        {product.title}
                      </div>
                      <div className="mt-2 flex items-baseline justify-end">
                        {cheapestPrice && (
                          <span className="font-humanist text-sm font-semibold text-paper-text">
                            {cheapestPrice.calculated_price}
                          </span>
                        )}
                      </div>
                    </div>
                  </article>
                </LocalizedClientLink>
              </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}
