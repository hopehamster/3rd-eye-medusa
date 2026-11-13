"use client"

import { motion, useReducedMotion } from "framer-motion"
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
 *
 * Reduced motion (issue #201 fix round): when the visitor prefers
 * reduced motion the layout animation is off, so the card snaps
 * instead of gliding.
 *
 * Staggered entrance (issue #216): on arrival the card fades in from
 * opacity 0, delayed by its position in the grid (the `index` the
 * shelf template passes), so the cards appear one after another
 * instead of all at once. Opacity only — no rise — so the fade never
 * fights the layout glide above: Framer Motion writes transforms on
 * this same wrapper for the glide. Each fade is 0.35s, easeOut, and
 * the delay is capped at 0.4s so a full shelf never feels like
 * waiting. With reduced motion preferred there is no entrance at
 * all: the card renders at full opacity immediately, no fade, no
 * stagger delay. The entrance runs on mount only, and the template
 * keys each card by product id, so a filter/sort change glides the
 * cards to their new spots without re-fading them.
 */
export default function ShelfProductCard({
  product,
  index = 0,
}: {
  product: HttpTypes.StoreProduct
  index?: number
}) {
  const { cheapestPrice } = getProductPrice({ product })
  const shouldReduceMotion = useReducedMotion()

  return (
    <motion.div
      layout={shouldReduceMotion ? false : "position"}
      initial={shouldReduceMotion ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{
        default: {
          duration: 0.35,
          ease: "easeOut",
          delay: shouldReduceMotion
            ? 0
            : Math.min(index * 0.05, 0.4),
        },
        layout: { duration: 0.35, ease: "easeOut" },
      }}
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
