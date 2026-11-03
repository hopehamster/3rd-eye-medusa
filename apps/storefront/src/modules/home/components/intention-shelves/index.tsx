import Image from "next/image"
import { HttpTypes } from "@medusajs/types"

import { listAllProducts } from "@lib/data/products"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Reveal from "@modules/common/components/reveal"
import { getShelfCardMedia, SHELVES } from "@modules/store/data/shelves"

/**
 * Intention shelves (issue #21) — curated shelves with editorial names,
 * replacing the bare product grid as the way in. Slugs match the
 * existing intention taxonomy in product metadata.
 *
 * LINK CONTRACT: cards link to the dedicated shelf pages built by
 * Agent Shelves (issue #23): /store/shelf/<intent>.
 *
 * ONE DATA SOURCE (#150): shelf copy comes from store/data/shelves.ts and the
 * picture is that shelf's own first product, named with its real name and
 * material. The homepage and the /store shelf pages read the same helper, so
 * they cannot disagree. A shelf with no product renders no image — never
 * stock scenery, and never an alt string naming a stone that is not there.
 */
export default async function IntentionShelves({
  region,
}: {
  region: HttpTypes.StoreRegion
}) {
  const {
    response: { products },
  } = await listAllProducts({ regionId: region.id })

  return (
    <section className="bg-paper-bg paper-grain text-paper-text">
      <div className="content-container relative z-[2] py-16 small:py-24">
        <div className="mb-10 max-w-2xl">
          <h2 className="font-display text-4xl font-light tracking-tight text-paper-text small:text-5xl">
            Start with the problem. We will point at the stone.
          </h2>
          <p className="mt-4 font-humanist text-base leading-7 text-paper-muted">
            The shelves are organized the way people actually ask for help —
            by what they are dealing with, not by mineral names.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 xsmall:grid-cols-2 small:grid-cols-3">
          {SHELVES.map((shelf, i) => {
            const media = getShelfCardMedia(products, shelf)

            return (
              <Reveal key={shelf.intent} delay={(i % 3) * 0.08}>
                <LocalizedClientLink
                  href={`/store/shelf/${shelf.intent}`}
                  className="group block"
                >
                  <article className="specimen-card overflow-hidden transition-colors duration-200 group-hover:border-paper-accent">
                    {media && (
                      <div className="relative aspect-[3/2] w-full overflow-hidden bg-paper-surface">
                        <Image
                          src={media.src}
                          alt={media.alt}
                          fill
                          loading="lazy"
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                          className="object-contain"
                        />
                      </div>
                    )}
                    <div className="px-5 pb-5 pt-4">
                      {media && (
                        <p className="specimen-meta mb-2">
                          {media.title}
                          {media.material ? ` — ${media.material}` : ""}
                        </p>
                      )}
                      <div className="specimen-label flex items-baseline justify-between gap-3">
                        <span>{shelf.cardName}</span>
                        <span className="font-humanist text-sm text-paper-faint">
                          {shelf.label}
                        </span>
                      </div>
                      <p className="specimen-meta mt-3">{shelf.cardTeaser}</p>
                      <p className="mt-3 font-humanist text-sm font-semibold text-paper-accent">
                        Shop the shelf
                      </p>
                    </div>
                  </article>
                </LocalizedClientLink>
              </Reveal>
            )
          })}
        </div>
      </div>
    </section>
  )
}
