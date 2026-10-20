import React, { Suspense } from "react"

import ImageGallery from "@modules/products/components/image-gallery"
import ProductActions from "@modules/products/components/product-actions"
import ProductTabs from "@modules/products/components/product-tabs"
import ProductViewTracker from "@modules/products/components/product-view-tracker"
import RelatedProducts from "@modules/products/components/related-products"
import RitualBlock from "@modules/products/components/ritual-block"
import TrustNotes from "@modules/products/components/trust-notes"
import ProductInfo from "@modules/products/templates/product-info"
import SkeletonRelatedProducts from "@modules/skeletons/templates/skeleton-related-products"
import { notFound } from "next/navigation"
import { HttpTypes } from "@medusajs/types"

import ProductActionsWrapper from "./product-actions-wrapper"

type ProductTemplateProps = {
  product: HttpTypes.StoreProduct
  region: HttpTypes.StoreRegion
  countryCode: string
  images: HttpTypes.StoreProductImage[]
}

/**
 * Specimen-card PDP layout (bright apothecary redesign, issue #24).
 * Daylight imagery left; specimen-label panel right (name, intention
 * subtitle, spec rows, price + add to cart, trust furniture), sticky on
 * desktop. Mobile: imagery full-width first, panel after; the sticky
 * add-to-cart bar comes from ProductActions/MobileActions.
 * Below the fold: story + ritual block, shipping/returns, related pieces.
 */
const ProductTemplate: React.FC<ProductTemplateProps> = ({
  product,
  region,
  countryCode,
  images,
}) => {
  if (!product || !product.id) {
    return notFound()
  }

  return (
    <div className="bg-paper-bg paper-grain text-paper-text font-humanist">
      <ProductViewTracker
        productId={product.id}
        title={product.title}
        handle={product.handle ?? undefined}
      />
      <div className="content-container py-6 small:py-10" data-testid="product-container">
        <div className="flex flex-col small:flex-row items-start gap-10 small:gap-14">
          <div className="w-full min-w-0 small:flex-1">
            <ImageGallery images={images} />
          </div>
          <div className="w-full small:w-[380px] medium:w-[420px] shrink-0 small:sticky small:top-28 flex flex-col gap-y-8">
            <ProductInfo product={product} />
            <Suspense
              fallback={
                <ProductActions
                  disabled={true}
                  product={product}
                  region={region}
                />
              }
            >
              <ProductActionsWrapper id={product.id} region={region} />
            </Suspense>
            <TrustNotes />
          </div>
        </div>

        <RitualBlock product={product} />

        <div className="mt-12 max-w-3xl">
          <ProductTabs product={product} />
        </div>
      </div>
      <div
        className="content-container pb-16 small:pb-24"
        data-testid="related-products-container"
      >
        <Suspense fallback={<SkeletonRelatedProducts />}>
          <RelatedProducts product={product} countryCode={countryCode} />
        </Suspense>
      </div>
    </div>
  )
}

export default ProductTemplate
