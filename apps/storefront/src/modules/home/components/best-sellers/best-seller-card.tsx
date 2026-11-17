"use client"

import Image from "next/image"
import { motion, useReducedMotion } from "framer-motion"
import { HttpTypes } from "@medusajs/types"
import { getProductPrice } from "@lib/util/get-product-price"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

/**
 * Best-seller specimen card (issue #215): hovering the card grows its
 * photo slightly inside its frame. The card is a motion element
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
        className="specimen-card p-3.5 transition-all duration-200 ease-out group-hover:-translate-y-[2px] group-hover:border-paper-accent group-hover:shadow-[0_4px_12px_rgba(35,32,27,0.06)]"
        initial="rest"
        animate="rest"
        whileHover={prefersReducedMotion ? undefined : "hover"}
      >
        <div className="relative aspect-square w-full overflow-hidden bg-paper-surface border border-paper-borderSoft rounded-soft">
          <motion.div
            className="absolute inset-0"
            variants={{
              rest: { scale: 1 },
              hover: { scale: 1.02 },
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
                className="object-contain p-4"
              />
            )}
          </motion.div>
        </div>
        <div className="pt-3">
          <div className="font-display text-[16px] leading-snug text-paper-text">
            {product.title}
          </div>
          <div className="mt-1.5 flex items-baseline">
            {cheapestPrice && (
              <span className="text-[14px] font-semibold text-paper-accent">
                {cheapestPrice.calculated_price}
              </span>
            )}
          </div>
        </div>
      </motion.article>
    </LocalizedClientLink>
  )
}
