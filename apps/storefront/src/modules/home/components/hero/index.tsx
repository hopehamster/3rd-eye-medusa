"use client"

import { motion } from "framer-motion"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

/**
 * 3rd Eye Supply hero — directed light edition.
 *
 * One key light (warm gold, upper third). Violet reduced to a whisper.
 * Organic dust distribution. Framer-motion entrances. No style jsx.
 */

// Organic particle field: varied size, blur, opacity, drift — no lattice
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
      {/* Single key light: warm gold, upper third. Violet is a whisper. */}
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

      {/* Organic gold dust */}
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

      <div className="content-container relative z-10 flex min-h-[82vh] flex-col items-center justify-center py-32 text-center">
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease, delay: 0.1 }}
          className="mb-8 text-[11px] font-medium uppercase tracking-[0.45em] text-cosmos-gold"
        >
          Las Vegas · Est. MMXXVI
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, ease, delay: 0.25 }}
          className="font-display max-w-5xl text-6xl font-light leading-[1.02] tracking-tight text-cosmos-text small:text-8xl"
        >
          Objects of{" "}
          <span className="italic text-cosmos-goldBright">intention</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.1, ease, delay: 0.45 }}
          className="mt-8 max-w-xl text-lg leading-relaxed text-cosmos-muted"
        >
          Hand-selected crystals, wood rings, and orgone art — chosen for
          craft, beauty, and the rituals they inspire.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease, delay: 0.6 }}
          className="mt-12 flex flex-col items-center gap-4 small:flex-row"
        >
          <LocalizedClientLink href="/store" className="btn-gold">
            Shop the collection
          </LocalizedClientLink>
          <LocalizedClientLink href="/store" className="btn-ghost">
            Bestsellers
          </LocalizedClientLink>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.4, ease, delay: 0.85 }}
          className="gold-hairline mt-20 w-48"
          aria-hidden="true"
        />

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.4, ease, delay: 1 }}
          className="mt-8 max-w-md text-xs leading-relaxed tracking-wide text-cosmos-faint"
        >
          Every piece is photographed by hand and shipped from our Las Vegas
          studio. No two stones are alike.
        </motion.p>
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
