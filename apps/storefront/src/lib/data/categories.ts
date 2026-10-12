import { sdk } from "@lib/config"
import { HttpTypes } from "@medusajs/types"
import { getCacheOptions } from "./cookies"
import { fallbackCategories, isOfflineMode } from "./offline"

export const listCategories = async (query?: Record<string, unknown>) => {
  if (isOfflineMode()) {
    return fallbackCategories
  }

  const next = {
    ...(await getCacheOptions("categories")),
  }

  const limit = query?.limit || 100

  try {
    return sdk.client
      .fetch<{ product_categories: HttpTypes.StoreProductCategory[] }>(
        "/store/product-categories",
        {
          query: {
            fields:
              "*category_children, *products, *parent_category, *parent_category.parent_category",
            limit,
            ...query,
          },
          next,
          cache: "force-cache",
        }
      )
      .then(({ product_categories }) => product_categories)
  } catch (error) {
    if (isOfflineMode()) {
      return fallbackCategories
    }
    throw error
  }
}

export const getCategoryByHandle = async (categoryHandle: string[]) => {
  if (isOfflineMode()) {
    return undefined
  }

  const handle = `${categoryHandle.join("/")}`

  const next = {
    ...(await getCacheOptions("categories")),
  }

  try {
    return sdk.client
      .fetch<HttpTypes.StoreProductCategoryListResponse>(
        `/store/product-categories`,
        {
          query: {
            fields: "*category_children, *products",
            handle,
          },
          next,
          cache: "force-cache",
        }
      )
      .then(({ product_categories }) => product_categories[0])
  } catch (error) {
    if (isOfflineMode()) {
      return undefined
    }
    throw error
  }
}
