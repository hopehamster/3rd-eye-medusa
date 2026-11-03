import { clx } from "@modules/common/components/ui"

import { getProductPrice } from "@lib/util/get-product-price"
import { HttpTypes } from "@medusajs/types"

/**
 * PDP price on the paper specimen panel.
 *
 * Colour comes from the `paper` token family, not `ui-fg-*`. The storefront
 * sets `data-mode="dark"` / `class="dark"` on <html> (src/app/layout.tsx), so
 * every `text-ui-fg-base` resolves near-white (#F4F4F5) — invisible against the
 * warm cream surface it sits on. Paper pages use paper tokens throughout.
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

  const selectedPrice = variant ? variantPrice : cheapestPrice

  if (!selectedPrice) {
    return <div className="block w-32 h-9 bg-paper-surface animate-pulse" />
  }

  return (
    <div className="flex flex-col text-paper-text">
      <span
        className={clx("text-xl-semi", {
          "text-paper-accent": selectedPrice.price_type === "sale",
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
      {selectedPrice.price_type === "sale" && (
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
