import { HttpTypes } from "@medusajs/types"

import { getProductPrice } from "@lib/util/get-product-price"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Thumbnail from "@modules/products/components/thumbnail"

/**
 * Specimen-style product card for intention shelves (issue #23), built on
 * Agent Palette's apothecary primitives (issue #20): .specimen-card,
 * .specimen-label, .specimen-meta and the paper token group.
 */
export default function ShelfProductCard({
  product,
}: {
  product: HttpTypes.StoreProduct
}) {
  const { cheapestPrice } = getProductPrice({ product })

  return (
    <LocalizedClientLink
      href={`/products/${product.handle}`}
      className="group block"
    >
      <div className="specimen-card p-3 transition-all duration-300 group-hover:-translate-y-1 group-hover:border-paper-accent/50">
        <Thumbnail
          thumbnail={product.thumbnail}
          images={product.images}
          size="full"
          className="!bg-paper-surface !shadow-none !rounded-none overflow-hidden"
        />
        <div className="specimen-label mt-3 flex items-baseline justify-between gap-3 px-1">
          <span>{product.title}</span>
          {cheapestPrice && (
            <span className="shrink-0 font-humanist text-[15px] font-semibold">
              {cheapestPrice.calculated_price}
            </span>
          )}
        </div>
        <p className="specimen-meta px-1 pt-2">
          {product.collection?.title ?? "Natural stone, as pictured"}
        </p>
      </div>
    </LocalizedClientLink>
  )
}
