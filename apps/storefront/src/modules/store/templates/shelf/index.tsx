import Image from "next/image"
import { HttpTypes } from "@medusajs/types"

import LocalizedClientLink from "@modules/common/components/localized-client-link"
import ShelfProductCard from "@modules/store/components/shelf-product-card"
import { SHELVES, ShelfDefinition } from "@modules/store/data/shelves"

/**
 * Intention shelf page template (issue #23) on Agent Palette's bright
 * apothecary system (issue #20): paper surfaces, grain texture, specimen
 * cards, one botanical-green accent.
 */
export default function ShelfTemplate({
  shelf,
  products,
}: {
  shelf: ShelfDefinition
  products: HttpTypes.StoreProduct[]
}) {
  const siblings = SHELVES.filter((s) => s.intent !== shelf.intent).slice(0, 3)

  return (
    <div className="paper-grain bg-paper-bg text-paper-text">
      {/* Editorial header */}
      <header className="content-container relative z-[2] pb-8 pt-10">
        <div className="grid gap-8 small:grid-cols-2 small:items-center">
          <div>
            <h1 className="font-display text-5xl font-light leading-[1.05] tracking-tight small:text-6xl">
              {shelf.headline}
            </h1>
            <p className="mt-5 max-w-md font-humanist text-[17px] leading-relaxed text-paper-muted">
              {shelf.intro}
            </p>
            <p className="specimen-meta mt-4">
              Featured stone:{" "}
              <span className="font-semibold text-paper-text">
                {shelf.stone}
              </span>
            </p>
          </div>
          <div className="relative aspect-[4/3] overflow-hidden border border-paper-border">
            <Image
              src={shelf.heroImage}
              alt={shelf.heroAlt}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 100vw, 50vw"
              priority
            />
          </div>
        </div>
      </header>

      {/* Products */}
      <section className="content-container relative z-[2] pb-14">
        <div className="flex items-baseline justify-between pb-4 pt-2">
          <h2 className="font-display text-3xl font-light">
            The {shelf.label.toLowerCase()} shelf
          </h2>
          <span className="font-humanist text-sm text-paper-muted">
            {products.length} {products.length === 1 ? "piece" : "pieces"}
          </span>
        </div>
        <div className="paper-hairline" />

        {products.length ? (
          <ul className="mt-8 grid w-full grid-cols-2 gap-x-6 gap-y-8 small:grid-cols-3 medium:grid-cols-4">
            {products.map((product) => (
              <li key={product.id}>
                <ShelfProductCard product={product} />
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-8 font-humanist text-paper-muted">
            This shelf is being restocked. The{" "}
            <LocalizedClientLink
              href="/store"
              className="underline decoration-paper-accent underline-offset-4"
            >
              full catalog
            </LocalizedClientLink>{" "}
            is still open.
          </p>
        )}
      </section>

      {/* How people use these */}
      <section className="border-t border-paper-borderSoft bg-paper-surface">
        <div className="content-container relative z-[2] py-12">
          <h2 className="font-display text-3xl font-light">
            {shelf.usageTitle}
          </h2>
          <ul className="mt-6 grid gap-4 small:grid-cols-3">
            {shelf.usage.map((item, i) => (
              <li
                key={i}
                className="specimen-card p-5 font-humanist text-[15px] leading-relaxed text-paper-muted"
              >
                {item}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Sibling shelves + catalog */}
      <section className="content-container relative z-[2] py-12">
        <h2 className="font-display text-3xl font-light">
          Keep looking around
        </h2>
        <div className="mt-6 grid gap-5 small:grid-cols-3">
          {siblings.map((s) => (
            <LocalizedClientLink
              key={s.intent}
              href={`/store/shelf/${s.intent}`}
              className="group block"
            >
              <div className="specimen-card p-6 transition-all duration-300 group-hover:-translate-y-1 group-hover:border-paper-accent/50">
                <p className="font-display text-2xl group-hover:text-paper-accent">
                  {s.label}
                </p>
                <p className="specimen-meta mt-2">{s.headline}</p>
              </div>
            </LocalizedClientLink>
          ))}
        </div>
        <div className="mt-8">
          <LocalizedClientLink href="/store" className="btn-paper">
            Browse the full catalog
          </LocalizedClientLink>
        </div>
      </section>
    </div>
  )
}
