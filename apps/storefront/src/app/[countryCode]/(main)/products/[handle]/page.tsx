import { Metadata } from "next"
import { notFound } from "next/navigation"
import ProductTemplate from "@modules/products/templates"
import { HttpTypes } from "@medusajs/types"

type Props = {
  params: Promise<{ countryCode: string; handle: string }>
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params
  const { product } = await fetchProduct(params.handle, params.countryCode)
  
  if (!product) {
    return {
      title: "Product Not Found",
    }
  }
  
  const description = product.description 
    ? product.description.substring(0, 155).trim() + (product.description.length > 155 ? "..." : "")
    : `${product.title} - Available at 3rd Eye Supply`
  
  return {
    title: product.title,
    description,
    openGraph: {
      title: product.title,
      description,
      images: product.thumbnail ? [{ url: product.thumbnail }] : [],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: product.title,
      description,
      images: product.thumbnail ? [product.thumbnail] : [],
    },
    alternates: {
      canonical: `/us/products/${params.handle}`,
    },
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
    // Include all fields ProductTemplate needs
    const productsRes = await fetch(
      `${backendUrl}/store/products?limit=100&region_id=${region.id}&fields=id,handle,title,subtitle,description,thumbnail,images,*variants.calculated_price,*variants.images,*variants.options,*options`,
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
