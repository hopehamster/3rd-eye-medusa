"use client"

import { motion, useReducedMotion } from "framer-motion"
import { useSearchParams } from "next/navigation"
import { useEffect, useRef } from "react"

/**
 * Checkout step slide (issue #233).
 *
 * Checkout has no step wizard: Addresses, Shipping, Payment and Review are
 * stacked sections on one page, and the active section is the one whose
 * `?step=` value matches (address -> delivery -> payment -> review). So
 * instead of a wizard transition, this wrapper slides a section's open body
 * in each time that section becomes the active one: from the right when the
 * visitor moves forward to a later step, from the left when they go back to
 * an earlier step. The direction comes from the step order, tracked per
 * instance from the previous `?step=` value. The closed summary is rendered
 * outside this wrapper and never animates.
 *
 * The slide is enter-only: when a section stops being active its body
 * unmounts at once and its summary takes its place, so nothing jumps while
 * an outgoing body would otherwise still occupy space. Quiet and short:
 * 0.35s, opacity plus a 24px horizontal offset. Visitors who prefer reduced
 * motion get no slide at all, the body just appears.
 */
const STEP_ORDER = ["address", "delivery", "payment", "review"] as const

const stepIndex = (step: string | null): number => {
  const index = (STEP_ORDER as readonly string[]).indexOf(step ?? "")
  return index === -1 ? 0 : index
}

const CheckoutStepSlide = ({
  isOpen,
  children,
}: {
  isOpen: boolean
  children: React.ReactNode
}) => {
  const searchParams = useSearchParams()
  const shouldReduceMotion = useReducedMotion()
  const prevIndexRef = useRef<number | null>(null)

  const currentIndex = stepIndex(searchParams.get("step"))
  const prevIndex = prevIndexRef.current
  const direction =
    prevIndex === null || currentIndex >= prevIndex ? 1 : -1

  useEffect(() => {
    prevIndexRef.current = currentIndex
  }, [currentIndex])

  if (!isOpen) {
    return null
  }

  if (shouldReduceMotion) {
    return <>{children}</>
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 24 * direction }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  )
}

export default CheckoutStepSlide
