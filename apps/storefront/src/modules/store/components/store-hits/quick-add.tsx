"use client"

import { HttpTypes } from "@medusajs/types"
import { useParams } from "next/navigation"
import { useEffect, useState } from "react"

import { listProducts } from "@lib/data/products"
import QuickAdd from "@modules/products/components/quick-add"

/**
 * Quick add for one store-grid tile (issue #187).
 *
 * A search hit carries no variants — the product index holds id, title,
 * handle, thumbnail and prices only — so the shared QuickAdd cannot run on
 * the hit itself, and rendering only-when-a-variant-exists would show no
 * button ever. Fetch the one product by handle through the existing
 * listProducts server action, with the same `*variants.calculated_price`
 * fields the home rail asks for, and hand it to the shared QuickAdd.
 * Until the fetch lands, or if it fails, render nothing rather than a
 * button that cannot work. A failed fetch hides only this tile's button.
 */
export default function StoreHitQuickAdd({ handle }: { handle: string }) {
  const countryCode = useParams().countryCode as string | undefined
  const [product, setProduct] = useState<HttpTypes.StoreProduct | null>(null)

  useEffect(() => {
    if (!handle || !countryCode) {
      return
    }

    let cancelled = false

    listProducts({
      countryCode,
      queryParams: {
        handle,
        fields: "*variants.calculated_price",
      },
    })
      .then(({ response }) => {
        if (!cancelled) {
          setProduct(response.products[0] ?? null)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setProduct(null)
        }
      })

    return () => {
      cancelled = true
    }
  }, [handle, countryCode])

  if (!product) {
    return null
  }

  return <QuickAdd product={product} />
}
