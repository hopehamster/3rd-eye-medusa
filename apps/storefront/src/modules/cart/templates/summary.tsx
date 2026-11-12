"use client"

import { Button, Heading } from "@modules/common/components/ui"

import CartTotals from "@modules/common/components/cart-totals"
import Divider from "@modules/common/components/divider"
import DiscountCode from "@modules/checkout/components/discount-code"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { listCartOptions } from "@lib/data/cart"
import { MotionConfig } from "framer-motion"
import ShippingPriceNudge from "@modules/shipping/components/free-shipping-price-nudge"
import { trackBeginCheckout } from "@lib/analytics"
import { HttpTypes } from "@medusajs/types"
import { useEffect, useState } from "react"

type SummaryProps = {
  cart: HttpTypes.StoreCart
}

function getCheckoutStep(cart: HttpTypes.StoreCart) {
  if (!cart?.shipping_address?.address_1 || !cart.email) {
    return "address"
  } else if (cart?.shipping_methods?.length === 0) {
    return "delivery"
  } else {
    return "payment"
  }
}

const Summary = ({ cart }: SummaryProps) => {
  const step = getCheckoutStep(cart)
  const [shippingOptions, setShippingOptions] = useState<
    HttpTypes.StoreCartShippingOption[]
  >([])

  // Shipping options for the free-shipping progress bar. The summary
  // receives only the cart, so it loads the options itself; the nudge
  // renders nothing when no free-shipping rule exists, so a failed or
  // empty load simply hides the bar.
  useEffect(() => {
    let cancelled = false

    listCartOptions()
      .then(({ shipping_options }) => {
        if (!cancelled) {
          setShippingOptions(shipping_options ?? [])
        }
      })
      .catch(() => {
        if (!cancelled) {
          setShippingOptions([])
        }
      })

    return () => {
      cancelled = true
    }
  }, [cart.id])

  const handleBeginCheckout = () => {
    trackBeginCheckout({
      cartId: cart.id,
      itemCount:
        cart.items?.reduce((sum, item) => sum + (item.quantity ?? 0), 0) ?? 0,
      total: cart.total,
      currency: cart.currency_code,
    })
  }

  return (
    <div className="flex flex-col gap-y-4">
      <Heading level="h2" className="text-[2rem] leading-[2.75rem]">
        Summary
      </Heading>
      <ShippingPriceNudge
        variant="inline"
        cart={cart}
        shippingOptions={shippingOptions}
      />
      <DiscountCode cart={cart} />
      <Divider />
      {/* Reduced-motion context for the summary subtree (issue #223):
          the cart-total tick honours the user's preference. */}
      <MotionConfig reducedMotion="user">
        <CartTotals totals={cart} />
      </MotionConfig>
      <LocalizedClientLink
        href={"/checkout?step=" + step}
        data-testid="checkout-button"
        onClick={handleBeginCheckout}
      >
        <Button className="w-full h-10">Go to checkout</Button>
      </LocalizedClientLink>
    </div>
  )
}

export default Summary
