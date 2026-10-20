import { Metadata } from "next"
import { notFound } from "next/navigation"

import { isOfflineMode } from "@lib/data/offline"
import { getRegion } from "@lib/data/regions"
import ShelfIndex from "@modules/store/components/shelf-index"
import StoreTemplate from "@modules/store/templates"
import PaginatedProducts from "@modules/store/templates/paginated-products"

export const metadata: Metadata = {
  title: "Store",
  description: "Explore all of our products.",
}

export default async function StorePage(props: {
  params: Promise<{ countryCode: string }>
}) {
  const { countryCode } = await props.params
  const region = await getRegion(countryCode)

  if (!region) {
    notFound()
  }

  // In offline mode, the InstantSearch backend is unavailable.
  // Use the server-side product listing with fallback data instead.
  if (isOfflineMode()) {
    return (
      <>
        <ShelfIndex />
        <div className="py-6 content-container" data-testid="category-container">
          <div className="mb-8 text-2xl-semi">
            <h1 data-testid="store-page-title">All products</h1>
          </div>
          <PaginatedProducts
            sortBy="created_at"
            page={1}
            countryCode={countryCode}
          />
        </div>
      </>
    )
  }

  return (
    <>
      <ShelfIndex />
      <StoreTemplate currencyCode={region.currency_code} />
    </>
  )
}
