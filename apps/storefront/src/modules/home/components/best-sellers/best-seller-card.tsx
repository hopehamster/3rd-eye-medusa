"use client"

import Image from "next/image"
import { motion } from "framer-motion"
import { HttpTypes } from "@medusajs/types"
import { getProductPrice } from "@lib/util/get-product-price"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

/**
 * Best-seller specimen card. Card hover is zero-motion (appearance
 * addendum, Delta 4, overriding the earlier issue #215 photo zoom):
 * no lift, no shadow, no photo scale on hover. The only hover effect
 * is the card border colour transition. The photo wrapper sits
 * absolutely positioned inside the frame, and the frame clips
 * overflow, so the photo never escapes it.
 */
export default function BestSellerCard({
  product,
}: {
  product: HttpTypes.StoreProduct
}) {
  const { cheapestPrice } = getProductPrice({ product })
  const image = product.thumbnail || product.images?.[0]?.url

  return (
    <LocalizedClientLink
      href={`/products/${product.handle}`}
      className="group block"
    >
      <motion.article className="specimen-card p-3.5 transition-colors duration-150 group-hover:border-paper-accent">
        <div className="relative aspect-square w-full overflow-hidden bg-paper-surface border border-paper-borderSoft rounded-soft">
          <motion.div className="absolute inset-0">
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
