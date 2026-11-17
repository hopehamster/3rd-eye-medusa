import { Text } from "@modules/common/components/ui"
import { getProductPrice } from "@lib/util/get-product-price"
import { HttpTypes } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Thumbnail from "../thumbnail"
import PreviewPrice from "./price"
import QuickAdd from "@modules/products/components/quick-add"
import ProductPreviewMotion from "./product-preview-motion"

/**
 * Card hover is zero-motion (appearance addendum, Delta 4): the
 * earlier issue #213 tile photo zoom, card lift and hover shadow are
 * removed. The only hover effect is the card border colour transition,
 * which lives in the "use client" ProductPreviewMotion wrapper.
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
              className="!bg-paper-surface !shadow-none rounded-soft overflow-hidden border border-paper-borderSoft"
              imageClassName="object-contain p-4"
            />
          }
        >
          <div className="flex mt-3 justify-between items-baseline gap-3 px-1 pb-1">
            <Text
              className="text-paper-text font-display text-[16px] leading-snug"
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
