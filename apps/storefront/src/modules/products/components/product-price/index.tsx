import { clx } from "@modules/common/components/ui"

import { getProductPrice } from "@lib/util/get-product-price"
import SkeletonShimmer from "@modules/skeletons/components/skeleton-shimmer"
import { HttpTypes } from "@medusajs/types"

/**
 * PDP price on the paper specimen panel.
 *
 * Colour comes from the `paper` token family, not `ui-fg-*`. The storefront
 * sets `data-mode="dark"` / `class="dark"` on <html> (src/app/layout.tsx), so
 * every `text-ui-fg-base` resolves near-white (#F4F4F5) — invisible against the
 * warm cream surface it sits on. Paper pages use paper tokens throughout.
 *
 * Compare-at is shown only when the backend says the price is a sale AND
 * the original price is actually above the sale price. A sale flag with no
 * real discount never renders a struck-through price or a percent off.
 */
export default function ProductPrice({
  product,
  variant,
}: {
  product: HttpTypes.StoreProduct
  variant?: HttpTypes.StoreProductVariant
}) {
  const { cheapestPrice, variantPrice } = getProductPrice({
    product,
    variantId: variant?.id,
  })

  // A selected variant without a calculated price falls back to the
  // cheapest price instead of showing the loading pulse forever.
  const selectedPrice = variantPrice || cheapestPrice

  if (!selectedPrice) {
    return <SkeletonShimmer className="block w-32 h-9 bg-paper-surface" />
  }

  const isSale =
    selectedPrice.price_type === "sale" &&
    selectedPrice.original_price_number > selectedPrice.calculated_price_number

  return (
    <div className="flex flex-col text-paper-text">
      <span
        className={clx("text-xl-semi", {
          "text-paper-accent": isSale,
        })}
      >
        {!variant && "From "}
        <span
          data-testid="product-price"
          data-value={selectedPrice.calculated_price_number}
        >
          {selectedPrice.calculated_price}
        </span>
      </span>
      {isSale && (
        <>
          <p>
            <span className="text-paper-muted">Original: </span>
            <span
              className="line-through"
              data-testid="original-product-price"
              data-value={selectedPrice.original_price_number}
            >
              {selectedPrice.original_price}
            </span>
          </p>
          <span className="text-paper-accent">
            -{selectedPrice.percentage_diff}%
          </span>
        </>
      )}
    </div>
  )
}
