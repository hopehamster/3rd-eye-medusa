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

          <div>
            <p className="font-humanist text-sm font-semibold uppercase tracking-wide text-paper-raised/70">
              People actually ask
            </p>
            <ul className="mt-4 divide-y divide-paper-raised/20 border-y border-paper-raised/20">
              {SAMPLE_QUESTIONS.map((q) => (
                <li key={q}>
                  <LocalizedClientLink
                    href="/oracle"
                    className="block py-4 font-display text-lg leading-snug text-paper-raised transition-colors duration-200 hover:text-paper-accentSoft"
                  >
                    {q}
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
