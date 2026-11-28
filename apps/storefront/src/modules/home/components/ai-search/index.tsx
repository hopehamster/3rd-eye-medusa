import LocalizedClientLink from "@modules/common/components/localized-client-link"

/**
 * AI search section (positioning, 2026-11-28) — the search claim from
 * the directive, worded the way the feature actually works: the
 * Oracles take full sentences, and the search box itself falls back
 * to meaning ("Similar in spirit") when the exact words find nothing.
 * Copy: COPY-UPGRADE.md section 3.
 */
const AiSearch = () => {
  return (
    <section className="border-y border-paper-borderSoft paper-grain text-paper-text">
      <div className="content-container relative z-[2] py-16 small:py-20">
        <div className="mx-auto max-w-3xl rounded-specimen border border-paper-border bg-paper-raised p-8">
          <h2 className="font-display text-4xl font-light tracking-tight text-paper-text">
            The only search that listens instead of matching.
          </h2>
          <p className="mt-4 font-humanist text-base leading-7 text-paper-muted">
            Other shops make you guess the stone&apos;s name before you
            can find it. Here, you describe what you need — a desk that
            will not settle, a bedroom that will not quiet, a gift for
            someone who just moved — and our AI points you at the pieces
            that fit. Ask the Oracles in full sentences. Even the search
            box has a memory for meaning: type what a stone is{" "}
            <em>for</em>, and if the exact words find nothing, it answers
            with pieces that are similar in spirit.
          </p>
          <LocalizedClientLink
            href="/oracle"
            className="mt-7 inline-flex items-center justify-center bg-paper-accent px-7 py-3.5 font-humanist text-sm font-semibold tracking-wide text-paper-raised transition-colors duration-200 hover:bg-paper-accentBright"
          >
            Ask in your own words
          </LocalizedClientLink>
        </div>
      </div>
    </section>
  )
}

export default AiSearch
