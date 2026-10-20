/**
 * Trust furniture for the PDP (bright apothecary redesign, issue #24).
 *
 * Honesty rules for this store (CJ dropshipping, issue #8 / #26):
 * - Stones are real and curated; pieces ship directly from supplier partners.
 * - Never claim handmade, family-owned warehouse, or ships-from-USA.
 * - Delivery copy reflects real transit times, not 3-5 day promises.
 *
 * COPY SLOT (Agent Voice, issue #26): final wording reviewed there.
 */
const NOTES: { title: string; body: string }[] = [
  {
    title: "Sourcing",
    body: "Curated stones and ritual goods from our supplier partners, checked against the listing before your order ships directly to you.",
  },
  {
    title: "Shipping",
    body: "Orders are prepared by our partners and shipped with tracking on every parcel. Most orders arrive within 7-15 days.",
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
