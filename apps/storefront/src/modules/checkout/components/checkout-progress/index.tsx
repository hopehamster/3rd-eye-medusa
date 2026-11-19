"use client"

import { motion, useReducedMotion } from "framer-motion"
import { useSearchParams } from "next/navigation"

/**
 * Checkout progress line (issue #234). A thin gold line across the top of
 * the checkout fills a quarter further each time a section is completed:
 * address, delivery, payment, review. The current step comes from the
 * `step` search param the sections already navigate with; when the param
 * is absent (direct landing), the server-provided fallback step is the
 * first incomplete section from the cart. The fill animates in 0.4s, and
 * with reduced motion it renders at its final width with no animation.
 */
const STEPS = ["address", "delivery", "payment", "review"] as const
const TOTAL_STEPS = STEPS.length

const CheckoutProgress = ({
  fallbackStepIndex,
}: {
  fallbackStepIndex: number
}) => {
  const prefersReducedMotion = useReducedMotion()
  const searchParams = useSearchParams()

  const stepParam = searchParams.get("step")
  const stepIndex = stepParam
    ? STEPS.indexOf(stepParam as (typeof STEPS)[number])
    : -1
  const currentStep = stepIndex >= 0 ? stepIndex : fallbackStepIndex
  const progress = (currentStep + 1) / TOTAL_STEPS

  return (
    <div
      role="progressbar"
      aria-label="Checkout progress"
      aria-valuemin={0}
      aria-valuemax={TOTAL_STEPS}
      aria-valuenow={currentStep + 1}
      data-testid="checkout-progress"
      className="mb-8 h-0.5 w-full bg-ui-border-base"
    >
      {prefersReducedMotion ? (
        <div
          data-testid="checkout-progress-fill"
          className="h-full bg-cosmos-gold"
          style={{ width: `${progress * 100}%` }}
        />
      ) : (
        <motion.div
          data-testid="checkout-progress-fill"
          className="h-full origin-left bg-cosmos-gold"
          initial={false}
          animate={{ scaleX: progress }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        />
      )}
    </div>
  )
}

export default CheckoutProgress
