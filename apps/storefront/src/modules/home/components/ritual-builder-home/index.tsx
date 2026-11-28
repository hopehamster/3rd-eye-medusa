import LocalizedClientLink from "@modules/common/components/localized-client-link"

/**
 * Ritual Builder homepage section (positioning, 2026-11-28) — the
 * builder had no homepage presence at all, only a nav link. Sold as
 * what it is: a builder that assembles a step-by-step ritual around
 * the pieces a customer holds, not an AI author. Copy:
 * COPY-UPGRADE.md section 4.
 */
const RitualBuilderHome = () => {
  return (
    <section className="paper-grain text-paper-text">
      <div className="content-container relative z-[2] py-16 small:py-20">
        <div className="mx-auto max-w-3xl rounded-specimen border border-paper-border bg-paper-raised p-8">
          <h2 className="font-display text-4xl font-light tracking-tight text-paper-text">
            Bought the stones? The Ritual Builder puts them to work.
          </h2>
          <p className="mt-4 font-humanist text-base leading-7 text-paper-muted">
            A stone on a shelf is a stone. A stone placed on purpose is
            a practice. Pick an intention — protection, abundance, calm
            and sleep, love, clarity, a new beginning — gather the pieces
            you hold or want, and the Ritual Builder writes you a short
            step-by-step ritual around exactly those pieces: what to
            hold, where to place things, how to close. The ritual is the
            attention. We will never tell you a stone will do the work
            for you — the steps are yours to do, and that is the point.
          </p>
          <LocalizedClientLink
            href="/ritual-builder"
            className="mt-7 inline-flex items-center justify-center bg-paper-accent px-7 py-3.5 font-humanist text-sm font-semibold tracking-wide text-paper-raised transition-colors duration-200 hover:bg-paper-accentBright"
          >
            Build your first ritual
          </LocalizedClientLink>
        </div>
      </div>
    </section>
  )
}

export default RitualBuilderHome
