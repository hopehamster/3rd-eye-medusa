import "server-only"
import { headers } from "next/headers"

export const DEFAULT_COUNTRY_CODE = (
  process.env.NEXT_PUBLIC_DEFAULT_REGION || "us"
).toLowerCase()

const configuredUrl = () => process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/$/, "")

const originFromHeaders = (get: (name: string) => string | null) => {
  const host = (get("x-forwarded-host") ?? get("host"))?.split(",")[0].trim()
  if (!host) {
    return undefined
  }
  const proto = get("x-forwarded-proto")?.split(",")[0].trim() || "https"
  return `${proto}://${host}`
}

/** Origin for absolute URLs in server components (canonical, JSON-LD, OpenGraph). */
export const getSiteOrigin = async (): Promise<string> => {
  const configured = configuredUrl()
  if (configured) {
    return configured
  }
  const requestHeaders = await headers()
  return originFromHeaders((name) => requestHeaders.get(name)) || "http://localhost:8000"
}

export const listCountryCodes = (
  regions: { countries?: { iso_2?: string | null }[] | null }[]
): string[] =>
  Array.from(
    new Set(
      regions.flatMap((region) =>
        (region.countries ?? [])
          .map((country) => country.iso_2?.toLowerCase())
          .filter((code): code is string => Boolean(code))
      )
    )
  )
