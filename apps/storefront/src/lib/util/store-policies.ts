import { HttpTypes } from "@medusajs/types"

export type StorePolicies = {
  returnWindowDays: number
  freeReturns: boolean
  shippingRate: number
  handlingDays: { min: number; max: number }
  transitDays: { min: number; max: number }
}

const toNumber = (value: unknown) => {
  if (typeof value !== "string" && typeof value !== "number") return null
  if (typeof value === "string" && value.trim() === "") return null
  const number = Number(value)
  return Number.isFinite(number) && number >= 0 ? number : null
}

// Day counts must be whole days; shippingRate stays a float.
const toInteger = (value: unknown) => {
  const number = toNumber(value)
  return number !== null && Number.isInteger(number) ? number : null
}

/**
 * Reads the store policy keys set on a region's metadata in Medusa Admin.
 * Returns null when any of the six numeric values is missing or invalid, so
 * callers omit policy data instead of publishing guesses. A missing
 * `free_returns` flag defaults to `false`.
 */
export const getRegionPolicies = (
  region: Pick<HttpTypes.StoreRegion, "metadata"> | null | undefined
): StorePolicies | null => {
  const metadata = region?.metadata ?? {}
  const values = {
    returnWindowDays: toInteger(metadata.return_window_days),
    shippingRate: toNumber(metadata.shipping_rate),
    handlingMin: toInteger(metadata.handling_days_min),
    handlingMax: toInteger(metadata.handling_days_max),
    transitMin: toInteger(metadata.transit_days_min),
    transitMax: toInteger(metadata.transit_days_max),
  }
  if (Object.values(values).some((value) => value === null)) {
    return null
  }
  if (
    values.handlingMin! > values.handlingMax! ||
    values.transitMin! > values.transitMax! ||
    values.returnWindowDays! < 1
  ) {
    return null
  }

  return {
    returnWindowDays: values.returnWindowDays!,
    freeReturns:
      metadata.free_returns === true ||
      metadata.free_returns === 1 ||
      (typeof metadata.free_returns === "string" &&
        ["true", "1"].includes(metadata.free_returns.trim().toLowerCase())),
    shippingRate: values.shippingRate!,
    handlingDays: { min: values.handlingMin!, max: values.handlingMax! },
    transitDays: { min: values.transitMin!, max: values.transitMax! },
  }
}

const businessDays = (range: { min: number; max: number }) => ({
  "@type": "QuantitativeValue",
  minValue: range.min,
  maxValue: range.max,
  unitCode: "DAY",
})

export const buildShippingDetails = (
  policies: StorePolicies,
  countryCode: string,
  currencyCode: string
) => ({
  "@type": "OfferShippingDetails",
  shippingRate: {
    "@type": "MonetaryAmount",
    value: policies.shippingRate,
    currency: currencyCode.toUpperCase(),
  },
  shippingDestination: {
    "@type": "DefinedRegion",
    addressCountry: countryCode.toUpperCase(),
  },
  deliveryTime: {
    "@type": "ShippingDeliveryTime",
    handlingTime: businessDays(policies.handlingDays),
    transitTime: businessDays(policies.transitDays),
  },
})

export const buildReturnPolicy = (
  policies: StorePolicies,
  countryCode: string
) => ({
  "@type": "MerchantReturnPolicy",
  applicableCountry: countryCode.toUpperCase(),
  returnPolicyCategory: "https://schema.org/MerchantReturnFiniteReturnWindow",
  merchantReturnDays: policies.returnWindowDays,
  returnMethod: "https://schema.org/ReturnByMail",
  returnFees: policies.freeReturns
    ? "https://schema.org/FreeReturn"
    : "https://schema.org/ReturnFeesCustomerResponsibility",
})

export const buildRegionsReturnPolicies = (regions: HttpTypes.StoreRegion[]) =>
  regions.flatMap((region) => {
    const policies = getRegionPolicies(region)
    if (!policies) {
      return []
    }
    return (region.countries ?? [])
      .filter((country) => country.iso_2)
      .map((country) => buildReturnPolicy(policies, country.iso_2!))
  })

export const formatDayRange = ({ min, max }: { min: number; max: number }) =>
  min === max ? `${min}` : `${min}-${max}`
