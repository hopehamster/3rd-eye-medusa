"use client"

import { motion, useAnimationControls, useReducedMotion } from "framer-motion"
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
 *
 * The wrapper itself is always rendered, so its previous-step ref survives
 * while its section is closed and the direction of a back navigation is
 * still known when the section reopens.
 *
 * Payment is the exception to mount-on-open (`keepMounted`): on base its
 * body stayed mounted-but-hidden, which keeps Stripe's Payment Element
 * (and any card details typed into it) alive while the visitor is on
 * another step. So for Payment the wrapper stays mounted and the body
 * stays mounted-but-hidden, and the slide is driven by animation controls
 * instead of a fresh mount: on activation the controls are set to the
 * slide's start position for that navigation's direction and then started
 * towards the resting position. The body itself decides its own
 * visibility with its block/hidden class, exactly as on base.
 *
 * No slide on first load: while the previous step is still unknown
 * (`prevIndex === null`, i.e. the first render) the section appears
 * instantly, so a direct load or deep link never slides. Only a real
 * step change slides.
 */
const STEP_ORDER = ["address", "delivery", "payment", "review"] as const

const stepIndex = (step: string | null): number => {
  const index = (STEP_ORDER as readonly string[]).indexOf(step ?? "")
  return index === -1 ? 0 : index
}

const CheckoutStepSlide = ({
  isOpen,
  children,
  keepMounted = false,
}: {
  isOpen: boolean
  children: React.ReactNode
  keepMounted?: boolean
}) => {
  const searchParams = useSearchParams()
  const shouldReduceMotion = useReducedMotion()
  const prevIndexRef = useRef<number | null>(null)
  const controls = useAnimationControls()

  const currentIndex = stepIndex(searchParams.get("step"))
  const prevIndex = prevIndexRef.current
  const direction =
    prevIndex === null || currentIndex >= prevIndex ? 1 : -1

  useEffect(() => {
    prevIndexRef.current = currentIndex
  }, [currentIndex])

  useEffect(() => {
    if (!keepMounted || shouldReduceMotion) {
      return
    }
    if (isOpen) {
      if (prevIndex === null) {
        controls.set({ opacity: 1, x: 0 })
      } else {
        controls.set({ opacity: 0, x: 24 * direction })
        void controls.start({
          opacity: 1,
          x: 0,
          transition: { duration: 0.35, ease: "easeOut" },
        })
      }
    } else {
      controls.set({ opacity: 0, x: 24 * direction })
    }
  }, [isOpen, direction, prevIndex, keepMounted, shouldReduceMotion, controls])

  if (!keepMounted && !isOpen) {
    return null
  }

  if (shouldReduceMotion) {
    return <>{children}</>
  }

  if (keepMounted) {
    return (
      <motion.div animate={controls} initial={false}>
        {children}
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={
        prevIndex === null ? false : { opacity: 0, x: 24 * direction }
      }
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  )
}

export default CheckoutStepSlide
