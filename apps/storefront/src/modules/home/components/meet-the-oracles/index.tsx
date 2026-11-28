import LocalizedClientLink from "@modules/common/components/localized-client-link"

/**
 * Meet the Oracles — the four AI guides, introduced by name on the
 * homepage (positioning, 2026-11-28). Until now the guides were
 * named only on the Oracle page itself; this section is the upsell:
 * who each guide is, what each one does, and the members gate stated
 * in the open on the button instead of sprung on the Oracle page.
 * Copy: COPY-UPGRADE.md section 2.
 */
const GUIDES = [
  {
    name: "Sage",
    title: "the crystal guide",
    blurb:
      "Years with stones, a little nerdy about mineralogy, and blunt about which pieces are hype. Start with Sage when the question is \u201cwhich stone?\u201d",
  },
  {
    name: "Luna",
    title: "the tarot reader",
    blurb:
      "Pulls cards in conversation and holds up a mirror \u2014 she does not predict your future, and she will tell you when a question is not one for the cards.",
  },
  {
    name: "Theo",
    title: "the numerologist",
    blurb:
      "Give Theo a birth date and watch the math happen in the open \u2014 life path, cycles, timing \u2014 every step shown, nothing vague.",
  },
  {
    name: "The Oracle",
    title: "the general guide",
    blurb:
      "Any question that does not belong to the other three lands here.",
  },
]

const MeetTheOracles = () => {
  return (
    <section className="paper-grain text-paper-text">
      <div className="content-container relative z-[2] py-16 small:py-24">
        <div className="mb-10 inline-block max-w-2xl rounded-specimen border border-paper-border bg-paper-raised px-6 py-5">
          <h2 className="font-display text-4xl font-light tracking-tight text-paper-text small:text-5xl">
            Four guides keep this counter. All of them are AI.
          </h2>
          <p className="mt-4 font-humanist text-base leading-7 text-paper-muted">
            Every crystal shop has someone behind the counter. Ours has
            four — and they are the reason this store exists. They have
            read everything on our shelves and everything in our guides,
            and they answer from that, never from the whole internet.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 xsmall:grid-cols-2 small:grid-cols-4">
          {GUIDES.map((guide) => (
            <article key={guide.name} className="specimen-card px-5 pb-5 pt-4">
              <div className="specimen-label flex items-baseline justify-between gap-3">
                <span>{guide.name}</span>
                <span className="font-humanist text-sm text-paper-faint">
                  {guide.title}
                </span>
              </div>
              <p className="specimen-meta mt-3">{guide.blurb}</p>
            </article>
          ))}
        </div>

        <p className="mt-10 max-w-2xl font-humanist text-base leading-7 text-paper-muted">
          Ask freely, in your own words — or take the four-question quiz
          and let a guide read between the lines. Your readings are saved
          to your account, so each one picks up where the last left off.
        </p>
        <LocalizedClientLink
          href="/oracle"
          className="mt-7 inline-flex items-center justify-center bg-paper-accent px-7 py-3.5 font-humanist text-sm font-semibold tracking-wide text-paper-raised transition-colors duration-200 hover:bg-paper-accentBright"
        >
          Meet the guides — it takes a free account
        </LocalizedClientLink>
      </div>
    </section>
  )
}

export default MeetTheOracles
