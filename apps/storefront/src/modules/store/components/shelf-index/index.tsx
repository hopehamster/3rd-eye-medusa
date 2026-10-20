import Image from "next/image"

import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { SHELVES } from "@modules/store/data/shelves"

/**
 * Intention shelf index: the editorial front door above the full catalog
 * on /store (issue #23), on Agent Palette's apothecary system (#20).
 */
export default function ShelfIndex() {
  return (
    <section className="paper-grain bg-paper-bg text-paper-text">
      <div className="content-container relative z-[2] pb-10 pt-12">
        <h2 className="font-display text-4xl font-light tracking-tight small:text-5xl">
          What are you shopping for?
        </h2>
        <p className="mt-3 max-w-xl font-humanist text-[16px] leading-relaxed text-paper-muted">
          Every piece in the shop lives on a shelf. Start with the one that
          sounds like your week, or skip straight to the full catalog below.
        </p>

        <div className="mt-9 grid grid-cols-2 gap-5 small:grid-cols-3">
          {SHELVES.map((shelf) => (
            <LocalizedClientLink
              key={shelf.intent}
              href={`/store/shelf/${shelf.intent}`}
              className="group block"
            >
              <div className="specimen-card overflow-hidden transition-all duration-300 group-hover:-translate-y-1 group-hover:border-paper-accent/50">
                <div className="relative aspect-[4/3] overflow-hidden">
                  <Image
                    src={shelf.heroImage}
                    alt={shelf.heroAlt}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    sizes="(max-width: 640px) 50vw, 33vw"
                    loading="lazy"
                  />
                </div>
                <div className="p-4">
                  <p className="font-display text-[22px] leading-tight group-hover:text-paper-accent">
                    {shelf.label}
                  </p>
                  <p className="specimen-meta mt-1">{shelf.headline}</p>
                </div>
              </div>
            </LocalizedClientLink>
          ))}
        </div>
      </div>
    </section>
  )
}
