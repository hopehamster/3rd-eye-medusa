import LocalizedClientLink from "@modules/common/components/localized-client-link"

const OracleCta = () => {
  return (
    <div className="relative overflow-hidden border-y border-cosmos-borderSoft">
      {/* Mystical background */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse 60% 80% at 50% 50%, rgba(76, 29, 149, 0.2) 0%, transparent 70%),
            linear-gradient(180deg, rgba(10, 8, 12, 0.9) 0%, rgba(20, 12, 28, 0.95) 50%, rgba(10, 8, 12, 0.9) 100%)
          `,
        }}
      />
      {/* Floating orbs */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        {Array.from({ length: 8 }).map((_, i) => (
          <span
            key={i}
            className="oracle-orb"
            style={{
              left: `${10 + (i * 11) % 80}%`,
              top: `${20 + (i * 17) % 60}%`,
              animationDelay: `${(i * 1.2) % 6}s`,
              width: `${60 + ((i * 23) % 80)}px`,
              height: `${60 + ((i * 23) % 80)}px`,
            }}
          />
        ))}
      </div>

      <div className="content-container relative z-10 py-24 text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full border border-cosmos-gold/30 bg-cosmos-gold/10">
          <span className="font-display text-3xl text-cosmos-goldBright">◉</span>
        </div>
        <p className="text-[11px] uppercase tracking-[0.35em] text-cosmos-gold mb-4">
          Not sure where to begin?
        </p>
        <h2 className="font-display text-4xl small:text-5xl font-light text-cosmos-text mb-6 tracking-tight">
          Ask the <span className="italic text-cosmos-goldBright" style={{ textShadow: "0 0 30px rgba(200,150,60,0.4)" }}>Oracle</span>
        </h2>
        <p className="max-w-xl mx-auto text-cosmos-muted mb-10 leading-relaxed">
          Describe what you need in plain words — or take the guided quiz.
          The Oracle reads from our canon of metaphysical knowledge and
          points you to the pieces that align.
        </p>
        <div className="flex flex-col small:flex-row items-center justify-center gap-4">
          <LocalizedClientLink href="/oracle" className="btn-gold btn-gold-glow">
            Consult the Oracle
          </LocalizedClientLink>
          <LocalizedClientLink href="/guides" className="btn-ghost">
            Explore guides
          </LocalizedClientLink>
        </div>
      </div>

      <style jsx>{`
        .oracle-orb {
          position: absolute;
          border-radius: 9999px;
          background: radial-gradient(circle, rgba(139, 92, 246, 0.15) 0%, transparent 70%);
          animation: orb-float 8s ease-in-out infinite;
          filter: blur(1px);
        }
        @keyframes orb-float {
          0%, 100% { transform: translateY(0) scale(1); opacity: 0.6; }
          50% { transform: translateY(-20px) scale(1.1); opacity: 1; }
        }
      `}</style>
    </div>
  )
}

export default OracleCta
