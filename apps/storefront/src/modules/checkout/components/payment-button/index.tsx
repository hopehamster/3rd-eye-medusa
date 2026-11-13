"use client"

import { isManual, isStripeLike } from "@lib/constants"
import { placeOrder } from "@lib/data/cart"
import { CheckCircleMiniSolid } from "@medusajs/icons"
import { HttpTypes } from "@medusajs/types"
import { Button } from "@modules/common/components/ui"
import { useElements, useStripe } from "@stripe/react-stripe-js"
import { motion, useReducedMotion } from "framer-motion"
import { useParams } from "next/navigation"
import React, { useState } from "react"
import ErrorMessage from "../error-message"

// How long the green confirmed state stays visible before the order is
// placed. placeOrder redirects to the confirmation page on success, so
// without this pause the button would navigate away before anyone sees
// the check. Short on purpose: the check pops in 0.25s, then there is a
// brief beat before the redirect.
const CONFIRM_HOLD_MS = 400

// The check shown once payment succeeds. A small scale pop, skipped
// entirely under prefers-reduced-motion, where the check just appears.
const ConfirmedCheck = ({ reduceMotion }: { reduceMotion: boolean }) => {
  const icon = <CheckCircleMiniSolid className="w-5 h-5" />

  if (reduceMotion) {
    return (
      <span className="inline-flex" aria-hidden="true">
        {icon}
      </span>
    )
  }

  return (
    <motion.span
      className="inline-flex"
      aria-hidden="true"
      initial={{ scale: 0.6, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
    >
      {icon}
    </motion.span>
  )
}

type PaymentButtonProps = {
  cart: HttpTypes.StoreCart
  "data-testid": string
}

const PaymentButton: React.FC<PaymentButtonProps> = ({
  cart,
  "data-testid": dataTestId,
}) => {
  const notReady =
    !cart ||
    !cart.shipping_address ||
    !cart.billing_address ||
    !cart.email ||
    (cart.shipping_methods?.length ?? 0) < 1

  const paymentSession = cart.payment_collection?.payment_sessions?.[0]

  switch (true) {
    case isStripeLike(paymentSession?.provider_id):
      return (
        <StripePaymentButton
          notReady={notReady}
          cart={cart}
          data-testid={dataTestId}
        />
      )
    case isManual(paymentSession?.provider_id):
      return (
        <ManualTestPaymentButton notReady={notReady} data-testid={dataTestId} />
      )
    default:
      return <Button disabled>Select a payment method</Button>
  }
}

const StripePaymentButton = ({
  cart,
  notReady,
  "data-testid": dataTestId,
}: {
  cart: HttpTypes.StoreCart
  notReady: boolean
  "data-testid"?: string
}) => {
  const [submitting, setSubmitting] = useState(false)
  const [confirmed, setConfirmed] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const prefersReducedMotion = useReducedMotion()

  const onPaymentCompleted = async () => {
    await placeOrder()
      .catch((err) => {
        setErrorMessage(err.message)
        setConfirmed(false)
      })
      .finally(() => {
        setSubmitting(false)
      })
    // placeOrder redirects to the confirmation page when the order is
    // placed, so reaching here means it resolved without redirecting:
    // the order did not complete, so drop the confirmed state instead
    // of leaving a green check on a checkout that is still open.
    setConfirmed(false)
  }

  // Payment succeeded: show the green check first, then place the order.
  // The pause is what makes the check visible — placeOrder redirects to
  // the confirmation page on success.
  const confirmAndComplete = async () => {
    setConfirmed(true)
    await new Promise((resolve) => setTimeout(resolve, CONFIRM_HOLD_MS))
    await onPaymentCompleted()
  }

  const stripe = useStripe()
  const elements = useElements()
  const { countryCode } = useParams()

  const disabled = !stripe || !elements ? true : false

  const handlePayment = async () => {
    if (!stripe || !elements || !cart) {
      return
    }

    setSubmitting(true)

    await stripe
      .confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/api/payment-return?cart_id=${cart.id}&country_code=${countryCode}`,
          payment_method_data: {
            billing_details: {
              name:
                cart.billing_address?.first_name +
                " " +
                cart.billing_address?.last_name,
              address: {
                city: cart.billing_address?.city ?? undefined,
                country: cart.billing_address?.country_code ?? undefined,
                line1: cart.billing_address?.address_1 ?? undefined,
                line2: cart.billing_address?.address_2 ?? undefined,
                postal_code: cart.billing_address?.postal_code ?? undefined,
                state: cart.billing_address?.province ?? undefined,
              },
              email: cart.email,
              phone: cart.billing_address?.phone ?? undefined,
            },
          },
        },
        // Only leave the site when the selected method actually requires it, so
        // card payments still complete inline.
        redirect: "if_required",
      })
      .then(async ({ error, paymentIntent }) => {
        if (error) {
          const pi = error.payment_intent

          if (
            (pi && pi.status === "requires_capture") ||
            (pi && pi.status === "succeeded")
          ) {
            await confirmAndComplete()
            return
          }

          setErrorMessage(error.message || null)
          setSubmitting(false)
          return
        }

        if (
          paymentIntent.status === "requires_capture" ||
          paymentIntent.status === "succeeded"
        ) {
          await confirmAndComplete()
          return
        }

        setSubmitting(false)
      })
  }

  return (
    <>
      <Button
        disabled={disabled || notReady || submitting}
        onClick={handlePayment}
        size="large"
        isLoading={submitting && !confirmed}
        data-testid={dataTestId}
        className={
          confirmed ? "bg-green-600 hover:bg-green-600" : undefined
        }
        style={
          confirmed && prefersReducedMotion
            ? { transition: "none" }
            : undefined
        }
      >
        {confirmed ? (
          <>
            <ConfirmedCheck reduceMotion={prefersReducedMotion === true} />
            Order placed
          </>
        ) : (
          "Place order"
        )}
      </Button>
      <ErrorMessage
        error={errorMessage}
        data-testid="stripe-payment-error-message"
      />
    </>
  )
}

const ManualTestPaymentButton = ({ notReady }: { notReady: boolean }) => {
  const [submitting, setSubmitting] = useState(false)
  const [confirmed, setConfirmed] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const prefersReducedMotion = useReducedMotion()

  const onPaymentCompleted = async () => {
    await placeOrder()
      .catch((err) => {
        setErrorMessage(err.message)
        setConfirmed(false)
      })
      .finally(() => {
        setSubmitting(false)
      })
    // placeOrder redirects to the confirmation page when the order is
    // placed, so reaching here means it resolved without redirecting:
    // the order did not complete, so drop the confirmed state instead
    // of leaving a green check on a checkout that is still open.
    setConfirmed(false)
  }

  // Payment succeeded: show the green check first, then place the order.
  // The pause is what makes the check visible — placeOrder redirects to
  // the confirmation page on success.
  const confirmAndComplete = async () => {
    setConfirmed(true)
    await new Promise((resolve) => setTimeout(resolve, CONFIRM_HOLD_MS))
    await onPaymentCompleted()
  }

  const handlePayment = () => {
    setSubmitting(true)

    confirmAndComplete()
  }

  return (
    <>
      <Button
        disabled={notReady || submitting}
        isLoading={submitting && !confirmed}
        onClick={handlePayment}
        size="large"
        data-testid="submit-order-button"
        className={
          confirmed ? "bg-green-600 hover:bg-green-600" : undefined
        }
        style={
          confirmed && prefersReducedMotion
            ? { transition: "none" }
            : undefined
        }
      >
        {confirmed ? (
          <>
            <ConfirmedCheck reduceMotion={prefersReducedMotion === true} />
            Order placed
          </>
        ) : (
          "Place order"
        )}
      </Button>
      <ErrorMessage
        error={errorMessage}
        data-testid="manual-payment-error-message"
      />
    </>
  )
}

export default PaymentButton
