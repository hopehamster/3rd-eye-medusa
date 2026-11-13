"use client"

import type { Hit } from "instantsearch.js"
import { motion, useReducedMotion } from "framer-motion"
import { useHits, useInstantSearch } from "react-instantsearch"

import useSearchSettled from "@lib/hooks/use-search-settled"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { Text } from "@modules/common/components/ui"
import Thumbnail from "@modules/products/components/thumbnail"
import SkeletonProductGrid from "@modules/skeletons/templates/skeleton-product-grid"
import SearchPagination from "./pagination"
import HitPrice, { HitPricing } from "./price"
import StoreHitQuickAdd from "./quick-add"

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
  const prefersReducedMotion = useReducedMotion()

  const { page, ...refinements } = indexUiState
  const refinementKey = JSON.stringify(refinements)

  // While a search or filter is in flight, show the shimmering placeholder
  // tiles (issue #212) instead of the previous result set — stale products
  // for a moment, then a snap. The first load is covered by
  // hasNoResultsYet; every later search, filter change, or page turn is
  // covered by isSearching. When the results land, the tiles below animate
  // in on their result signature.
  const showSkeleton = hasNoResultsYet || isSearching

  // Result-set signature: changes only when the visible hits change — first
  // load, a filter change, or a page change. The animated wrapper below is
  // keyed on it, so a new set of tiles remounts and replays the entrance
  // instead of snapping in. The Quick Add adapter stays outside that
  // wrapper, so its mount — and the product it already fetched — survives
  // a filter change.
  const resultSignature = items.map((hit) => hit.objectID).join(",")

  if (status === "error") {
    return (
      <Text
        className="py-16 text-center text-base text-ui-fg-error"
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
        <motion.div
          className="py-16 text-center text-ui-fg-subtle"
          data-testid="no-products"
          initial={prefersReducedMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        >
          {/* The no-matching-products message fades in gently (issue
              #252) instead of snapping in. Quiet and short: one 0.4s
              fade, easeOut, inside the house limit. With reduced motion
              preferred, no entrance at all: initial={false} renders it
              immediately (the #240 pattern) — a true no-op, not an
              instant fade. */}
          {/* Two very different situations used to look identical here: a
              filter that matched nothing, and a search index that was never
              built (no VOYAGE_API_KEY => /store renders empty while the
              homepage still shows products). The second one is a setup
              failure, so say so rather than implying the catalogue is empty. */}
          {refinementKey.trim() ? (
            <Text className="text-base">No products matched these filters.</Text>
          ) : (
            <>
              <Text className="text-base">
                The collection couldn&apos;t be loaded.
              </Text>
              <Text className="mt-2 text-base">
                The product search index is empty or unreachable. Try again in a
                moment — or{" "}
                <LocalizedClientLink href="/" className="underline">
                  browse from the homepage
                </LocalizedClientLink>
                .
              </Text>
            </>
          )}
        </motion.div>
      ) : (
        <ul
          className="grid grid-cols-2 w-full small:grid-cols-3 medium:grid-cols-4 gap-x-6 gap-y-8"
          data-testid="products-list"
        >
          {items.map((hit, index) =>
            hit.handle ? (
              <li key={hit.objectID}>
                <LocalizedClientLink
                  href={`/products/${hit.handle}`}
                  className="group"
                >
                  <div data-testid="product-wrapper">
                    {/* Tiles fade in and rise a few pixels, staggered down
                        the grid (issue #203). Same quiet pattern as Reveal:
                        opacity + a small rise, easeOut, under half a
                        second each; the stagger delay is capped so a full
                        page never feels like waiting. With reduced motion
                        preferred, no entrance at all: the tiles render
                        immediately, no fade, no rise, no stagger delay. */}
                    <motion.div
                      key={resultSignature}
                      initial={
                        prefersReducedMotion ? false : { opacity: 0, y: 8 }
                      }
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        duration: 0.35,
                        ease: "easeOut",
                        delay: prefersReducedMotion
                          ? 0
                          : Math.min(index * 0.03, 0.3),
                      }}
                    >
                      <Thumbnail thumbnail={hit.thumbnail} size="full" />
                      <div className="flex txt-compact-medium mt-4 justify-between">
                        <Text
                          className="text-base text-ui-fg-subtle"
                          data-testid="product-title"
                        >
                          {hit.title}
                        </Text>
                        <HitPrice hit={hit} currencyCode={currencyCode} />
                      </div>
                    </motion.div>
                    {/* Quick add (issue #187): the hit carries no variants,
                        so StoreHitQuickAdd fetches the product and renders
                        the shared QuickAdd. Inside the link, as in
                        ProductPreview — the button stops the click from
                        navigating. */}
                    <StoreHitQuickAdd handle={hit.handle} />
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