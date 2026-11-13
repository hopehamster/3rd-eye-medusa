"use client"

import { addToCart } from "@lib/data/cart"
import { trackAddToCart } from "@lib/analytics"
import { HttpTypes } from "@medusajs/types"
import { Button } from "@modules/common/components/ui"
import { useReducedMotion } from "framer-motion"
import { useParams } from "next/navigation"
import { useEffect, useMemo, useRef, useState } from "react"
import type { ReactNode } from "react"

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
 *
 * Slide up on hover (issue #214): the button sits in a reserved slot at
 * the bottom of the tile and slides up from below it while the tile is
 * hovered, sliding back down on mouse-out. Every tile link carries
 * `group`, so group-hover drives the slide from inside this shared
 * component — no tile changes needed, and the store tile, shelf card,
 * product preview and cross-sell tile all get it. The slot keeps its
 * height while the button is hidden, so tiles never shift. Quiet and
 * short: 0.3s easeOut. Touch pointers have no hover, so the button stays
 * visible there; keyboard focus reveals it too (focus-within). Reduced
 * motion: no hiding, no motion — the button sits there always.
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
  const prefersReducedMotion = useReducedMotion()

  useEffect(() => {
    return () => {
      if (addedTimer.current) {
        clearTimeout(addedTimer.current)
      }
    }
  }, [])

  const variant = useMemo(() => firstAddableVariant(product), [product])

  // Slide-up reveal (issue #214): the button starts translated down by
  // its own height, clipped by the slot, and rises into place on tile
  // hover. The slot is overflow-hidden, so the button is fully hidden at
  // rest and never paints over the tile below; its height is the button's
  // own height, so the clip holds whatever height the button renders at.
  const reveal = (button: ReactNode) =>
    prefersReducedMotion ? (
      button
    ) : (
      <div className="overflow-hidden">
        <div className="translate-y-full transition-transform duration-300 ease-out group-hover:translate-y-0 focus-within:translate-y-0 [@media(hover:none)]:translate-y-0">
          {button}
        </div>
      </div>
    )

  // A product with no variants at all cannot be quick-added; render nothing
  // rather than a button that can never work.
  if (!product.variants?.length) {
    return null
  }

  if (!variant) {
    return reveal(
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

  return reveal(
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
