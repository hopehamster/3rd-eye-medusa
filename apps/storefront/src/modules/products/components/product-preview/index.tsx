import { Text } from "@modules/common/components/ui"
import { getProductPrice } from "@lib/util/get-product-price"
import { HttpTypes } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Thumbnail from "../thumbnail"
import PreviewPrice from "./price"
import QuickAdd from "@modules/products/components/quick-add"
import ProductPreviewMotion from "./product-preview-motion"

/**
 * Tile photo zoom on hover (issue #213): the photo grows to about 105%
 * inside its frame while the pointer is over the tile, and settles back
 * on mouse-out. The motion lives in the "use client"
 * ProductPreviewMotion wrapper, which carries whileHover on the tile
 * and the scale variants on the photo.
 *
 * Reduced motion: this file is an async server component, so the
 * useReducedMotion hook cannot run here (it needs useState, which
 * does not exist in a server render). ProductPreviewMotion calls the
 * hook and leaves whileHover off when the visitor prefers reduced
 * motion, so there is no zoom at all for them — the same hook-gated
 * pattern the best-sellers row (issue #215) uses. Do not "fix" this
 * by wrapping the tile in MotionConfig reducedMotion="user" instead:
 * that only forces the transition type to false for transform values,
 * which applies the final scale keyframe immediately, so the photo
 * would still jump to 105% on hover, instantly.
 */
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
        <ProductPreviewMotion
          photo={
            <Thumbnail
              thumbnail={product.thumbnail}
              images={product.images}
              size="full"
              isFeatured={isFeatured}
              className="!bg-cosmos-raised !shadow-none rounded-base overflow-hidden"
            />
          }
        >
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
        </ProductPreviewMotion>
      </div>
    </LocalizedClientLink>
  )
}
