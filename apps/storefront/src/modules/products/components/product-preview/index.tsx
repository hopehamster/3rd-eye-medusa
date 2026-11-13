import { motion, MotionConfig } from "framer-motion"
import { Text } from "@modules/common/components/ui"
import { getProductPrice } from "@lib/util/get-product-price"
import { HttpTypes } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Thumbnail from "../thumbnail"
import PreviewPrice from "./price"
import QuickAdd from "@modules/products/components/quick-add"

/**
 * Tile photo zoom on hover (issue #213): the photo grows to about 105%
 * inside its frame while the pointer is over the tile, and settles back
 * on mouse-out. The tile is the hover target, so the outer element
 * carries whileHover and the photo inherits the "hover" variant.
 * Quiet and short: 0.3s easeOut. Touch pointers never trigger it:
 * motion-dom's hover gesture returns early for touch pointerenter
 * events, so whileHover only fires for mouse/pen.
 *
 * The zoom is clipped by the plain rounded-large overflow-hidden
 * wrapper, not by the moving element itself: a transformed element
 * clips to its own scaled box, so the clip has to sit outside the
 * scale. The wrapper matches the frame's own radius — the Thumbnail
 * carries both rounded-base and rounded-large, and the built CSS puts
 * rounded-large (16px) later, so rounded-large wins.
 *
 * Reduced motion: this file is an async server component, so the
 * useReducedMotion hook cannot run here (it needs useState, which
 * does not exist in a server render). The tile is wrapped in
 * MotionConfig reducedMotion="user" instead — the same approach the
 * best-sellers row (issue #215) uses for the same zoom — so a
 * visitor who prefers reduced motion gets no animated zoom.
 */
const photoVariants = {
  rest: { scale: 1 },
  hover: { scale: 1.05 },
}

export default async function ProductPreview({
  product,
  isFeatured,
  region: _region,
}: {
  product: HttpTypes.StoreProduct
  isFeatured?: boolean
  region: HttpTypes.StoreRegion
}) {
  const { cheapestPrice } = getProductPrice({
    product,
  })

  return (
    <LocalizedClientLink href={`/products/${product.handle}`} className="group">
      <div data-testid="product-wrapper">
        <MotionConfig reducedMotion="user">
          <motion.div initial="rest" animate="rest" whileHover="hover">
            <div className="rounded-large border border-cosmos-borderSoft bg-cosmos-surface p-3 transition-all duration-300 ease-out group-hover:-translate-y-1 group-hover:border-cosmos-border group-hover:shadow-[0_16px_48px_rgba(0,0,0,0.45)]">
              <div className="rounded-large overflow-hidden">
                <motion.div
                  variants={photoVariants}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                >
                  <Thumbnail
                    thumbnail={product.thumbnail}
                    images={product.images}
                    size="full"
                    isFeatured={isFeatured}
                    className="!bg-cosmos-raised !shadow-none rounded-base overflow-hidden"
                  />
                </motion.div>
              </div>
              <div className="flex txt-compact-medium mt-4 justify-between items-baseline px-1 pb-1">
                <Text
                  className="text-cosmos-text font-display text-[17px] tracking-wide group-hover:text-cosmos-goldBright transition-colors duration-300"
                  data-testid="product-title"
                >
                  {product.title}
                </Text>
                <div className="flex items-center gap-x-2">
                  {cheapestPrice && <PreviewPrice price={cheapestPrice} />}
                </div>
              </div>
              <div className="px-1 pb-1">
                <QuickAdd product={product} />
              </div>
            </div>
          </motion.div>
        </MotionConfig>
      </div>
    </LocalizedClientLink>
  )
}
