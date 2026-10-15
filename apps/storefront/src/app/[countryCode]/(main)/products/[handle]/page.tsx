import { Metadata } from "next"
import { notFound } from "next/navigation"
import ProductTemplate from "@modules/products/templates"
import { HttpTypes } from "@medusajs/types"

type Props = {
  params: Promise<{ countryCode: string; handle: string }>
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params
  const title = params.handle
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ")
  return {
    title: `${title} | 3rd Eye Supply`,
    description: `${title} - 3rd Eye Supply`,
  }
}

// Direct fetch without SDK cookie helpers (which cause DYNAMIC_SERVER_USAGE)
async function fetchProduct(
  handle: string,
  countryCode: string
): Promise<{ product: HttpTypes.StoreProduct | null; region: HttpTypes.StoreRegion | null }> {
  const backendUrl = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL
  const publishableKey = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY

  if (!backendUrl || !publishableKey) {
    return { product: null, region: null }
  }

  const headers = { "x-publishable-api-key": publishableKey }

  try {
    // Get regions
    const regionsRes = await fetch(`${backendUrl}/store/regions`, { headers })
    if (!regionsRes.ok) return { product: null, region: null }
    const regionsData = await regionsRes.json()
    const region = regionsData.regions?.find((r: HttpTypes.StoreRegion) =>
      r.countries?.some((c) => c.iso_2 === countryCode)
    )
    if (!region) return { product: null, region: null }

    // Get products (no handle filter - Medusa v2 returns 400 for it)
    const productsRes = await fetch(
      `${backendUrl}/store/products?limit=100&region_id=${region.id}&fields=handle,title,thumbnail,*variants.calculated_price,*variants.images,*variants.options`,
      { headers }
    )
    if (!productsRes.ok) return { product: null, region: null }
    const productsData = await productsRes.json()
    const product = productsData.products?.find(
      (p: HttpTypes.StoreProduct) => p.handle === handle
    )

    return { product: product || null, region }
  } catch {
    return { product: null, region: null }
  }
}

export default async function ProductPage(props: Props) {
  const params = await props.params
  const { product, region } = await fetchProduct(params.handle, params.countryCode)

  if (!product || !region) {
    notFound()
  }

  return (
    <ProductTemplate
      product={product}
      region={region}
      countryCode={params.countryCode}
      images={product.images ?? []}
    />
  )
}
