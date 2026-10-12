import LocalizedClientLink from "@modules/common/components/localized-client-link"

const OracleCta = () => {
  return (
    <div className="border-y border-cosmos-borderSoft bg-violet-950/20">
      <div className="content-container py-16 text-center">
        <p className="text-xs uppercase tracking-widest text-cosmos-gold mb-3">
          Not sure where to begin?
        </p>
        <h2 className="font-display text-3xl font-light text-cosmos-text mb-4">
          Ask the <span className="italic text-cosmos-goldBright">Oracle</span>
        </h2>
        <p className="max-w-xl mx-auto text-cosmos-muted mb-8">
          Describe what you need in plain words — or take the guided quiz.
          The Oracle reads from our canon of metaphysical knowledge and
          points you to the pieces that align.
        </p>
        <div className="flex flex-col small:flex-row items-center justify-center gap-4">
          <LocalizedClientLink href="/oracle" className="btn-gold">
            Consult the Oracle
          </LocalizedClientLink>
          <LocalizedClientLink href="/ritual-builder" className="btn-ghost">
            Build a ritual
          </LocalizedClientLink>
        </div>
      </div>
    </div>
  )
}

export default OracleCta
