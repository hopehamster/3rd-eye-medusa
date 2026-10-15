import { HttpTypes } from "@medusajs/types"
import ProductActions from "@modules/products/components/product-actions"

/**
 * Renders the product actions component with real-time pricing.
 * Uses direct fetch instead of SDK to avoid DYNAMIC_SERVER_USAGE from cookies().
 */
export default async function ProductActionsWrapper({
  id,
  region,
}: {
  id: string
  region: HttpTypes.StoreRegion
}) {
  const backendUrl = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL
  const publishableKey = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY

  if (!backendUrl || !publishableKey) {
    return null
  }

  try {
    const res = await fetch(
      `${backendUrl}/store/products/${id}?region_id=${region.id}&fields=id,handle,title,subtitle,description,thumbnail,images,*variants.calculated_price,*variants.images,*variants.options,*options`,
      {
        headers: { "x-publishable-api-key": publishableKey },
      }
    )

    if (!res.ok) {
      return null
    }

    const data = await res.json()
    const product = data.product

    if (!product) {
      return null
    }

    return <ProductActions product={product} region={region} />
  } catch {
    return null
  }
}
