"use client"

import { animate, useReducedMotion } from "framer-motion"
import { convertToLocale } from "@lib/util/money"
import React, { useEffect, useRef, useState } from "react"

type CartTotalsProps = {
  totals: {
    total?: number | null
    subtotal?: number | null
    tax_total?: number | null
    currency_code: string
    item_subtotal?: number | null
    shipping_subtotal?: number | null
    discount_subtotal?: number | null
  }
}

/**
 * Cart total tick (issue #223): when the total changes — e.g. a quantity
 * change — the displayed amount counts up or down to the new value over
 * 0.4s instead of swapping instantly. Counts in minor units so each frame
 * formats exactly via convertToLocale. No tick on mount (the displayed
 * value starts at the total), and when reduced motion is preferred the
 * value swaps instantly. The data-value on the wrapping span always
 * carries the true total, never an intermediate frame.
 */
function AnimatedTotal({
  amount,
  currency_code,
}: {
  amount: number
  currency_code: string
}) {
  const shouldReduceMotion = useReducedMotion()
  const [displayAmount, setDisplayAmount] = useState(amount)
  const displayedRef = useRef(amount)

  useEffect(() => {
    const from = displayedRef.current
    if (from === amount || shouldReduceMotion) {
      displayedRef.current = amount
      setDisplayAmount(amount)
      return
    }

    const controls = animate(from, amount, {
      duration: 0.4,
      ease: "easeOut",
      onUpdate: (value) => {
        displayedRef.current = Math.round(value)
        setDisplayAmount(displayedRef.current)
      },
      onComplete: () => {
        displayedRef.current = amount
        setDisplayAmount(amount)
      },
    })
    return () => controls.stop()
  }, [amount, shouldReduceMotion])

  return (
    <>{convertToLocale({ amount: displayAmount, currency_code })}</>
  )
}

const CartTotals: React.FC<CartTotalsProps> = ({ totals }) => {
  const {
    currency_code,
    total,
    tax_total,
    item_subtotal,
    shipping_subtotal,
    discount_subtotal,
  } = totals

  return (
    <div>
      <div className="flex flex-col gap-y-2 txt-medium text-ui-fg-subtle ">
        <div className="flex items-center justify-between">
          <span>Subtotal (excl. shipping and taxes)</span>
          <span data-testid="cart-subtotal" data-value={item_subtotal || 0}>
            {convertToLocale({ amount: item_subtotal ?? 0, currency_code })}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span>Shipping</span>
          <span data-testid="cart-shipping" data-value={shipping_subtotal || 0}>
            {convertToLocale({ amount: shipping_subtotal ?? 0, currency_code })}
          </span>
        </div>
        {!!discount_subtotal && (
          <div className="flex items-center justify-between">
            <span>Discount</span>
            <span
              className="text-ui-fg-interactive"
              data-testid="cart-discount"
              data-value={discount_subtotal || 0}
            >
              -{" "}
              {convertToLocale({
                amount: discount_subtotal ?? 0,
                currency_code,
              })}
            </span>
          </div>
        )}
        <div className="flex justify-between">
          <span className="flex gap-x-1 items-center ">Taxes</span>
          <span data-testid="cart-taxes" data-value={tax_total || 0}>
            {convertToLocale({ amount: tax_total ?? 0, currency_code })}
          </span>
        </div>
      </div>
      <div className="h-px w-full border-b border-gray-200 my-4" />
      <div className="flex items-center justify-between text-ui-fg-base mb-2 txt-medium ">
        <span>Total</span>
        <span
          className="txt-xlarge-plus"
          data-testid="cart-total"
          data-value={total || 0}
        >
          <AnimatedTotal
            amount={total ?? 0}
            currency_code={currency_code}
          />
        </span>
      </div>
      <div className="h-px w-full border-b border-gray-200 mt-4" />
    </div>
  )
}

export default CartTotals
