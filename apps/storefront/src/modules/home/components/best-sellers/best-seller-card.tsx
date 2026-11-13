"use client"

import Image from "next/image"
import { motion, useReducedMotion } from "framer-motion"
import { HttpTypes } from "@medusajs/types"
import { getProductPrice } from "@lib/util/get-product-price"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

/**
 * Best-seller specimen card (issue #215): hovering the card grows its
 * photo to about 105% inside its frame. The card is a motion element
 * with whileHover="hover"; the photo wrapper carries the scale
 * variants, so the zoom fires from anywhere on the card but only the
 * photo moves. The photo wrapper sits absolutely positioned inside the
 * frame, and the frame clips overflow, so the photo never escapes it.
 * Quiet and short: 0.3s, easeOut, well under the half-second limit.
 *
 * Reduced motion: when the visitor prefers reduced motion, whileHover
 * is left off, so there is no zoom at all (same pattern as the gallery
 * zoom, issue #226). useReducedMotion() returns null on the first
 * render / SSR; null is falsy, so the zoom is armed until the client
 * reports the real preference — hover only exists client-side, so a
 * reduced-motion visitor never sees the zoom.
 */
export default function BestSellerCard({
  product,
}: {
  product: HttpTypes.StoreProduct
}) {
  const prefersReducedMotion = useReducedMotion()
  const { cheapestPrice } = getProductPrice({ product })
  const image = product.thumbnail || product.images?.[0]?.url

  return (
    <LocalizedClientLink
      href={`/products/${product.handle}`}
      className="group block"
    >
      <motion.article
        className="specimen-card overflow-hidden transition-colors duration-200 group-hover:border-paper-accent"
        initial="rest"
        animate="rest"
        whileHover={prefersReducedMotion ? undefined : "hover"}
      >
        <div className="relative aspect-square w-full overflow-hidden">
          <motion.div
            className="absolute inset-0"
            variants={{
              rest: { scale: 1 },
              hover: { scale: 1.05 },
            }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
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
          </motion.div>
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
      </motion.article>
    </LocalizedClientLink>
  )
}
