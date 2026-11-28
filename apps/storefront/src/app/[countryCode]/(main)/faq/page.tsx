import { Metadata } from "next"

export const metadata: Metadata = {
  title: "FAQ | 3rd Eye Supply",
  description:
    "Short answers from 3rd Eye Supply — sizing, materials, care, shipping times, tracking and returns, in plain talk.",
}

// Short answers only. Anything that needs the full picture links out to the
// Shipping, Returns and About pages rather than repeating them here, so the
// numbers can never drift apart between pages.
const FAQS = [
  {
    q: "How do I pick a size?",
    a: "Each listing states its sizes in centimetres and inches — bead diameter for bracelets, ring size where rings are sized, and the piece's own dimensions for carvings and points. For a bracelet, measure around your wrist with a tape or a strip of paper, then add about 1 cm for a comfortable fit. If a listing does not give a measurement you need, ask us before ordering rather than guessing.",
  },
  {
    q: "What is it made of?",
    a: "The listing names the stone and, for jewellery, the metal or cord it is set on. Stones are natural material unless a listing says otherwise. Some stones are dyed, heated, coated or stabilised in the trade — where our supplier tells us a piece has been treated, the listing says so, and the About page explains our rule in full.",
  },
  {
    q: "How do I look after a stone?",
    a: "A soft, dry cloth handles most pieces. Keep dyed and coated stones, and soft stones like selenite and calcite, out of water and out of long direct sunlight — both can fade colour or mark the surface. Store pieces separately where you can; harder stones scratch softer ones. None of this is ritual — it is just how the material lasts.",
  },
  {
    q: "How long does shipping take?",
    a: "Our supplier dispatches in 1–3 business days. After that, US delivery usually takes 5–12 business days — most US orders arrive within 7 to 15 business days of ordering, end to end. Items in one order can ship in separate parcels on different days. The Shipping page has the full table, including EU times.",
  },
  {
    q: "Where is my parcel?",
    a: "Your dispatch email carries one tracking number per parcel. Some economy lanes are only part-scanned, so a number can sit quiet for a few days and then jump — quiet tracking is not proof a parcel is lost. If there has been no movement at all for 10 business days, write to support@3rdeyesupply.com with your order number and we will open a trace.",
  },
  {
    q: "Can I return something?",
    a: "Yes — you have 30 days from delivery. Email support@3rdeyesupply.com before posting anything and wait for the return address; do not post to the address printed on the parcel. If the item arrived damaged, faulty or wrong, tell us within 72 hours with a photograph and return postage is on us. The Returns page has the full rules, including what we cannot take back.",
  },
  {
    q: "Are the stones real?",
    a: "That is what the listings say, and it is what we are selling you. Natural stone has inclusions, uneven colour and small imperfections, because it grew in the ground over a very long time. We do not assay stones in a lab — if a piece arrives and it is plainly not what the listing described, that is a refund, no argument.",
  },
  {
    q: "Will a stone heal me, protect me, or bring me luck?",
    a: "We make no such claim, for any product, ever. People have associated stones with meanings for a very long time, and where a listing mentions a traditional association it is describing that tradition — not promising you a result. What we promise is the stone itself: the material named, as described. The About page sets this out in full.",
  },
]

export default async function FaqPage() {
  return (
    <div className="bg-paper-bg paper-grain text-paper-text">
      <div className="relative z-[2] mx-auto max-w-4xl px-6 py-12">
        <header className="mb-10 max-w-2xl">
          <h1 className="font-display text-4xl small:text-5xl font-light tracking-tight text-paper-text mb-4">
            Questions, answered plainly
          </h1>
          <p className="font-humanist text-paper-muted leading-7">
            The short answers. Where a question needs the whole picture, the
            answer points to the page that has it — Shipping, Returns, or
            About &amp; Our Promise.
          </p>
        </header>

        <div className="mx-auto max-w-3xl">
          {FAQS.map((item) => (
            <details
              key={item.q}
              className="group mb-3 overflow-hidden rounded-specimen border border-paper-border bg-paper-raised"
            >
              <summary className="flex w-full cursor-pointer list-none items-center justify-between px-5 py-4 text-left font-display text-[16px] text-paper-text marker:hidden [&::-webkit-details-marker]:hidden">
                {item.q}
              </summary>
              <p className="border-t border-paper-borderSoft bg-paper-raised px-5 pb-5 pt-4 font-humanist text-[14px] leading-relaxed text-paper-muted">
                {item.a}
              </p>
            </details>
          ))}
        </div>

        <section>
          <p className="mt-10 font-humanist text-[15px] leading-7 text-paper-text">
            Still stuck? Write to support@3rdeyesupply.com with your order
            number, and a person on this end will answer.
          </p>
        </section>
      </div>
    </div>
  )
}
