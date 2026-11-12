import Form from "next/form"
import Image from "next/image"
import { HttpTypes } from "@medusajs/types"

import LocalizedClientLink from "@modules/common/components/localized-client-link"
import ShelfProductCard from "@modules/store/components/shelf-product-card"
import {
  filterShelfProductsByForm,
  filterShelfProductsByMaxPrice,
  getShelfCardMedia,
  getShelfForms,
  getShelfPriceCutoffs,
  SHELVES,
  SHELF_SORTS,
  ShelfDefinition,
  ShelfSort,
  shouldShowShelfPriceFilter,
  sortShelfProducts,
} from "@modules/store/data/shelves"

/**
 * Intention shelf page template (issue #23) on Agent Palette's bright
 * apothecary system (issue #20): paper surfaces, grain texture, specimen
 * cards, one botanical-green accent.
 *
 * Shoppable shelves (issue #158): sub-category pills, sort and a price
 * filter, all server-side through URL search params (?form=, ?sort=,
 * ?maxPrice=) so links and the back button work with no client script.
 * Every control is drawn from the shelf's own products and hidden when it
 * has nothing to do — see shelves.ts. Headline, intro and usage copy are
 * unchanged editorial copy.
 */
export default function ShelfTemplate({
  shelf,
  products,
  sort = "curated",
  form,
  maxPrice = null,
}: {
  shelf: ShelfDefinition
  products: HttpTypes.StoreProduct[]
  sort?: ShelfSort
  form?: string
  maxPrice?: number | null
}) {
  const siblings = SHELVES.filter((s) => s.intent !== shelf.intent).slice(0, 3)
  // Same helper as the homepage cards: the shelf's own first product (#150).
  // No product means no header image at all.
  const media = getShelfCardMedia(products, shelf)

  const forms = getShelfForms(products)
  const showPills = forms.length >= 2
  const priceCutoffs = getShelfPriceCutoffs(products)
  const showPriceFilter = shouldShowShelfPriceFilter(products)
  const isFiltering = Boolean(form) || maxPrice !== null

  const visible = sortShelfProducts(
    filterShelfProductsByMaxPrice(
      filterShelfProductsByForm(products, form),
      maxPrice
    ),
    sort
  )

  // Pills keep the other params, so picking a form never drops the sort.
  const shelfHref = (overrides: {
    form?: string | null
    sort?: ShelfSort | null
    maxPrice?: number | null
  }) => {
    const params = new URLSearchParams()
    const nextForm = overrides.form !== undefined ? overrides.form : form
    const nextSort = overrides.sort !== undefined ? overrides.sort : sort
    const nextMaxPrice =
      overrides.maxPrice !== undefined ? overrides.maxPrice : maxPrice
    if (nextForm) params.set("form", nextForm)
    if (nextSort && nextSort !== "curated") params.set("sort", nextSort)
    if (nextMaxPrice !== null) params.set("maxPrice", String(nextMaxPrice))
    const query = params.toString()
    return query
      ? `/store/shelf/${shelf.intent}?${query}`
      : `/store/shelf/${shelf.intent}`
  }

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
          {media && (
            <div className="relative aspect-[4/3] overflow-hidden border border-paper-border bg-paper-surface">
              <Image
                src={media.src}
                alt={media.alt}
                fill
                className="object-contain"
                sizes="(max-width: 640px) 100vw, 50vw"
                priority
              />
            </div>
          )}
        </div>
      </header>

      {/* Products */}
      <section className="content-container relative z-[2] pb-14">
        <div className="flex items-baseline justify-between pb-4 pt-2">
          <h2 className="font-display text-3xl font-light">
            The {shelf.label.toLowerCase()} shelf
          </h2>
          <span
            className="font-humanist text-sm text-paper-muted"
            data-testid="shelf-count"
          >
            {isFiltering
              ? `${visible.length} of ${products.length} ${
                  products.length === 1 ? "piece" : "pieces"
                }`
              : `${products.length} ${
                  products.length === 1 ? "piece" : "pieces"
                }`}
          </span>
        </div>
        <div className="paper-hairline" />

        {/* Sub-category pills: one per form actually on this shelf, with
            counts. Hidden when the shelf's pieces share a single form —
            a pill row with one pill is not navigation. */}
        {showPills && (
          <nav aria-label="Shop by form" className="mt-6">
            <ul className="flex flex-wrap gap-2">
              <li>
                <LocalizedClientLink
                  href={shelfHref({ form: null })}
                  className={`inline-block border px-4 py-2 font-humanist text-sm transition-colors ${
                    !form
                      ? "border-paper-accent bg-paper-accent/10 font-semibold text-paper-text"
                      : "border-paper-border bg-paper-surface text-paper-muted hover:border-paper-accent/50 hover:text-paper-text"
                  }`}
                  aria-current={!form ? "true" : undefined}
                  data-testid="shelf-pill"
                  data-form="all"
                >
                  All pieces ({products.length})
                </LocalizedClientLink>
              </li>
              {forms.map((f) => (
                <li key={f.value}>
                  <LocalizedClientLink
                    href={shelfHref({ form: f.value })}
                    className={`inline-block border px-4 py-2 font-humanist text-sm transition-colors ${
                      form === f.value
                        ? "border-paper-accent bg-paper-accent/10 font-semibold text-paper-text"
                        : "border-paper-border bg-paper-surface text-paper-muted hover:border-paper-accent/50 hover:text-paper-text"
                    }`}
                    aria-current={form === f.value ? "true" : undefined}
                    data-testid="shelf-pill"
                    data-form={f.value}
                  >
                    {f.label} ({f.count})
                  </LocalizedClientLink>
                </li>
              ))}
            </ul>
          </nav>
        )}

        {/* Sort and price filter: next/form, so Apply navigates on the
            client instead of reloading the page. A full reload would
            remount the whole shelf and the cards could never glide —
            with a soft navigation the cards keep their identity (see the
            stable key on the grid below) and Framer Motion moves them
            to their new spots (issue #201). Same GET form, same
            shareable URL, same no-script fallback as a plain form.
            The form is keyed by the URL-derived state below: the
            selects use defaultValue, which React only applies on
            mount, so without the key a soft navigation (Clear
            filters, a sibling shelf, back/forward) would leave them
            showing stale values while the grid has reset. The form
            is a sibling of the grid, so remounting it does not
            remount the cards or break the glide. */}
        <Form
          action={`/store/shelf/${shelf.intent}`}
          key={`${form ?? ""}|${sort}|${maxPrice ?? ""}`}
          className="mt-6 flex flex-wrap items-end gap-4"
          data-testid="shelf-controls"
        >
          {form && <input type="hidden" name="form" value={form} />}
          {maxPrice !== null && !showPriceFilter && (
            <input type="hidden" name="maxPrice" value={String(maxPrice)} />
          )}
          <label className="font-humanist text-sm text-paper-muted">
            Sort
            <select
              name="sort"
              defaultValue={sort}
              data-testid="shelf-sort"
              className="ml-2 border border-paper-border bg-paper-surface px-3 py-2 font-humanist text-sm text-paper-text"
            >
              {SHELF_SORTS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          {showPriceFilter && (
            <label className="font-humanist text-sm text-paper-muted">
              Price
              <select
                name="maxPrice"
                defaultValue={maxPrice === null ? "" : String(maxPrice)}
                data-testid="shelf-price-filter"
                className="ml-2 border border-paper-border bg-paper-surface px-3 py-2 font-humanist text-sm text-paper-text"
              >
                <option value="">Any price</option>
                {priceCutoffs.map((cutoff) => (
                  <option key={cutoff.value} value={cutoff.value}>
                    {cutoff.label} ({cutoff.count})
                  </option>
                ))}
              </select>
            </label>
          )}
          <button type="submit" className="btn-paper">
            Apply
          </button>
          {isFiltering && (
            <LocalizedClientLink
              href={`/store/shelf/${shelf.intent}`}
              className="font-humanist text-sm text-paper-muted underline decoration-paper-accent underline-offset-4"
              data-testid="shelf-clear-filters"
            >
              Clear filters
            </LocalizedClientLink>
          )}
        </Form>

        {visible.length ? (
          <ul className="mt-8 grid w-full grid-cols-2 gap-x-6 gap-y-8 small:grid-cols-3 medium:grid-cols-4">
            {/* Keyed by product id, never by position: the key is what
                keeps each card's identity across a filter/sort change,
                so the cards glide to their new spots instead of
                remounting in place (issue #201). Do not change this
                key to an index. */}
            {visible.map((product) => (
              <li key={product.id}>
                <ShelfProductCard product={product} />
              </li>
            ))}
          </ul>
        ) : products.length ? (
          <p
            className="mt-8 font-humanist text-paper-muted"
            data-testid="shelf-no-results"
          >
            No pieces match these filters.{" "}
            <LocalizedClientLink
              href={`/store/shelf/${shelf.intent}`}
              className="underline decoration-paper-accent underline-offset-4"
            >
              Show the whole shelf
            </LocalizedClientLink>
            .
          </p>
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
