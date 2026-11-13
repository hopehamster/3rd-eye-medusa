"use client"

import { AnimatePresence, motion, useReducedMotion } from "framer-motion"
import { clx } from "@modules/common/components/ui"

import { getProductPrice } from "@lib/util/get-product-price"
import SkeletonShimmer from "@modules/skeletons/components/skeleton-shimmer"
import { HttpTypes } from "@medusajs/types"

// Price fade, seconds. Picking a different variant crossfades the old
// price out and the new one in (issue #219), each leg 0.3s — quiet and
// well under the half-second house rule. Matches the image-gallery tab
// crossfade (#200) shape: AnimatePresence with initial={false}, keyed
// motion element, reduced motion respected.
const PRICE_FADE_S = 0.3

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
 *
 * When the displayed price changes (a different variant is picked), the
 * old price fades out and the new one fades in instead of swapping
 * instantly. The price element is keyed by the displayed price string,
 * so the fade runs only on a real price change — same price, no motion —
 * and never on first load. With prefers-reduced-motion the swap is
 * instant, no fade. The compare-at block is not part of the fade;
 * it is owned by issue #221.
 */
export default function ProductPrice({
  product,
  variant,
}: {
  product: HttpTypes.StoreProduct
  variant?: HttpTypes.StoreProductVariant
}) {
  // Null on first render/SSR; AnimatePresence initial={false} covers the
  // mount, and by the time a variant is picked the hook has resolved.
  const prefersReducedMotion = useReducedMotion()

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
        <AnimatePresence initial={false} mode="popLayout">
          <motion.span
            key={selectedPrice.calculated_price}
            data-testid="product-price"
            data-value={selectedPrice.calculated_price_number}
            initial={prefersReducedMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{
              duration: prefersReducedMotion ? 0 : PRICE_FADE_S,
              ease: "easeInOut",
            }}
          >
            {selectedPrice.calculated_price}
          </motion.span>
        </AnimatePresence>
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
