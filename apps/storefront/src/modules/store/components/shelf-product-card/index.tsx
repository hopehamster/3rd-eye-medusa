"use client"

import { motion } from "framer-motion"
import { HttpTypes } from "@medusajs/types"

import { getProductPrice } from "@lib/util/get-product-price"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import QuickAdd from "@modules/products/components/quick-add"
import Thumbnail from "@modules/products/components/thumbnail"

/**
 * Specimen-style product card for intention shelves (issue #23), built on
 * Agent Palette's apothecary primitives (issue #20): .specimen-card,
 * .specimen-label, .specimen-meta and the paper token group.
 *
 * Glide on filter/sort (issue #201): the card is a motion element with
 * layout="position", so when the shelf reorders it glides to its new spot
 * instead of snapping there. The motion wrapper sits outside the link, so
 * the hover lift (Tailwind translate on the inner card) and the Quick Add
 * inside it are untouched — Framer Motion only writes transforms on the
 * wrapper. The glide only works because the shelf template keys each
 * <li> by product id, so this component keeps its identity across a
 * filter/sort change instead of remounting.
 */
export default function ShelfProductCard({
  product,
}: {
  product: HttpTypes.StoreProduct
}) {
  const { cheapestPrice } = getProductPrice({ product })

  return (
    <motion.div
      layout="position"
      transition={{ layout: { duration: 0.35, ease: "easeOut" } }}
    >
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
          {/* Quick add (issue #187): the shelf product already carries its
              variants, so the shared QuickAdd runs on it directly. Inside
              the link, as in ProductPreview — the button stops the click
              from navigating. A product with no addable variant shows the
              shared component's own out-of-stock state, or nothing. */}
          <div className="px-1">
            <QuickAdd product={product} />
          </div>
        </div>
      </LocalizedClientLink>
    </motion.div>
  )
}
