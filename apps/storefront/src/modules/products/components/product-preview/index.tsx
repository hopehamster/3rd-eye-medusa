import { Text } from "@modules/common/components/ui"
import { getProductPrice } from "@lib/util/get-product-price"
import { HttpTypes } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Thumbnail from "../thumbnail"
import PreviewPrice from "./price"

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
        <div className="rounded-large border border-cosmos-borderSoft bg-cosmos-surface p-3 transition-all duration-300 ease-out group-hover:-translate-y-1 group-hover:border-cosmos-border group-hover:shadow-[0_16px_48px_rgba(0,0,0,0.45)]">
          <Thumbnail
            thumbnail={product.thumbnail}
            images={product.images}
            size="full"
            isFeatured={isFeatured}
            className="!bg-cosmos-raised !shadow-none rounded-base overflow-hidden"
          />
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
        </div>
      </div>
    </LocalizedClientLink>
  )
}
