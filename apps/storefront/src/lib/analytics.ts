/**
 * PostHog analytics helpers for 3rd Eye Supply.
 *
 * All functions are safe no-ops when PostHog is not configured
 * (NEXT_PUBLIC_POSTHOG_KEY / NEXT_PUBLIC_POSTHOG_HOST missing).
 * This lets the code ship before the self-hosted PostHog instance exists.
 */
import posthog from "posthog-js"

let initialized = false

export function isAnalyticsEnabled(): boolean {
  return !!process.env.NEXT_PUBLIC_POSTHOG_KEY
}

/**
 * Initialize PostHog. Called once from the PostHogProvider.
 * No-op when the key is missing.
 */
export function initAnalytics(): void {
  if (initialized || typeof window === "undefined") return
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY
  const host = process.env.NEXT_PUBLIC_POSTHOG_HOST
  if (!key) return

  posthog.init(key, {
    api_host: host || "https://us.i.posthog.com",
    capture_pageview: true,
    capture_pageleave: true,
    autocapture: false,
    disable_session_recording: false,
  })
  initialized = true
}

function capture(event: string, properties?: Record<string, any>): void {
  if (!initialized || typeof window === "undefined") return
  try {
    posthog.capture(event, properties)
  } catch {
    // analytics must never break the shopping flow
  }
}

/** Product detail page viewed */
export function trackProductView(input: {
  productId: string
  title: string
  handle?: string
  price?: number
  currency?: string
}): void {
  capture("product_viewed", {
    product_id: input.productId,
    product_title: input.title,
    product_handle: input.handle,
    price: input.price,
    currency: input.currency,
  })
}

/** Item added to cart */
export function trackAddToCart(input: {
  productId: string
  variantId: string
  title: string
  quantity: number
  price?: number
  currency?: string
}): void {
  capture("add_to_cart", {
    product_id: input.productId,
    variant_id: input.variantId,
    product_title: input.title,
    quantity: input.quantity,
    price: input.price,
    currency: input.currency,
  })
}

/** Checkout started (cart -> checkout) */
export function trackBeginCheckout(input: {
  cartId?: string
  itemCount: number
  total?: number
  currency?: string
}): void {
  capture("begin_checkout", {
    cart_id: input.cartId,
    item_count: input.itemCount,
    total: input.total,
    currency: input.currency,
  })
}

/** Order completed */
export function trackPurchase(input: {
  orderId: string
  total: number
  currency: string
  itemCount: number
}): void {
  capture("purchase", {
    order_id: input.orderId,
    total: input.total,
    currency: input.currency,
    item_count: input.itemCount,
  })
}
