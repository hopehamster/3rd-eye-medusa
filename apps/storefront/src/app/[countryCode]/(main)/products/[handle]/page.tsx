import { Metadata } from "next"
import { notFound } from "next/navigation"
import { listProducts } from "@lib/data/products"
import { getRegion } from "@lib/data/regions"
import ProductTemplate from "@modules/products/templates"
import { HttpTypes } from "@medusajs/types"

type Props = {
  params: Promise<{ countryCode: string; handle: string }>
}

export async function generateStaticParams() {
  // Pre-render product pages at build time when backend is reachable.
  // Uses the same listProducts as the store page.
  try {
    const { response } = await listProducts({
      countryCode: "us",
      queryParams: { limit: 100 },
    })
    return response.products
      .filter((p) => p.handle)
      .map((p) => ({
        countryCode: "us",
        handle: p.handle,
      }))
  } catch {
    return []
  }
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  try {
    const params = await props.params
    const { handle } = params
    const region = await getRegion(params.countryCode)

    if (!region) {
      return { title: "Product | 3rd Eye Supply" }
    }

    const { response } = await listProducts({
      countryCode: params.countryCode,
      queryParams: { limit: 100 },
    })
    const product = response.products.find((p) => p.handle === handle)

    if (!product) {
      return { title: "Product not found | 3rd Eye Supply" }
    }

    return {
      title: `${product.title} | 3rd Eye Supply`,
      description: `${product.title}`,
      openGraph: {
        title: `${product.title} | 3rd Eye Supply`,
        description: `${product.title}`,
        images: product.thumbnail ? [product.thumbnail] : [],
      },
    }
  } catch {
    return { title: "Product | 3rd Eye Supply" }
  }
}

export default async function ProductPage(props: Props) {
  const params = await props.params

  let region
  try {
    region = await getRegion(params.countryCode)
  } catch {
    region = null
  }

  if (!region) {
    notFound()
  }

  let pricedProduct
  try {
    // Medusa v2 /store/products returns 400 for ?handle= filter, so fetch
    // the region's products and find by handle client-side.
    const { response } = await listProducts({
      countryCode: params.countryCode,
      queryParams: { limit: 100 },
    })
    pricedProduct = response.products.find((p) => p.handle === params.handle)
  } catch {
    notFound()
  }

  if (!pricedProduct) {
    notFound()
  }

  // Use default product images (variant selection handled client-side)
  const images = pricedProduct.images ?? []

  return (
    <ProductTemplate
      product={pricedProduct}
      region={region}
      countryCode={params.countryCode}
      images={images ?? []}
    />
  )
}
