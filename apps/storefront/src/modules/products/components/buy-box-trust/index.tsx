import LocalizedClientLink from "@modules/common/components/localized-client-link"

/**
 * Buy-box trust block (issue #157). Sits directly under the add-to-cart
 * actions in the PDP specimen panel, so shipping, returns and payment are
 * visible before the fold instead of buried in small print below it.
 *
 * Honesty rules for this store (CJ dropshipping, issue #8 / #26, #139):
 * - Every line here is backed by a policy page this file was checked
 *   against (/us/shipping, /us/returns) or by checkout code. Nothing is
 *   promised that the shipping policy cannot state.
 * - No delivery times: the shipping policy leaves dispatch and transit
 *   times as [FILL] until the owner confirms them, and states plainly
 *   that no delivery date can be guaranteed. This block states no times.
 * - No in-stock line: the PDP product fetch
 *   (products/[handle]/page.tsx) does not request
 *   +variants.inventory_quantity, so no real inventory data reaches this
 *   component. An "In stock" line here would be invented. Real stock
 *   needs that field added to the PDP fetch first (see BUILD-REPORT.md).
 * - No free-shipping threshold: any threshold lives in backend shipping
 *   price rules and is surfaced by the cart nudge, not stated for the PDP.
 * - No instalments: there is no instalment provider in this codebase
 *   (zero matches for installment / Afterpay / Klarna / Shop Pay).
 *   Payment is card through Stripe (checkout payment-wrapper).
 * - No reviews: reviews must be earned first (Michael 2026-11-11).
 *   No stars, counts, or review copy anywhere in this block.
 */
const BuyBoxTrust = () => {
  return (
    <div data-testid="buy-box-trust" className="font-humanist">
      <div className="border-b border-paper-border">
        <div className="border-t border-paper-border py-3">
          <p className="font-display text-[15px] text-paper-text">
            Shipping
          </p>
          <p className="mt-1 text-sm leading-relaxed text-paper-muted">
            Prepared by our supplier partners and shipped with tracking.
            Dispatch and delivery estimates are on the{" "}
            <LocalizedClientLink
              href="/shipping"
              className="underline decoration-paper-border underline-offset-4 hover:text-paper-accent transition-colors"
            >
              shipping page
            </LocalizedClientLink>
            .
          </p>
        </div>
        <div className="border-t border-paper-border py-3">
          <p className="font-display text-[15px] text-paper-text">Returns</p>
          <p className="mt-1 text-sm leading-relaxed text-paper-muted">
            If your piece arrives damaged or is not what you ordered, report
            it within 72 hours of delivery with photographs and we will
            replace it or refund you. EU customers have fourteen days to
            withdraw, no reason needed. See the{" "}
            <LocalizedClientLink
              href="/returns"
              className="underline decoration-paper-border underline-offset-4 hover:text-paper-accent transition-colors"
            >
              returns page
            </LocalizedClientLink>
            .
          </p>
        </div>
        <div className="border-t border-paper-border py-3">
          <p className="font-display text-[15px] text-paper-text">Payment</p>
          <p className="mt-1 text-sm leading-relaxed text-paper-muted">
            Pay by card through Stripe.
          </p>
        </div>
      </div>
    </div>
  )
}

export default BuyBoxTrust
