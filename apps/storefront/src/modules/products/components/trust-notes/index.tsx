/**
 * Trust furniture for the PDP (bright apothecary redesign, issue #24).
 *
 * Honesty rules for this store (CJ dropshipping, issue #8 / #26):
 * - Stones are real and curated; pieces ship directly from supplier partners.
 * - Never claim handmade, family-owned warehouse, or ships-from-USA.
 * - Delivery copy must not promise what the shipping policy cannot state.
 *
 * Revised 2026-11-03 (#139): two claims here contradicted /us/shipping.
 *   1. "checked against the listing before your order ships" implied a physical
 *      inspection, while the policy says plainly "We do not inspect parcels
 *      before they go out". Listing data is checked against the supplier's at
 *      listing time — not a parcel check.
 *   2. "Most orders arrive within 7-15 days" stated a range the shipping policy
 *      deliberately leaves as [FILL] until the owner confirms dispatch and
 *      transit times. A number here that the policy will not back is exactly the
 *      kind of promise this shop must not make.
 *
 * COPY SLOT (Agent Voice, issue #26): final wording reviewed there.
 */
const NOTES: { title: string; body: string }[] = [
  {
    title: "Sourcing",
    body: "Curated stones and ritual goods from our supplier partners. Every listing names the stone and the material, and the photographs are the supplier's own.",
  },
  {
    title: "Shipping",
    body: "Prepared by our supplier partners and shipped with tracking. Dispatch and delivery estimates are on the shipping page.",
  },
  {
    title: "Returns",
    body: "If your piece arrives damaged or is not what you ordered, contact us and we will replace it or refund you.",
  },
]

const TrustNotes = () => {
  return (
    <div data-testid="trust-notes" className="font-humanist">
      <div className="border-b border-paper-border">
        {NOTES.map((note) => (
          <div
            key={note.title}
            className="border-t border-paper-border py-4"
          >
            <p className="font-display text-[15px] text-paper-text">
              {note.title}
            </p>
            <p className="mt-1 text-sm leading-relaxed text-paper-muted">
              {note.body}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}

export default TrustNotes
