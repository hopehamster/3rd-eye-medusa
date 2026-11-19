import { retrieveCart } from "@lib/data/cart"
import { retrieveCustomer } from "@lib/data/customer"
import CheckoutProgress from "@modules/checkout/components/checkout-progress"
import PaymentWrapper from "@modules/checkout/components/payment-wrapper"
import CheckoutForm from "@modules/checkout/templates/checkout-form"
import CheckoutSummary from "@modules/checkout/templates/checkout-summary"
import { Metadata } from "next"
import { notFound } from "next/navigation"

export const metadata: Metadata = {
  title: "Checkout",
}

export default async function Checkout() {
  const cart = await retrieveCart()

  if (!cart) {
    return notFound()
  }

  const customer = await retrieveCustomer()

  // First incomplete section, used as the progress line's starting step
  // when the URL carries no `step` param. Mirrors the sections' own
  // completion checks: address saved, shipping method chosen, payment
  // session ready (or gift card covering the total).
  const paidByGiftcard = !!(
    (cart as unknown as Record<string, unknown>)?.gift_cards &&
    ((cart as unknown as Record<string, unknown>)?.gift_cards as unknown[])
      ?.length > 0 &&
    cart?.total === 0
  )
  const hasPendingSession = !!cart.payment_collection?.payment_sessions?.find(
    (paymentSession) => paymentSession.status === "pending"
  )
  const paymentReady =
    (hasPendingSession && (cart.shipping_methods?.length ?? 0) !== 0) ||
    paidByGiftcard
  const fallbackStepIndex = !cart.shipping_address
    ? 0
    : (cart.shipping_methods?.length ?? 0) === 0
    ? 1
    : !paymentReady
    ? 2
    : 3

  return (
    <div className="content-container py-12">
      <CheckoutProgress fallbackStepIndex={fallbackStepIndex} />
      <div className="grid grid-cols-1 small:grid-cols-[1fr_416px] gap-x-40">
        <PaymentWrapper cart={cart}>
          <CheckoutForm cart={cart} customer={customer} />
        </PaymentWrapper>
        <CheckoutSummary cart={cart} />
      </div>
    </div>
  )
}
