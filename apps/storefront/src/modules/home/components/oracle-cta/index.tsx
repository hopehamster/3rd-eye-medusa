"use client"

import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Reveal from "@modules/common/components/reveal"

/**
 * Oracle CTA — monumental moment edition.
 *
 * ASKANDRECEIVE: extreme letter-spacing, full viewport, used ONCE.
 * Custom eye sigil. Copy with teeth. No purple wash.
 */

const DUST = [
  { left: 12, top: 30, size: 4, blur: 2, opacity: 0.3, duration: 16, delay: 0 },
  { left: 24, top: 65, size: 2, blur: 0, opacity: 0.55, duration: 11, delay: 2 },
  { left: 38, top: 22, size: 6, blur: 3, opacity: 0.18, duration: 20, delay: 1 },
  { left: 52, top: 78, size: 3, blur: 1, opacity: 0.4, duration: 13, delay: 3 },
  { left: 66, top: 38, size: 2, blur: 0, opacity: 0.6, duration: 9, delay: 1.5 },
  { left: 79, top: 58, size: 5, blur: 2, opacity: 0.25, duration: 17, delay: 4 },
  { left: 88, top: 25, size: 3, blur: 1, opacity: 0.42, duration: 12, delay: 2.5 },
  { left: 6, top: 55, size: 2, blur: 0, opacity: 0.5, duration: 10, delay: 5 },
]

const EyeSigil = () => (
  <svg width="64" height="64" viewBox="0 0 64 64" fill="none" aria-hidden="true">
    <ellipse cx="32" cy="32" rx="26" ry="14" stroke="#c8a24a" strokeWidth="1.5" />
    <circle cx="32" cy="32" r="8" stroke="#c8a24a" strokeWidth="1.5" />
    <circle cx="32" cy="32" r="3" fill="#c8a24a" />
    <path d="M32 6 L36 14 L32 18 L28 14 Z" fill="#c8a24a" opacity="0.7" />
    <path d="M32 58 L36 50 L32 46 L28 50 Z" fill="#c8a24a" opacity="0.7" />
    <circle cx="32" cy="32" r="20" stroke="#c8a24a" strokeWidth="0.5" opacity="0.3" strokeDasharray="2 4" />
  </svg>
)

const OracleCta = () => {
  return (
    <div className="relative overflow-hidden border-y border-cosmos-borderSoft bg-[#0a0908]">
      {/* Single key light */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse 50% 45% at 50% 0%, rgba(190, 140, 50, 0.12) 0%, transparent 65%),
            radial-gradient(ellipse 80% 60% at 50% 120%, rgba(20, 12, 30, 0.15) 0%, transparent 60%)
          `,
        }}
      />

      {/* Organic dust */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        {DUST.map((d, i) => (
          <span
            key={i}
            className="oracle-dust"
            style={{
              left: `${d.left}%`,
              top: `${d.top}%`,
              width: `${d.size}px`,
              height: `${d.size}px`,
              filter: d.blur ? `blur(${d.blur}px)` : undefined,
              animationDuration: `${d.duration}s`,
              animationDelay: `${d.delay}s`,
              ["--dust-opacity" as string]: d.opacity,
            }}
          />
        ))}
      </div>

      <div className="content-container relative z-10 py-24 small:py-32">
        {/* Monumental tracked moment — used ONCE */}
        <Reveal>
          <p
            aria-hidden="true"
            className="text-center font-display text-[8vw] small:text-6xl font-light text-cosmos-gold/90 tracking-[0.35em] mb-16 select-none"
          >
            ASKANDRECEIVE
          </p>
        </Reveal>

        <div className="text-center">
          <Reveal>
            <div className="mx-auto mb-8 flex justify-center">
              <EyeSigil />
            </div>
          </Reveal>
          <Reveal delay={0.1}>
            <h2 className="font-display text-4xl small:text-5xl font-light text-cosmos-text mb-6 tracking-tight">
              The <span className="italic text-cosmos-goldBright">Oracle</span> knows
              <br />
              what you won&apos;t admit you need.
            </h2>
          </Reveal>
          <Reveal delay={0.2}>
            <p className="max-w-xl mx-auto text-cosmos-muted mb-10 leading-relaxed">
              Describe what&apos;s actually going on — or take the quiz.
              No fluff. No generic &quot;good vibes.&quot; The Oracle reads the canon
              and points at the stone.
            </p>
          </Reveal>
          <Reveal delay={0.3}>
            <div className="flex flex-col small:flex-row items-center justify-center gap-4">
              <LocalizedClientLink href="/oracle" className="btn-gold">
                Consult the Oracle
              </LocalizedClientLink>
              <LocalizedClientLink href="/guides" className="btn-ghost">
                Read the canon
              </LocalizedClientLink>
            </div>
          </Reveal>
        </div>
      </div>

      <style>{`
        .oracle-dust {
          position: absolute;
          border-radius: 9999px;
          background: radial-gradient(circle, rgba(200, 160, 80, 0.85) 0%, rgba(200, 160, 80, 0) 70%);
          animation: oracle-drift linear infinite;
          opacity: 0;
        }
        @keyframes oracle-drift {
          0% { transform: translate3d(0, 16px, 0); opacity: 0; }
          30% { opacity: var(--dust-opacity, 0.4); }
          70% { opacity: calc(var(--dust-opacity, 0.4) * 0.5); }
          100% { transform: translate3d(-14px, -60px, 0); opacity: 0; }
        }
      `}</style>
    </div>
  )
}

export default OracleCta
