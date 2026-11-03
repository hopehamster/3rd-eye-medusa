"use server"

import { sdk } from "@lib/config"
import { OptionValueIds } from "@lib/util/product-option-filters"
import { sortProducts } from "@lib/util/sort-products"
import { HttpTypes } from "@medusajs/types"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"
import { getAuthHeaders, getCacheOptions } from "./cookies"
import { fallbackProducts, isOfflineMode } from "./offline"
import { getRegion, retrieveRegion } from "./regions"

type ProductListQueryParams = (HttpTypes.FindParams &
  HttpTypes.StoreProductListParams) & {
  options?: string[]
  option_value_id?: string | string[]
}

/**
 * How long the product list cache may serve a stale catalogue. The list used to
 * be pinned with `cache: "force-cache"`, so new or edited products never showed
 * up until the process restarted (#147).
 */
const PRODUCTS_REVALIDATE_SECONDS = 60

/** Medusa caps a single page at 100 items; page through it when a caller needs all. */
const PRODUCTS_PAGE_SIZE = 100

/** Safety valve so a bad `count` can never spin us into an endless fetch loop. */
const PRODUCTS_MAX_PAGES = 50

export const listProducts = async ({
  pageParam = 1,
  queryParams,
  countryCode,
  regionId,
}: {
  pageParam?: number
  queryParams?: ProductListQueryParams
  countryCode?: string
  regionId?: string
}): Promise<{
  response: { products: HttpTypes.StoreProduct[]; count: number }
  nextPage: number | null
  queryParams?: ProductListQueryParams
}> => {
  if (!countryCode && !regionId) {
    throw new Error("Country code or region ID is required")
  }

  const limit = queryParams?.limit || 12
  const _pageParam = Math.max(pageParam, 1)
  const offset = _pageParam === 1 ? 0 : (_pageParam - 1) * limit

  let region: HttpTypes.StoreRegion | undefined | null

  if (countryCode) {
    region = await getRegion(countryCode)
  } else {
    region = await retrieveRegion(regionId!)
  }

  if (!region) {
    return {
      response: { products: [], count: 0 },
      nextPage: null,
    }
  }

  const headers = {
    ...(await getAuthHeaders()),
  }

  const next = {
    ...(await getCacheOptions("products")),
    revalidate: PRODUCTS_REVALIDATE_SECONDS,
  }

  if (isOfflineMode()) {
    const filtered = queryParams?.handle
      ? fallbackProducts.filter((p) => p.handle === queryParams.handle)
      : fallbackProducts

    return {
      response: { products: filtered, count: filtered.length },
      nextPage: null,
      queryParams,
    }
  }

  try {
    return await sdk.client
      .fetch<{ products: HttpTypes.StoreProduct[]; count: number }>(
        `/store/products`,
        {
          method: "GET",
          query: {
            limit,
            offset,
            region_id: region?.id,
            fields:
              "handle,*variants.calculated_price,+variants.inventory_quantity,*variants.images,*variants.options,+metadata,+tags,+material,",
            ...queryParams,
          },
          headers,
          next,
        }
      )
      .then(({ products, count }) => {
        const nextPage = count > offset + limit ? pageParam + 1 : null

        return {
          response: {
            products,
            count,
          },
          nextPage: nextPage,
          queryParams,
        }
      })
  } catch (error) {
    if (isOfflineMode()) {
      const filtered = queryParams?.handle
        ? fallbackProducts.filter((p) => p.handle === queryParams.handle)
        : fallbackProducts

      return {
        response: { products: filtered, count: filtered.length },
        nextPage: null,
        queryParams,
      }
    }
    throw error
  }
}

/**
 * Every product matching `queryParams`, not just the first page.
 *
 * Callers that filter, sort or list the catalogue locally (shelf pages,
 * sitemap-style enumeration, the sorted catalogue grid) need the complete set —
 * a single `limit=100` request silently truncates past 100 items, which is how
 * shelves and pagination went partial (#147).
 */
export const listAllProducts = async ({
  queryParams,
  countryCode,
  regionId,
}: {
  queryParams?: ProductListQueryParams
  countryCode?: string
  regionId?: string
}): Promise<{
  response: { products: HttpTypes.StoreProduct[]; count: number }
  queryParams?: ProductListQueryParams
}> => {
  const collected: HttpTypes.StoreProduct[] = []
  let count = 0
  let pageParam = 1

  while (pageParam <= PRODUCTS_MAX_PAGES) {
    const page = await listProducts({
      pageParam,
      queryParams: { ...queryParams, limit: PRODUCTS_PAGE_SIZE },
      countryCode,
      regionId,
    })

    count = page.response.count
    collected.push(...page.response.products)

    // Stop on a short/empty page, or once the server's own count is satisfied.
    // `count` is the true total for the filtered set, so this is the authority
    // on how much is out there.
    if (
      page.response.products.length === 0 ||
      page.response.products.length < PRODUCTS_PAGE_SIZE ||
      collected.length >= count
    ) {
      break
    }

    pageParam += 1
  }

  return { response: { products: collected, count }, queryParams }
}

/**
 * Fetches the whole (filtered) catalogue, sorts it, then returns one page.
 *
 * `count` used to be `products.length` — the size of the first 100-item page —
 * so the store grid believed the catalogue held 100 items and stopped after 9
 * pages while 84 products sat unreachable behind it (#147). Sorting also has to
 * happen over the complete set, or page 2+ would be sorted against a different
 * input than page 1.
 */
export const listProductsWithSort = async ({
  page = 0,
  queryParams,
  sortBy = "created_at",
  countryCode,
  optionValueIds,
}: {
  page?: number
  queryParams?: ProductListQueryParams
  sortBy?: SortOptions
  countryCode: string
  optionValueIds?: OptionValueIds
}): Promise<{
  response: { products: HttpTypes.StoreProduct[]; count: number }
  nextPage: number | null
  queryParams?: ProductListQueryParams
}> => {
  const limit = queryParams?.limit || 12
  const optionFilters = Array.from(
    new Set((optionValueIds || []).filter(Boolean))
  )

  const {
    response: { products, count },
  } = await listAllProducts({
    queryParams: {
      ...queryParams,
      ...(optionFilters.length ? { option_value_id: optionFilters } : {}),
    },
    countryCode,
  })

  const sortedProducts = sortProducts(products, sortBy)

  const offset = (page - 1) * limit

  const nextPage = count > offset + limit ? page + 1 : null

  const paginatedProducts = sortedProducts.slice(offset, offset + limit)

  return {
    response: {
      products: paginatedProducts,
      count,
    },
    nextPage,
    queryParams,
  }
}
