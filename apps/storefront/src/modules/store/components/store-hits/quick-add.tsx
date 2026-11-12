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
 * listProducts server action, with `*variants.calculated_price` plus
 * `+variants.inventory_quantity` (the fields override replaces
 * listProducts' defaults, so inventory must be asked for explicitly —
 * without it a zero-stock variant would show an enabled button that fails
 * at the cart instead of the disabled "Out of stock" state), and hand it
 * to the shared QuickAdd. While the fetch is in flight, render a
 * reserved-space placeholder so tiles do not shift when the button
 * appears; after the load resolves with no product, or if it fails,
 * render nothing rather than a button that cannot work. A failed fetch
 * hides only this tile's button.
 */
export default function StoreHitQuickAdd({ handle }: { handle: string }) {
  const countryCode = useParams().countryCode as string | undefined
  const [product, setProduct] = useState<HttpTypes.StoreProduct | null>(null)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    if (!handle || !countryCode) {
      setLoaded(true)
      return
    }

    let cancelled = false

    listProducts({
      countryCode,
      queryParams: {
        handle,
        limit: 1,
        fields: "*variants.calculated_price,+variants.inventory_quantity",
      },
    })
      .then(({ response }) => {
        if (!cancelled) {
          setProduct(response.products[0] ?? null)
          setLoaded(true)
        }
      })
      .catch((error) => {
        console.warn("StoreHitQuickAdd: failed to fetch product", handle, error)
        if (!cancelled) {
          setProduct(null)
          setLoaded(true)
        }
      })

    return () => {
      cancelled = true
    }
  }, [handle, countryCode])

  if (!loaded) {
    return <div className="w-full h-9 mt-3" aria-hidden="true" />
  }

  if (!product) {
    return null
  }

  return <QuickAdd product={product} />
}
