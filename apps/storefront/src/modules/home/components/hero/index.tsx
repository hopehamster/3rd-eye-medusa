import LocalizedClientLink from "@modules/common/components/localized-client-link"

/**
 * 3rd Eye Supply hero — cinematic edition.
 *
 * Layered atmospheric depth: nebula gradients, animated grain,
 * floating gold dust particles, and dramatic typography.
 */
const Hero = () => {
  return (
    <div className="relative w-full overflow-hidden border-b border-cosmos-borderSoft bg-[#08070c]">
      {/* Layer 1: Deep nebula gradients */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          background: `
            radial-gradient(ellipse 80% 60% at 20% 20%, rgba(76, 29, 149, 0.25) 0%, transparent 60%),
            radial-gradient(ellipse 70% 50% at 80% 30%, rgba(120, 53, 15, 0.15) 0%, transparent 60%),
            radial-gradient(ellipse 90% 70% at 50% 100%, rgba(30, 27, 75, 0.3) 0%, transparent 70%),
            radial-gradient(ellipse 40% 30% at 70% 60%, rgba(180, 130, 40, 0.08) 0%, transparent 60%)
          `,
        }}
      />

      {/* Layer 2: Animated grain */}
      <div
        aria-hidden="true"
        className="hero-grain pointer-events-none absolute inset-0 z-0 opacity-[0.07]"
      />

      {/* Layer 3: Floating gold dust particles */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        {Array.from({ length: 24 }).map((_, i) => (
          <span
            key={i}
            className="hero-particle"
            style={{
              left: `${(i * 37.5) % 100}%`,
              top: `${(i * 53.7) % 100}%`,
              animationDelay: `${(i * 0.7) % 8}s`,
              animationDuration: `${6 + ((i * 1.3) % 6)}s`,
              width: `${2 + ((i * 7) % 3)}px`,
              height: `${2 + ((i * 7) % 3)}px`,
            }}
          />
        ))}
      </div>

      {/* Layer 4: Vignette */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          background: `radial-gradient(ellipse 70% 60% at 50% 45%, transparent 40%, rgba(0,0,0,0.5) 100%)`,
        }}
      />

      {/* 3D canvas slot — React Three Fiber mounts here in a later phase */}
      <div
        id="hero-3d-slot"
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0"
      />

      <div className="content-container relative z-10 flex min-h-[82vh] flex-col items-center justify-center py-32 text-center">
        <p className="hero-fade-in mb-8 text-[11px] font-medium uppercase tracking-[0.45em] text-cosmos-gold">
          Las Vegas · Est. MMXXVI
        </p>

        <h1
          className="hero-fade-in font-display max-w-5xl text-6xl font-light leading-[1.02] tracking-tight text-cosmos-text small:text-8xl"
          style={{ animationDelay: "0.15s" }}
        >
          Objects of
          <span className="hero-gold-glow italic text-cosmos-goldBright"> intention</span>
        </h1>

        <p
          className="hero-fade-in mt-8 max-w-xl text-lg leading-relaxed text-cosmos-muted"
          style={{ animationDelay: "0.3s" }}
        >
          Hand-selected crystals, wood rings, and orgone art — chosen for
          craft, beauty, and the rituals they inspire.
        </p>

        <div
          className="hero-fade-in mt-12 flex flex-col items-center gap-4 small:flex-row"
          style={{ animationDelay: "0.45s" }}
        >
          <LocalizedClientLink href="/store" className="btn-gold btn-gold-glow">
            Shop the collection
          </LocalizedClientLink>
          <LocalizedClientLink href="/store" className="btn-ghost">
            Bestsellers
          </LocalizedClientLink>
        </div>

        <div
          className="hero-fade-in gold-hairline mt-20 w-48"
          aria-hidden="true"
          style={{ animationDelay: "0.6s" }}
        />

        <p
          className="hero-fade-in mt-8 max-w-md text-xs leading-relaxed tracking-wide text-cosmos-faint"
          style={{ animationDelay: "0.75s" }}
        >
          Every piece is photographed by hand and shipped from our Las Vegas
          studio. No two stones are alike.
        </p>
      </div>

      <style jsx>{`
        .hero-grain {
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
          animation: grain-shift 8s steps(10) infinite;
        }
        @keyframes grain-shift {
          0%, 100% { transform: translate(0, 0); }
          10% { transform: translate(-2%, -3%); }
          30% { transform: translate(3%, -2%); }
          50% { transform: translate(-3%, 2%); }
          70% { transform: translate(2%, 3%); }
          90% { transform: translate(-1%, 1%); }
        }
        .hero-particle {
          position: absolute;
          border-radius: 9999px;
          background: radial-gradient(circle, rgba(230, 190, 100, 0.9) 0%, rgba(230, 190, 100, 0) 70%);
          animation: float-dust linear infinite;
          opacity: 0;
        }
        @keyframes float-dust {
          0% { transform: translateY(20px) scale(0.5); opacity: 0; }
          20% { opacity: 0.8; }
          80% { opacity: 0.4; }
          100% { transform: translateY(-80px) scale(1); opacity: 0; }
        }
        .hero-fade-in {
          opacity: 0;
          animation: hero-rise 1.2s cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }
        @keyframes hero-rise {
          from { opacity: 0; transform: translateY(28px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .hero-gold-glow {
          text-shadow: 0 0 40px rgba(200, 150, 60, 0.45), 0 0 80px rgba(200, 150, 60, 0.2);
        }
        .btn-gold-glow {
          box-shadow: 0 0 24px rgba(190, 140, 50, 0.35), 0 4px 16px rgba(0, 0, 0, 0.4);
          transition: box-shadow 0.3s ease, transform 0.3s ease;
        }
        .btn-gold-glow:hover {
          box-shadow: 0 0 40px rgba(210, 160, 60, 0.55), 0 6px 24px rgba(0, 0, 0, 0.5);
          transform: translateY(-2px);
        }
      `}</style>
    </div>
  )
}

export default Hero
