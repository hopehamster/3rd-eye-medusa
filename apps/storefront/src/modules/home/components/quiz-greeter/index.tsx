import LocalizedClientLink from "@modules/common/components/localized-client-link"

/**
 * Quiz greeter (issue #21) — the guided quiz as the front door, not a
 * buried tab. The options below mirror the first question of the
 * existing Oracle quiz; every entry lands on /oracle, where the quiz
 * and chat live (OracleExperience). Final copy: Agent Voice (issue #26).
 */
const STARTERS = [
  "I need protection",
  "I can't sleep well",
  "I feel scattered",
  "Matters of the heart",
  "I'm grieving",
  "I want more abundance",
]

const QuizGreeter = () => {
  return (
    <section className="border-y border-paper-borderSoft bg-paper-surface paper-grain text-paper-text">
      <div className="content-container relative z-[2] py-16 small:py-20">
        <div className="grid grid-cols-1 gap-10 small:grid-cols-[1fr_1.2fr] small:gap-16">
          <div>
            <h2 className="font-display text-4xl font-light tracking-tight text-paper-text">
              Not sure where to begin?
            </h2>
            <p className="mt-4 max-w-md font-humanist text-base leading-7 text-paper-muted">
              Most people do not walk in knowing stone names. Start with
              what is going on, and the Oracle will ask a few short
              questions and point you at the stones that fit — and the
              ones to skip.
            </p>
            <LocalizedClientLink
              href="/oracle"
              className="mt-7 inline-flex items-center justify-center bg-paper-accent px-7 py-3.5 font-humanist text-sm font-semibold tracking-wide text-paper-raised transition-colors duration-200 hover:bg-paper-accentBright"
            >
              Take the guided quiz
            </LocalizedClientLink>
          </div>

          <div>
            <p className="font-humanist text-base font-semibold text-paper-text">
              What brings you in?
            </p>
            <div className="mt-4 flex flex-wrap gap-2.5">
              {STARTERS.map((label) => (
                <LocalizedClientLink
                  key={label}
                  href="/oracle"
                  className="border border-paper-border bg-paper-raised px-4 py-2.5 font-humanist text-sm text-paper-text transition-colors duration-200 hover:border-paper-accent hover:text-paper-accent"
                >
                  {label}
                </LocalizedClientLink>
              ))}
            </div>
            <p className="mt-5 font-humanist text-sm leading-6 text-paper-muted">
              Or skip the questions and ask the Oracle in your own words —
              it answers from the shop's own shelves, not the whole
              internet.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

export default QuizGreeter
