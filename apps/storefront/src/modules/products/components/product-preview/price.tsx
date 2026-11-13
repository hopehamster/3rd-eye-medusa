"use client"

import { motion, useReducedMotion } from "framer-motion"
import { Text, clx } from "@modules/common/components/ui"
import { VariantPrice } from "types/global"

// Strike-through draw, seconds (issue #221). The line through the
// original price draws itself left to right, under the half-second
// house rule.
const STRIKE_DRAW_S = 0.4

/**
 * Tile price. On a sale the original price shows struck through; the
 * line draws itself left to right (0.4s) instead of appearing
 * instantly, keyed by the original price so a price change replays
 * the draw. With prefers-reduced-motion the line is drawn instantly.
 * This is a client component (it awaits nothing) because the draw
 * needs the useReducedMotion hook, which cannot run in a server
 * component.
 */
export default function PreviewPrice({ price }: { price: VariantPrice }) {
  const prefersReducedMotion = useReducedMotion()

  if (!price) {
    return null
  }

  return (
    <>
      {price.price_type === "sale" && (
        <Text
          className="relative text-ui-fg-muted"
          data-testid="original-price"
        >
          {price.original_price}
          <motion.span
            key={price.original_price}
            aria-hidden="true"
            className="absolute left-0 top-1/2 h-px w-full bg-current"
            initial={prefersReducedMotion ? false : { scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{
              duration: prefersReducedMotion ? 0 : STRIKE_DRAW_S,
              ease: "easeOut",
            }}
            style={{ transformOrigin: "left" }}
          />
        </Text>
      )}
      <Text
        className={clx("text-ui-fg-muted", {
          "text-ui-fg-interactive": price.price_type === "sale",
        })}
        data-testid="price"
      >
        {price.calculated_price}
      </Text>
    </>
  )
}
