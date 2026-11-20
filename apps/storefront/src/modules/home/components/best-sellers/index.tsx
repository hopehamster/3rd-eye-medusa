import { HttpTypes } from "@medusajs/types"
import { listProducts } from "@lib/data/products"
import { getProductPrice } from "@lib/util/get-product-price"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import BestSellerCard from "./best-seller-card"

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
 *
 * Photo zoom on hover (issue #215): each card is a BestSellerCard —
 * hovering it grows its photo slightly inside its frame, same
 * zoom as the store tiles. See best-seller-card.tsx for the motion
 * and reduced-motion handling.
 *
 * Price tiers (issue #314, Fix 7): the products this section already
 * loads are partitioned at render by cheapest variant price, which
 * the query already carries (*variants.calculated_price, in cents).
 * Pieces under $10 render in their own labelled section directly
 * below — "Cabinet Pieces & Pocket Stones" — instead of sitting as
 * peers beside the specimen pieces in the main grid. Same cards,
 * same links, same fetched set: nothing is added, removed, or
 * hidden from the catalog; a product with no price data stays in
 * the main grid, since it cannot be shown to be a pocket piece.
 */
const POCKET_PRICE_CENTS = 1000 // $10

function isPocketPiece(product: HttpTypes.StoreProduct): boolean {
  const { cheapestPrice } = getProductPrice({ product })
  return (
    cheapestPrice != null &&
    cheapestPrice.calculated_price_number < POCKET_PRICE_CENTS
  )
}

function ProductGrid({ products }: { products: HttpTypes.StoreProduct[] }) {
  return (
    <ul className="grid grid-cols-2 gap-5 small:grid-cols-4">
      {products.map((product) => (
        <li key={product.id}>
          <BestSellerCard product={product} />
        </li>
      ))}
    </ul>
  )
}

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

  const specimenPieces = products.filter((product) => !isPocketPiece(product))
  const pocketPieces = products.filter((product) => isPocketPiece(product))

  return (
    <>
      {specimenPieces.length > 0 && (
        <section className="border-y border-paper-borderSoft paper-grain text-paper-text">
          <div className="content-container relative z-[2] py-16 small:py-24">
            <div className="mb-10 flex flex-wrap items-baseline justify-between gap-4 rounded-specimen border border-paper-border bg-paper-raised px-6 py-5">
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

            <ProductGrid products={specimenPieces} />
          </div>
        </section>
      )}

      {pocketPieces.length > 0 && (
        <section className="border-b border-paper-borderSoft paper-grain text-paper-text">
          <div className="content-container relative z-[2] py-16 small:py-24">
            <div className="mb-10 flex flex-wrap items-baseline justify-between gap-4 rounded-specimen border border-paper-border bg-paper-raised px-6 py-5">
              <h2 className="font-display text-4xl font-light tracking-tight text-paper-text small:text-5xl">
                Cabinet Pieces &amp; Pocket Stones
              </h2>
              <LocalizedClientLink
                href="/store"
                className="font-humanist text-sm font-semibold text-paper-accent hover:text-paper-accentBright"
              >
                See the whole collection
              </LocalizedClientLink>
            </div>

            <ProductGrid products={pocketPieces} />
          </div>
        </section>
      )}
    </>
  )
}
