import { listProducts } from "@lib/data/products"
import { getRegion } from "@lib/data/regions"
import {
  findSimilarProducts,
  getProductsByIds,
} from "@lib/data/semantic-search"
import { HttpTypes } from "@medusajs/types"
import Product from "../product-preview"

type RelatedProductsProps = {
  product: HttpTypes.StoreProduct
  countryCode: string
}

export default async function RelatedProducts({
  product,
  countryCode,
}: RelatedProductsProps) {
  const region = await getRegion(countryCode)

  if (!region) {
    return null
  }

  // Primary: collection + tag matching (curated relationships)
  const queryParams: HttpTypes.StoreProductListParams = {}
  if (region?.id) {
    queryParams.region_id = region.id
  }
  if (product.collection_id) {
    queryParams.collection_id = [product.collection_id]
  }
  if (product.tags) {
    queryParams.tag_id = product.tags
      .map((t) => t.id)
      .filter(Boolean) as string[]
  }
  queryParams.is_giftcard = false

  let products = await listProducts({
    queryParams,
    countryCode,
  }).then(({ response }) => {
    return response.products.filter(
      (responseProduct) => responseProduct.id !== product.id
    )
  })

  // Semantic fallback: if curated matching is thin, use Voyage embeddings
  // to find products with similar meaning/intention.
  if (products.length < 4) {
    const semanticText = [product.title, product.description]
      .filter(Boolean)
      .join("\n")
    const similarIds = await findSimilarProducts(
      semanticText,
      product.id,
      4 - products.length
    )
    if (similarIds.length) {
      const existingIds = new Set(products.map((p) => p.id))
      const semanticProducts = await getProductsByIds(
        similarIds.filter((id) => !existingIds.has(id)),
        countryCode,
        region.id
      )
      products = [...products, ...semanticProducts]
    }
  }

  if (!products.length) {
    return null
  }

  return (
    <div className="product-page-constraint">
      <div className="flex flex-col items-center text-center mb-16">
        <span className="text-base-regular text-gray-600 mb-6">
          Related products
        </span>
        <p className="text-2xl-regular text-ui-fg-base max-w-lg">
          You might also want to check out these products.
        </p>
      </div>

      <ul className="grid grid-cols-2 small:grid-cols-3 medium:grid-cols-4 gap-x-6 gap-y-8">
        {products.slice(0, 4).map((product) => (
          <li key={product.id}>
            <Product region={region} product={product} />
          </li>
        ))}
      </ul>
    </div>
  )
}
