import LocalizedClientLink from "@modules/common/components/localized-client-link"

/**
 * Oracle front door (issue #21) — the Oracle presented as the store's
 * guide and front door, not a nav afterthought. This is the one
 * deliberate deep-green accent band on the homepage (allowed per the
 * issue #20 palette spec: accent sections are fine, dark defaults are
 * not). Final copy: Agent Voice (issue #26).
 */
const SAMPLE_QUESTIONS = [
  "What stone should sit on my desk while I work?",
  "I keep waking up at 3 a.m. — what helps a bedroom feel settled?",
  "What is a good first stone for someone skeptical?",
  "Which of these would you give a friend who just moved house?",
]

const OracleFrontDoor = () => {
  return (
    <section className="bg-paper-accent text-paper-raised">
      <div className="content-container py-16 small:py-24">
        <div className="grid grid-cols-1 gap-10 small:grid-cols-2 small:gap-16">
          <div>
            <h2 className="font-display text-4xl font-light tracking-tight small:text-5xl">
              The Oracle keeps the counter.
            </h2>
            <p className="mt-5 max-w-md font-humanist text-base leading-7 text-paper-raised/85">
              Every good crystal shop has someone behind the counter who
              has heard it all and will tell you the truth — including
              when a cheaper stone does the same job. Ours is the Oracle:
              ask in your own words, or take the four-question quiz, and
              it points you at the right shelf. It only recommends what
              this shop actually sells.
            </p>
            <LocalizedClientLink
              href="/oracle"
              className="mt-8 inline-flex items-center justify-center bg-paper-raised px-7 py-3.5 font-humanist text-sm font-semibold tracking-wide text-paper-accent transition-colors duration-200 hover:bg-paper-accentSoft"
            >
              Ask the Oracle
            </LocalizedClientLink>
          </div>

          {/* Fix 8 (issue #315): the sample prompts read as a numbered
              index on a raised cream card — a printed catalog index, not
              chatbot chips. Presentation only: same prompts, same order,
              same /oracle links. */}
          <div className="rounded-specimen border border-paper-border bg-paper-raised p-6 text-paper-text small:p-8">
            <p className="font-humanist text-sm font-semibold uppercase tracking-wide text-paper-muted">
              People actually ask
            </p>
            <ul className="mt-2 divide-y divide-paper-borderSoft">
              {SAMPLE_QUESTIONS.map((q, i) => (
                <li key={q}>
                  <LocalizedClientLink
                    href="/oracle"
                    className="flex items-baseline gap-4 py-4 font-display text-lg leading-snug text-paper-text transition-colors duration-200 hover:text-paper-accent"
                  >
                    <span className="font-humanist text-xs font-semibold uppercase tracking-wider text-paper-faint">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span>{q}</span>
                  </LocalizedClientLink>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  )
}

export default OracleFrontDoor
