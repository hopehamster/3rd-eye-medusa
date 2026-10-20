import Image from "next/image"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

/**
 * Homepage hero — Bright Apothecary (issue #21).
 *
 * Daylight photo of a real stone, plain headline, one specific claim.
 * No eyebrow caption, no centered cosmic type, no glow effects.
 *
 * Photo: the Gray Moonstone bracelet shot already live on its PDP.
 * Agent Daylight (issue #22) owns a dedicated hero photograph pass;
 * swap the image here when that lands.
 */
const Hero = () => {
  return (
    <section className="bg-paper-bg paper-grain text-paper-text">
      <div className="content-container relative z-[2] grid grid-cols-1 items-center gap-10 py-16 small:grid-cols-2 small:gap-14 small:py-24">
        <div>
          <h1 className="font-display text-5xl font-light leading-[1.05] tracking-tight text-paper-text small:text-6xl">
            Real stones. Plain talk. Nothing promised but the stone itself.
          </h1>
          <p className="mt-6 max-w-md font-humanist text-lg leading-8 text-paper-muted">
            Bracelets, sets, and small ritual objects in natural stone.
            Every piece is described the way it actually is — color, cut,
            weight, and what people have traditionally reached for it
            for.
          </p>
          <div className="mt-9 flex flex-col gap-3 xsmall:flex-row xsmall:items-center">
            <LocalizedClientLink
              href="/store"
              className="inline-flex items-center justify-center bg-paper-accent px-7 py-3.5 font-humanist text-sm font-semibold tracking-wide text-paper-raised transition-colors duration-200 hover:bg-paper-accentBright"
            >
              Browse the shelves
            </LocalizedClientLink>
            <LocalizedClientLink
              href="/oracle"
              className="inline-flex items-center justify-center border border-paper-border px-7 py-3.5 font-humanist text-sm font-semibold tracking-wide text-paper-text transition-colors duration-200 hover:border-paper-accent hover:text-paper-accent"
            >
              Not sure where to begin?
            </LocalizedClientLink>
          </div>
        </div>

        <div className="specimen-card overflow-hidden">
          <div className="relative aspect-[4/3] w-full">
            <Image
              src="https://i.imgur.com/oc2kv2D.jpeg"
              alt="Gray Moonstone bracelet photographed in daylight"
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover"
            />
          </div>
          <div className="specimen-label mx-5 my-4 flex items-baseline justify-between gap-4">
            <span>Gray Moonstone</span>
            <span className="font-humanist text-sm text-paper-muted">
              bracelet, natural stone
            </span>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Hero
