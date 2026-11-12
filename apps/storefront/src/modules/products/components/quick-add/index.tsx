"use client"

import { addToCart } from "@lib/data/cart"
import { trackAddToCart } from "@lib/analytics"
import { HttpTypes } from "@medusajs/types"
import { Button } from "@modules/common/components/ui"
import { useParams } from "next/navigation"
import { useEffect, useMemo, useRef, useState } from "react"

type QuickAddProps = {
  product: HttpTypes.StoreProduct
  testId?: string
  label?: string
}

/**
 * Whether a variant can be added from a tile. Stock rules similar to the
 * product page buy box (product-actions), but not identical: unmanaged
 * inventory and backorders are always addable; managed inventory needs
 * stock on hand. Tiles do not always carry inventory_quantity (the home
 * rail asks for *variants.calculated_price only), so an unknown quantity
 * is treated as addable here and the cart decides server-side --
 * treating unknown as out of stock would hide quick add from the whole
 * homepage.
 */
function isAddableVariant(variant: HttpTypes.StoreProductVariant) {
  if (!variant.manage_inventory) {
    return true
  }
  if (variant.allow_backorder) {
    return true
  }
  if (
    variant.inventory_quantity === undefined ||
    variant.inventory_quantity === null
  ) {
    return true
  }
  return variant.inventory_quantity > 0
}

function firstAddableVariant(product: HttpTypes.StoreProduct) {
  return (product.variants ?? []).find(
    (variant) => variant.calculated_price && isAddableVariant(variant)
  )
}

/**
 * Shared quick-add button for tiles (issue #156). The tile card is a link,
 * so the button stops the click from navigating: preventDefault plus
 * stopPropagation on the button click keeps the anchor handler from firing.
 * Adds the default (first addable) variant, quantity 1, and shows an
 * adding state, then a short added confirmation. The cart dropdown opens
 * on its own when the cart count changes, so the added state is brief.
 */
export default function QuickAdd({
  product,
  testId = "quick-add",
  label = "Quick add",
}: QuickAddProps) {
  const countryCode = useParams().countryCode as string | undefined
  const [isAdding, setIsAdding] = useState(false)
  const [added, setAdded] = useState(false)
  const [failed, setFailed] = useState(false)
  const addedTimer = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined
  )

  useEffect(() => {
    return () => {
      if (addedTimer.current) {
        clearTimeout(addedTimer.current)
      }
    }
  }, [])

  const variant = useMemo(() => firstAddableVariant(product), [product])

  // A product with no variants at all cannot be quick-added; render nothing
  // rather than a button that can never work.
  if (!product.variants?.length) {
    return null
  }

  if (!variant) {
    return (
      <Button
        type="button"
        disabled
        variant="primary"
        className="w-full h-9 mt-3"
        data-testid={testId}
      >
        Out of stock
      </Button>
    )
  }

  const handleClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    e.stopPropagation()

    if (!variant.id || !countryCode || isAdding) {
      return
    }

    setIsAdding(true)
    setFailed(false)

    try {
      await addToCart({
        variantId: variant.id,
        quantity: 1,
        countryCode,
      })

      trackAddToCart({
        productId: product.id,
        variantId: variant.id,
        title: product.title,
        quantity: 1,
      })

      setAdded(true)
      addedTimer.current = setTimeout(() => setAdded(false), 2000)
    } catch {
      setFailed(true)
    } finally {
      setIsAdding(false)
    }
  }

  return (
    <Button
      type="button"
      onClick={handleClick}
      disabled={isAdding || !countryCode}
      variant="primary"
      className="w-full h-9 mt-3"
      isLoading={isAdding}
      data-testid={testId}
    >
      {added ? "Added" : failed ? "Try again" : isAdding ? "Adding..." : label}
    </Button>
  )
}
