import Image from "next/image"
import { HttpTypes } from "@medusajs/types"

import { listAllProducts } from "@lib/data/products"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import {
  filterShelfProducts,
  getShelfCardMedia,
  SHELVES,
} from "@modules/store/data/shelves"

/**
 * Intention shelf index: the editorial front door above the full catalog
 * on /store (issue #23), on Agent Palette's apothecary system (#20).
 *
 * Pictures come from the same helper as the homepage cards and the shelf
 * pages (#150): each card shows that shelf's own first product. A shelf with
 * no product renders no image rather than stock scenery.
 *
 * Counts (issue #158): each card shows how many pieces are on that shelf,
 * counted from the same shelf membership as the shelf page itself, so the
 * number on the card and the number on the shelf page always agree.
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
        <div className="bg-paper-surface border border-paper-border rounded-specimen px-6 py-5 mb-8">
          <h2 className="font-display text-4xl font-light tracking-tight small:text-5xl">
            What are you shopping for?
          </h2>
          <p className="mt-3 max-w-xl font-humanist text-[16px] leading-relaxed text-paper-muted">
            Every piece in the shop lives on a shelf. Start with the one that
            sounds like your week, or skip straight to the full catalog below.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-5 small:grid-cols-3">
          {SHELVES.map((shelf) => {
            const media = getShelfCardMedia(products, shelf)
            const count = filterShelfProducts(products, shelf).length

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
                      <p className="inline-block font-humanist text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.18em] text-paper-accent bg-paper-raised border border-paper-border px-2 py-0.5 rounded-soft mb-1">
                        {media.title}
                        {media.material ? ` — ${media.material}` : ""}
                      </p>
                    )}
                    <p className="font-display text-[24px] sm:text-[28px] font-normal text-paper-text leading-tight group-hover:text-paper-accent inline-block mr-3">
                      {shelf.label}
                    </p>
                    <p className="font-display italic text-[14px] text-paper-muted mt-1 block">
                      {shelf.headline}
                    </p>
                    <p
                      className="inline-block font-humanist text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.18em] text-paper-accent bg-paper-raised border border-paper-border px-2 py-0.5 rounded-soft mt-2"
                      data-testid="shelf-count"
                    >
                      {count} {count === 1 ? "piece" : "pieces"}
                    </p>
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
