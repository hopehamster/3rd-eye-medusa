"use client"

import { motion, useReducedMotion } from "framer-motion"

import { Heading, Text } from "@modules/common/components/ui"

import InteractiveLink from "@modules/common/components/interactive-link"

/**
 * Empty cart illustration (issue #224): a faint line drawing of a
 * stone fades in above the text, so the empty cart is not bare text.
 * Quiet and short: one 0.4s fade, easeOut, inside the house limit.
 *
 * Reduced motion: this is a client component, so it can read the OS
 * preference with useReducedMotion (the #240 pattern). When reduced
 * motion is preferred the drawing renders statically with no motion
 * props at all — a true no-op, not an instant fade. MotionConfig
 * reducedMotion="user" alone is not enough: framer-motion would still
 * run the fade, just instantly. The guard is the missing animation.
 *
 * The drawing is an inline SVG, not an image asset: one pebble
 * outline plus a single facet line, stroked in the subtle foreground
 * colour at low opacity. Decorative only, so aria-hidden.
 */
const EmptyCartMessage = () => {
  const prefersReducedMotion = useReducedMotion()

  const illustration = (
    <svg
      aria-hidden="true"
      viewBox="0 0 120 84"
      fill="none"
      className="mb-8 h-16 w-auto text-ui-fg-subtle opacity-40"
    >
      <path
        d="M60 6C86 6 110 26 110 50C110 70 88 78 60 78C32 78 10 70 10 50C10 26 34 6 60 6Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M28 54C46 44 74 44 92 54"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  )

  return (
    <div className="py-48 px-2 flex flex-col justify-center items-start" data-testid="empty-cart-message">
      {prefersReducedMotion ? (
        illustration
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        >
          {illustration}
        </motion.div>
      )}
      <Heading
        level="h1"
        className="flex flex-row text-3xl-regular gap-x-2 items-baseline"
      >
        Cart
      </Heading>
      <Text className="text-base-regular mt-4 mb-6 max-w-[32rem]">
        You don&apos;t have anything in your cart. Let&apos;s change that, use
        the link below to start browsing our products.
      </Text>
      <div>
        <InteractiveLink href="/store">Explore products</InteractiveLink>
      </div>
    </div>
  )
}

export default EmptyCartMessage
