/**
 * Trust furniture (issue #21) — the questions a crystal-shop skeptic
 * asks, answered on the homepage instead of buried in a footer.
 * Copy: Agent Voice (issue #26) approved set. No medical claims, no
 * false sourcing or shipping claims.
 */
const FAQS = [
  {
    q: "Are these crystals real?",
    a: "That is what the listings say, and it is what I am selling you: quartz, amethyst, agate, obsidian, moonstone. I do not assay stones in a lab, so here is the honest test you can run instead. Hold your piece up to the light. Natural stone has inclusions, uneven color, and small imperfections, because it grew in the ground over a very long time. If two beads look identical, that is the fake. And if a piece arrives and it is plainly not what the listing described, that is a refund — no argument.",
  },
  {
    q: "Then why do the photos look so polished?",
    a: "Because a photograph flatters everything. Your stone will look like the photo's close relative, not its twin. Color runs a little deeper or paler from piece to piece. We would rather tell you that now than have you learn it at the mailbox.",
  },
  {
    q: "Where does my order come from?",
    a: "From CJ Dropshipping, our supplier, whose warehouses ship your order directly to you. They are a large marketplace rather than one small workshop, which is how the prices stay where they are — and why delivery runs in days rather than hours. We will never tell you a stone was handmade in a local workshop or shipped from down the road. It was not.",
  },
  {
    q: "What if my stone arrives damaged, or it is just not for me?",
    a: "Write to us. A chipped or broken piece gets replaced or refunded. And if a stone simply is not the one, the return policy in the footer applies — no hard feelings, no ritual required.",
  },
]

const TrustFaq = () => {
  return (
    <section className="bg-paper-bg paper-grain text-paper-text">
      <div className="content-container relative z-[2] py-16 small:py-24">
        <div className="grid grid-cols-1 gap-10 small:grid-cols-[1fr_1.4fr] small:gap-16">
          <div>
            <h2 className="font-display text-4xl font-light tracking-tight text-paper-text">
              Asked at every crystal counter, ever.
            </h2>
            <p className="mt-4 max-w-md font-humanist text-base leading-7 text-paper-muted">
              This shop works with suppliers and ships directly to you, and
              we would rather say that plainly than dress it up. What you
              are buying is natural stone, chosen on purpose, with a person
              accountable for it on this end.
            </p>
          </div>

          <div className="divide-y divide-paper-borderSoft border-y border-paper-borderSoft">
            {FAQS.map((item) => (
              <details key={item.q} className="group py-5">
                <summary className="cursor-pointer list-none font-display text-xl text-paper-text marker:hidden [&::-webkit-details-marker]:hidden">
                  {item.q}
                </summary>
                <p className="mt-3 max-w-xl font-humanist text-base leading-7 text-paper-muted">
                  {item.a}
                </p>
              </details>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

export default TrustFaq