import { PRODUCT_INDEX_NAME, priceAttribute } from "@lib/search-client"

export const OPTION_VALUES_ATTRIBUTE = "option_values"
export const CATEGORY_ATTRIBUTE = "category"
// The index calls the product's tags "labels".
export const LABELS_ATTRIBUTE = "labels"
// Metaphysical intent tags from product metadata (Oracle taxonomy).
export const INTENTS_ATTRIBUTE = "intents"

/**
 * Display names for facet names and facet values at render time. The search
 * index holds some raw supplier strings verbatim (ingested CJ Dropshipping
 * titles); those must never surface in the sidebar as-is. This map is a
 * presentation cleanup only — the indexed data itself is unchanged, and
 * unknown names pass through untouched.
 */
export const FACET_DISPLAY_NAMES: Record<string, string> = {
  "12 Zodiac Animal Small Round Pendant Cattle": "Zodiac Pendants",
}

export const facetDisplayName = (name: string): string =>
  FACET_DISPLAY_NAMES[name] ?? name

export const getSortOptions = (currencyCode: string) => {
  const minPrice = priceAttribute("min_price", currencyCode)

  return [
    { value: PRODUCT_INDEX_NAME, label: "Relevance" },
    {
      value: `${PRODUCT_INDEX_NAME}/sort/created_at:desc`,
      label: "Latest Arrivals",
    },
    {
      value: `${PRODUCT_INDEX_NAME}/sort/${minPrice}:asc`,
      label: "Price: Low -> High",
    },
    {
      value: `${PRODUCT_INDEX_NAME}/sort/${minPrice}:desc`,
      label: "Price: High -> Low",
    },
    { value: `${PRODUCT_INDEX_NAME}/sort/title:asc`, label: "Title: A -> Z" },
    { value: `${PRODUCT_INDEX_NAME}/sort/title:desc`, label: "Title: Z -> A" },
  ]
}
