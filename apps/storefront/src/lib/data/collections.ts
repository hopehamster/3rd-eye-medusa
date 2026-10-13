"use server"

import { sdk } from "@lib/config"
import { HttpTypes } from "@medusajs/types"
import { getCacheOptions } from "./cookies"
import { fallbackCollections, isOfflineMode } from "./offline"

export const retrieveCollection = async (id: string) => {
  if (isOfflineMode()) {
    return fallbackCollections.find((c) => c.id === id) || null
  }

  const next = {
    ...(await getCacheOptions("collections")),
  }

  try {
    return await sdk.client
      .fetch<{ collection: HttpTypes.StoreCollection }>(
        `/store/collections/${id}`,
        {
          next,
          cache: "force-cache",
        }
      )
      .then(({ collection }) => collection)
  } catch (error) {
    if (isOfflineMode()) {
      return fallbackCollections.find((c) => c.id === id) || null
    }
    throw error
  }
}

export const listCollections = async (
  queryParams: Record<string, string> = {}
): Promise<{ collections: HttpTypes.StoreCollection[]; count: number }> => {
  if (isOfflineMode()) {
    return { collections: fallbackCollections, count: fallbackCollections.length }
  }

  const next = {
    ...(await getCacheOptions("collections")),
  }

  queryParams.limit = queryParams.limit || "100"
  queryParams.offset = queryParams.offset || "0"

  try {
    return await sdk.client
      .fetch<{ collections: HttpTypes.StoreCollection[]; count: number }>(
        "/store/collections",
        {
          query: queryParams,
          next,
          cache: "force-cache",
        }
      )
      .then(({ collections }) => ({ collections, count: collections.length }))
  } catch (error) {
    if (isOfflineMode()) {
      return {
        collections: fallbackCollections,
        count: fallbackCollections.length,
      }
    }
    throw error
  }
}

export const getCollectionByHandle = async (
  handle: string
): Promise<HttpTypes.StoreCollection | null> => {
  if (isOfflineMode()) {
    return fallbackCollections.find((c) => c.handle === handle) || null
  }

  const next = {
    ...(await getCacheOptions("collections")),
  }

  try {
    return await sdk.client
      .fetch<HttpTypes.StoreCollectionListResponse>(`/store/collections`, {
        query: { handle, fields: "*products" },
        next,
        cache: "force-cache",
      })
      .then(({ collections }) => collections[0] || null)
  } catch (error) {
    if (isOfflineMode()) {
      return fallbackCollections.find((c) => c.handle === handle) || null
    }
    throw error
  }
}
