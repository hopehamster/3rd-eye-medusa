"use server"

import { getRegionPolicies } from "@lib/util/store-policies"
import { listRegions } from "./regions"

export const getStorePolicies = async (countryCode: string) => {
  const regions = await listRegions()
  const current = regions.find((region) =>
    region.countries?.some(
      (country) =>
        country.iso_2?.toLowerCase() === countryCode.toLowerCase()
    )
  )

  return {
    current: getRegionPolicies(current),
    // Empty when there is no current region: callers must not emit this as
    // a currency in structured data (wiring follow-up).
    currencyCode: current?.currency_code ?? "",
    regions: regions.flatMap((region) => {
      const policies = getRegionPolicies(region)
      return policies ? [{ id: region.id, name: region.name, policies }] : []
    }),
  }
}
