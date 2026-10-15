"use client"

import { useEffect, useState } from "react"
import { notFound } from "next/navigation"
import ProductTemplate from "@modules/products/templates"
import { HttpTypes } from "@medusajs/types"

export default function ProductPageClient({
  countryCode,
  handle,
}: {
  countryCode: string
  handle: string
}) {
  const [product, setProduct] = useState<HttpTypes.StoreProduct | null>(null)
  const [region, setRegion] = useState<HttpTypes.StoreRegion | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    async function fetchData() {
      try {
        const backendUrl = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL
        const publishableKey = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY

        if (!backendUrl || !publishableKey) {
          setError(true)
          setLoading(false)
          return
        }

        // Get regions to find the region for the country code
        const regionsRes = await fetch(`${backendUrl}/store/regions`, {
          headers: { "x-publishable-api-key": publishableKey },
        })
        const regionsData = await regionsRes.json()
        const foundRegion = regionsData.regions?.find((r: HttpTypes.StoreRegion) =>
          r.countries?.some((c) => c.iso_2 === countryCode)
        )

        if (!foundRegion) {
          setError(true)
          setLoading(false)
          return
        }
        setRegion(foundRegion)

        // Get products for the region
        const productsRes = await fetch(
          `${backendUrl}/store/products?limit=100&region_id=${foundRegion.id}&fields=handle,title,thumbnail,*variants.calculated_price,*variants.images`,
          {
            headers: { "x-publishable-api-key": publishableKey },
          }
        )
        const productsData = await productsRes.json()
        const foundProduct = productsData.products?.find(
          (p: HttpTypes.StoreProduct) => p.handle === handle
        )

        if (!foundProduct) {
          setError(true)
        } else {
          setProduct(foundProduct)
        }
      } catch {
        setError(true)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [countryCode, handle])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p>Loading product...</p>
      </div>
    )
  }

  if (error || !product || !region) {
    notFound()
  }

  return (
    <ProductTemplate
      product={product}
      region={region}
      countryCode={countryCode}
      images={product.images ?? []}
    />
  )
}
