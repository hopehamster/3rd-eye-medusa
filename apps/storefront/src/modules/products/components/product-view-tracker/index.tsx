"use client"

import { useEffect } from "react"
import { trackProductView } from "@lib/analytics"

/**
 * Fires a product_viewed event once when a product page mounts.
 */
export default function ProductViewTracker({
  productId,
  title,
  handle,
  price,
  currency,
}: {
  productId: string
  title: string
  handle?: string
  price?: number
  currency?: string
}) {
  useEffect(() => {
    trackProductView({ productId, title, handle, price, currency })
  }, [productId])

  return null
}
