"use server"

import { sdk } from "@lib/config"
import { HttpTypes } from "@medusajs/types"
import { getCacheOptions } from "./cookies"
import { fallbackRegion, fallbackRegions, isOfflineMode } from "./offline"

export const listRegions = async () => {
  if (isOfflineMode()) {
    return fallbackRegions
  }

  const next = {
    ...(await getCacheOptions("regions")),
  }

  try {
    return await sdk.client
      .fetch<{ regions: HttpTypes.StoreRegion[] }>(`/store/regions`, {
        method: "GET",
        next,
        cache: "force-cache",
      })
      .then(({ regions }) => regions)
  } catch (error) {
    if (isOfflineMode()) {
      return fallbackRegions
    }
    throw error
  }
}

export const retrieveRegion = async (id: string) => {
  if (isOfflineMode()) {
    return fallbackRegion
  }

  const next = {
    ...(await getCacheOptions(["regions", id].join("-"))),
  }

  try {
    return await sdk.client
      .fetch<{ region: HttpTypes.StoreRegion }>(`/store/regions/${id}`, {
        method: "GET",
        next,
        cache: "force-cache",
      })
      .then(({ region }) => region)
  } catch (error) {
    if (isOfflineMode()) {
      return fallbackRegion
    }
    throw error
  }
}

const regionMap = new Map<string, HttpTypes.StoreRegion>()

export const getRegion = async (countryCode: string) => {
  if (regionMap.has(countryCode)) {
    return regionMap.get(countryCode)
  }

  const regions = await listRegions()

  if (!regions) {
    return null
  }

  regions.forEach((region) => {
    region.countries?.forEach((c) => {
      regionMap.set(c?.iso_2 ?? "", region)
    })
  })

  const region = countryCode
    ? regionMap.get(countryCode)
    : regionMap.get("us")

  return region
}
