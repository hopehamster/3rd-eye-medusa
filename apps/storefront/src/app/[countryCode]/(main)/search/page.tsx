import { Metadata } from "next"
import { notFound } from "next/navigation"

import { listProducts } from "@lib/data/products"
import { getRegion } from "@lib/data/regions"
import ProductPreview from "@modules/products/components/product-preview"
import SearchForm from "@modules/search/components/search-form"

const RESULT_LIMIT = 24

type Props = {
  params: Promise<{ countryCode: string }>
  searchParams: Promise<{ q?: string | string[] }>
}

const getQuery = (q?: string | string[]) =>
  (Array.isArray(q) ? q[0] : q)?.trim().slice(0, 200) ?? ""

export async function generateMetadata(props: Props): Promise<Metadata> {
  const query = getQuery((await props.searchParams).q)
  return {
    title: query ? `Search results for "${query}"` : "Search",
    robots: { index: false, follow: true },
  }
}

export default async function SearchPage(props: Props) {
  const { countryCode } = await props.params
  const query = getQuery((await props.searchParams).q)

  const region = await getRegion(countryCode)
  if (!region) {
    notFound()
  }

  const { response } = query
    ? await listProducts({
        countryCode,
        queryParams: { q: query, limit: RESULT_LIMIT },
      })
    : { response: { products: [], count: 0 } }

  // Issue #193: the backend matches the query across title and
  // description, and descriptions reuse a template that mentions other
  // products ("this bracelet" in the Healing Bear Tray's description),
  // so a search can return products that are not what was asked for.
  // Keep only products whose title contains the query, case-insensitive.
  // This runs after fetching, so it covers the live path and the offline
  // fallback path (filterFallbackProducts also matches on description).
  const filteredProducts = query
    ? response.products.filter((product) =>
        product.title.toLowerCase().includes(query.toLowerCase())
      )
    : response.products

  // The backend total counts every match, including description-only
  // matches the filter drops, so it no longer describes what is shown.
  // When the backend had more than we fetched, the true total of
  // title-matching products is unknown — more may sit behind the fetch
  // limit — so the count states only how many are shown, with no total,
  // and is hidden when nothing is shown (the empty state carries it).
  // When we fetched everything the backend had, the filtered length is
  // the exact total.
  const hasMoreBehindLimit = response.count > response.products.length

  return (
    <div className="content-container py-6" data-testid="search-container">
      <h1 className="text-2xl-semi mb-6">
        {query ? `Search results for "${query}"` : "Search"}
      </h1>
      <SearchForm countryCode={countryCode} defaultValue={query} className="mb-8 max-w-xl" />
      {query && hasMoreBehindLimit && filteredProducts.length > 0 ? (
        <p className="text-small-regular text-ui-fg-subtle mb-6">
          Showing {filteredProducts.length}{" "}
          {filteredProducts.length === 1 ? "product" : "products"}
        </p>
      ) : query ? (
        <p className="text-small-regular text-ui-fg-subtle mb-6">
          {filteredProducts.length}{" "}
          {filteredProducts.length === 1 ? "product" : "products"} found
        </p>
      ) : null}
      {query && filteredProducts.length === 0 ? (
        <p className="text-ui-fg-subtle">
          {hasMoreBehindLimit
            ? "No matching products in the results shown. Try a different keyword."
            : "No products match your search. Try a different keyword."}
        </p>
      ) : (
        <ul
          className="grid grid-cols-2 w-full small:grid-cols-3 medium:grid-cols-4 gap-x-6 gap-y-8"
          data-testid="search-results"
        >
          {filteredProducts.map((product) => (
            <li key={product.id}>
              <ProductPreview product={product} region={region} />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
