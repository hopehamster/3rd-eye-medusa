import LocalizedClientLink from "@modules/common/components/localized-client-link"

/**
 * 3rd Eye Supply hero.
 *
 * The `#hero-3d-slot` region is reserved for the future React Three Fiber
 * canvas (floating crystals / particle nebula). Drop the <Canvas> in there —
 * layout, sizing, and layering are already handled. Do NOT add Three.js yet.
 */
const Hero = () => {
  return (
    <div className="cosmos-wash relative w-full overflow-hidden border-b border-cosmos-borderSoft">
      {/* 3D canvas slot — React Three Fiber mounts here in a later phase */}
      <div
        id="hero-3d-slot"
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0"
      />

      <div className="content-container relative z-10 flex min-h-[78vh] flex-col items-center justify-center py-28 text-center">
        <p className="mb-6 text-[11px] font-medium uppercase tracking-[0.35em] text-cosmos-gold">
          Las Vegas · Est. MMXXVI
        </p>

        <h1 className="font-display max-w-4xl text-5xl font-light leading-[1.08] tracking-tight text-cosmos-text small:text-7xl">
          Objects of
          <span className="italic text-cosmos-goldBright"> intention</span>
        </h1>

        <p className="mt-7 max-w-xl text-base leading-relaxed text-cosmos-muted">
          Hand-selected crystals, wood rings, and orgone art — chosen for
          craft, beauty, and the rituals they inspire.
        </p>

        <div className="mt-10 flex flex-col items-center gap-4 small:flex-row">
          <LocalizedClientLink href="/store" className="btn-gold">
            Shop the collection
          </LocalizedClientLink>
          <LocalizedClientLink href="/store" className="btn-ghost">
            Bestsellers
          </LocalizedClientLink>
        </div>

        <div className="gold-hairline mt-16 w-40" aria-hidden="true" />

        <p className="mt-6 max-w-md text-xs leading-relaxed text-cosmos-faint">
          Every piece is photographed by hand and shipped from our Las Vegas
          studio. No two stones are alike.
        </p>
      </div>
    </div>
  )
}

export default Hero
