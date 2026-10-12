"use client"

import type { SearchClient } from "instantsearch.js"
import { Configure, InstantSearch } from "react-instantsearch"
import { history } from "instantsearch.js/es/lib/routers"

import { PRODUCT_INDEX_NAME, searchClient } from "@lib/search-client"
import StoreHits from "@modules/store/components/store-hits"
import StoreRefinements from "@modules/store/components/store-refinements"
import { INTENTS_ATTRIBUTE } from "@modules/store/components/store-refinements/attributes"
import StoreSearchBox from "@modules/store/components/store-search-box"

const PRODUCT_LIMIT = 12

// Custom router that preserves the `intent` query param in the URL alongside
// InstantSearch's own state. Without this, `routing` wipes `?intent=` on sync.
const routing = {
  router: history(),
  stateMapping: {
    stateToRoute(uiState: any) {
      const indexState = uiState[PRODUCT_INDEX_NAME] || {}
      const route: Record<string, any> = {
        query: indexState.query,
        refinementList: indexState.refinementList,
      }
      // Preserve intent param if the intents refinement has exactly one value
      const intents = indexState.refinementList?.[INTENTS_ATTRIBUTE]
      if (intents?.length === 1) {
        route.intent = intents[0]
      }
      return { [PRODUCT_INDEX_NAME]: route }
    },
    routeToState(routeState: any) {
      const indexRoute = routeState[PRODUCT_INDEX_NAME] || {}
      // Fall back to the `intent` param for the intents refinement
      const refinementList = { ...(indexRoute.refinementList || {}) }
      if (indexRoute.intent && !refinementList[INTENTS_ATTRIBUTE]) {
        refinementList[INTENTS_ATTRIBUTE] = [indexRoute.intent]
      }
      return {
        [PRODUCT_INDEX_NAME]: {
          query: indexRoute.query,
          refinementList,
        },
      }
    },
  },
}

const StoreTemplate = ({ currencyCode }: { currencyCode: string }) => {
  return (
    <div className="py-6 content-container" data-testid="category-container">
      <div className="mb-8 text-2xl-semi">
        <h1 data-testid="store-page-title">All products</h1>
      </div>

      <div className="flex flex-col small:flex-row small:items-start">
        <InstantSearch
          indexName={PRODUCT_INDEX_NAME}
          searchClient={searchClient as unknown as SearchClient}
          routing={routing as any}
          future={{ preserveSharedStateOnUnmount: true }}
        >
          <Configure hitsPerPage={PRODUCT_LIMIT} />
          <StoreRefinements currencyCode={currencyCode} />
          <div className="w-full min-w-0">
            <StoreSearchBox />
            <StoreHits
              hitsPerPage={PRODUCT_LIMIT}
              currencyCode={currencyCode}
            />
          </div>
        </InstantSearch>
      </div>
    </div>
  )
}

export default StoreTemplate
