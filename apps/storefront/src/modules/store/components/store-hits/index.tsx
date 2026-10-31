"use client"

import type { Hit } from "instantsearch.js"
import { useEffect, useRef } from "react"
import { useHits, useInstantSearch } from "react-instantsearch"

import useSearchSettled from "@lib/hooks/use-search-settled"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { Text } from "@modules/common/components/ui"
import Thumbnail from "@modules/products/components/thumbnail"
import SkeletonProductGrid from "@modules/skeletons/templates/skeleton-product-grid"
import SearchPagination from "./pagination"
import HitPrice, { HitPricing } from "./price"

type ProductHit = Hit<
  {
    title: string | null
    handle: string | null
    thumbnail: string | null
  } & HitPricing
>

type StoreHitsProps = {
  hitsPerPage: number
  currencyCode: string
}

const StoreHits = ({ hitsPerPage, currencyCode }: StoreHitsProps) => {
  const { items } = useHits<ProductHit>()
  const { status, error, indexUiState } = useInstantSearch()
  const { isSearching, hasNoResultsYet } = useSearchSettled()

  const { page, ...refinements } = indexUiState
  const currentPage = page ?? 1
  const refinementKey = JSON.stringify(refinements)

  const settled = useRef({ page: currentPage, refinementKey })

  useEffect(() => {
    if (!isSearching) {
      settled.current = { page: currentPage, refinementKey }
    }
  }, [isSearching, currentPage, refinementKey])

  const isPagingOnly =
    refinementKey === settled.current.refinementKey &&
    currentPage !== settled.current.page

  const showSkeleton = hasNoResultsYet || (isSearching && isPagingOnly)

  if (status === "error") {
    return (
      <Text
        className="py-16 text-center text-ui-fg-error"
        data-testid="products-error"
      >
        Couldn&apos;t load products
        {error?.message ? `: ${error.message}` : "."}
      </Text>
    )
  }

  return (
    <>
      {showSkeleton ? (
        <SkeletonProductGrid numberOfProducts={hitsPerPage} />
      ) : !items.length ? (
        <div
          className="py-16 text-center text-ui-fg-subtle"
          data-testid="no-products"
        >
          {/* Two very different situations used to look identical here: a
              filter that matched nothing, and a search index that was never
              built (no VOYAGE_API_KEY => /store renders empty while the
              homepage still shows products). The second one is a setup
              failure, so say so rather than implying the catalogue is empty. */}
          {refinementKey.trim() ? (
            <Text>No products matched these filters.</Text>
          ) : (
            <>
              <Text>The collection couldn&apos;t be loaded.</Text>
              <Text className="mt-2 text-sm">
                The product search index is empty or unreachable. Try again in a
                moment — or{" "}
                <LocalizedClientLink href="/" className="underline">
                  browse from the homepage
                </LocalizedClientLink>
                .
              </Text>
            </>
          )}
        </div>
      ) : (
        <ul
          className="grid grid-cols-2 w-full small:grid-cols-3 medium:grid-cols-4 gap-x-6 gap-y-8"
          data-testid="products-list"
        >
          {items.map((hit) =>
            hit.handle ? (
              <li key={hit.objectID}>
                <LocalizedClientLink
                  href={`/products/${hit.handle}`}
                  className="group"
                >
                  <div data-testid="product-wrapper">
                    <Thumbnail thumbnail={hit.thumbnail} size="full" />
                    <div className="flex txt-compact-medium mt-4 justify-between">
                      <Text
                        className="text-ui-fg-subtle"
                        data-testid="product-title"
                      >
                        {hit.title}
                      </Text>
                      <HitPrice hit={hit} currencyCode={currencyCode} />
                    </div>
                  </div>
                </LocalizedClientLink>
              </li>
            ) : null
          )}
        </ul>
      )}
      <SearchPagination />
    </>
  )
}

export default StoreHits
