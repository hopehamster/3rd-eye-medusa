"use client"

import { motion } from "framer-motion"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

/**
 * 3rd Eye Supply hero — rule-break edition.
 *
 * 1. Fused words: "ofintention" — deliberate typographic deconstruction.
 * 2. Copy with teeth: punches instead of describes.
 * 3. Contradictory pair: ANCIENT / MODERN as tension.
 * 4. One key light, organic dust — the signature moment.
 */

const PARTICLES = [
  { left: 8, top: 72, size: 3, blur: 0, opacity: 0.7, duration: 11, delay: 0 },
  { left: 14, top: 28, size: 2, blur: 1, opacity: 0.4, duration: 14, delay: 2 },
  { left: 22, top: 55, size: 5, blur: 2, opacity: 0.25, duration: 17, delay: 1 },
  { left: 31, top: 18, size: 2, blur: 0, opacity: 0.6, duration: 9, delay: 4 },
  { left: 38, top: 82, size: 4, blur: 1, opacity: 0.35, duration: 13, delay: 3 },
  { left: 45, top: 35, size: 2, blur: 0, opacity: 0.8, duration: 10, delay: 1.5 },
  { left: 52, top: 68, size: 6, blur: 3, opacity: 0.18, duration: 19, delay: 0.5 },
  { left: 58, top: 22, size: 3, blur: 1, opacity: 0.5, duration: 12, delay: 5 },
  { left: 64, top: 48, size: 2, blur: 0, opacity: 0.65, duration: 8, delay: 2.5 },
  { left: 71, top: 78, size: 4, blur: 2, opacity: 0.3, duration: 15, delay: 4 },
  { left: 78, top: 32, size: 2, blur: 0, opacity: 0.55, duration: 11, delay: 6 },
  { left: 84, top: 60, size: 5, blur: 2, opacity: 0.22, duration: 18, delay: 1 },
  { left: 90, top: 15, size: 3, blur: 1, opacity: 0.45, duration: 13, delay: 3.5 },
  { left: 5, top: 45, size: 4, blur: 2, opacity: 0.28, duration: 16, delay: 2 },
  { left: 27, top: 88, size: 2, blur: 0, opacity: 0.6, duration: 9, delay: 5.5 },
  { left: 48, top: 12, size: 3, blur: 1, opacity: 0.4, duration: 14, delay: 0.8 },
  { left: 67, top: 85, size: 2, blur: 0, opacity: 0.5, duration: 10, delay: 4.5 },
  { left: 93, top: 42, size: 4, blur: 1, opacity: 0.32, duration: 12, delay: 2.2 },
]

const ease = [0.22, 1, 0.36, 1] as const

const Hero = () => {
  return (
    <div className="relative w-full overflow-hidden border-b border-cosmos-borderSoft bg-[#08070c]">
      {/* Single key light */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse 55% 38% at 50% 18%, rgba(190, 140, 50, 0.16) 0%, transparent 65%),
            radial-gradient(ellipse 90% 70% at 50% 115%, rgba(40, 24, 70, 0.08) 0%, transparent 60%)
          `,
        }}
      />

      {/* Organic gold dust — the signature moment */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        {PARTICLES.map((p, i) => (
          <span
            key={i}
            className="hero-dust"
            style={{
              left: `${p.left}%`,
              top: `${p.top}%`,
              width: `${p.size}px`,
              height: `${p.size}px`,
              filter: p.blur ? `blur(${p.blur}px)` : undefined,
              animationDuration: `${p.duration}s`,
              animationDelay: `${p.delay}s`,
              ["--dust-opacity" as string]: p.opacity,
            }}
          />
        ))}
      </div>

      {/* Vignette */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background: `radial-gradient(ellipse 70% 60% at 50% 45%, transparent 40%, rgba(0,0,0,0.55) 100%)`,
        }}
      />

      <div className="content-container relative z-10 flex min-h-[88vh] flex-col items-start justify-center py-32">
        {/* Contradictory pair as eyebrow */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, ease, delay: 0.1 }}
          className="mb-10 text-[11px] font-medium uppercase tracking-[0.4em] text-cosmos-gold"
        >
          Ancient stones <span className="text-cosmos-faint mx-3">/</span> Modern rituals
        </motion.p>

        {/* Fused-words headline */}
        <motion.h1
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, ease, delay: 0.25 }}
          className="font-display max-w-6xl text-[13vw] small:text-[7.5rem] font-light leading-[0.95] tracking-tight text-cosmos-text"
        >
          Objects
          <br />
          of<span className="text-cosmos-goldBright">intention</span>
        </motion.h1>

        {/* Copy with teeth */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.1, ease, delay: 0.45 }}
          className="mt-10 max-w-xl"
        >
          <p className="text-lg leading-relaxed text-cosmos-text font-medium">
            Not decoration. Instruments.
          </p>
          <p className="mt-3 text-base leading-relaxed text-cosmos-muted">
            Real stones, chosen by hand in Las Vegas. No two alike. No exceptions.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease, delay: 0.6 }}
          className="mt-12 flex flex-col items-start gap-4 small:flex-row small:items-center"
        >
          <LocalizedClientLink href="/store" className="btn-gold">
            Enter the collection
          </LocalizedClientLink>
          <LocalizedClientLink href="/oracle" className="btn-ghost">
            Ask the Oracle
          </LocalizedClientLink>
        </motion.div>
      </div>

      <style>{`
        .hero-dust {
          position: absolute;
          border-radius: 9999px;
          background: radial-gradient(circle, rgba(230, 190, 100, 0.9) 0%, rgba(230, 190, 100, 0) 70%);
          animation: hero-dust-drift linear infinite;
          opacity: 0;
        }
        @keyframes hero-dust-drift {
          0% { transform: translate3d(0, 24px, 0) scale(0.6); opacity: 0; }
          25% { opacity: var(--dust-opacity, 0.5); }
          75% { opacity: calc(var(--dust-opacity, 0.5) * 0.6); }
          100% { transform: translate3d(12px, -90px, 0) scale(1); opacity: 0; }
        }
      `}</style>
    </div>
  )
}

export default Hero
