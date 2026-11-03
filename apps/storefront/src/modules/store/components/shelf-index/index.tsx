import Image from "next/image"
import { HttpTypes } from "@medusajs/types"

import { listAllProducts } from "@lib/data/products"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { getShelfCardMedia, SHELVES } from "@modules/store/data/shelves"

/**
 * Intention shelf index: the editorial front door above the full catalog
 * on /store (issue #23), on Agent Palette's apothecary system (#20).
 *
 * Pictures come from the same helper as the homepage cards and the shelf
 * pages (#150): each card shows that shelf's own first product. A shelf with
 * no product renders no image rather than stock scenery.
 */
export default async function ShelfIndex({
  region,
}: {
  region: HttpTypes.StoreRegion
}) {
  const {
    response: { products },
  } = await listAllProducts({ regionId: region.id })

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
          {SHELVES.map((shelf) => {
            const media = getShelfCardMedia(products, shelf)

            return (
              <LocalizedClientLink
                key={shelf.intent}
                href={`/store/shelf/${shelf.intent}`}
                className="group block"
              >
                <div className="specimen-card overflow-hidden transition-all duration-300 group-hover:-translate-y-1 group-hover:border-paper-accent/50">
                  {media && (
                    <div className="relative aspect-[4/3] overflow-hidden bg-paper-surface">
                      <Image
                        src={media.src}
                        alt={media.alt}
                        fill
                        className="object-contain transition-transform duration-500 group-hover:scale-105"
                        sizes="(max-width: 640px) 50vw, 33vw"
                        loading="lazy"
                      />
                    </div>
                  )}
                  <div className="p-4">
                    {media && (
                      <p className="specimen-meta mb-1">
                        {media.title}
                        {media.material ? ` — ${media.material}` : ""}
                      </p>
                    )}
                    <p className="font-display text-[22px] leading-tight group-hover:text-paper-accent">
                      {shelf.label}
                    </p>
                    <p className="specimen-meta mt-1">{shelf.headline}</p>
                  </div>
                </div>
              </LocalizedClientLink>
            )
          })}
        </div>
      </div>
    </section>
  )
}
