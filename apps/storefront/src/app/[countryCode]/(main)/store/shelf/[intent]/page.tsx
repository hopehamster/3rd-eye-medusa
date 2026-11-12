import { Metadata } from "next"
import { notFound } from "next/navigation"

import { listAllProducts } from "@lib/data/products"
import { getRegion } from "@lib/data/regions"
import ShelfTemplate from "@modules/store/templates/shelf"
import {
  filterShelfProducts,
  getShelf,
  getShelfForms,
  parseShelfMaxPrice,
  parseShelfSort,
} from "@modules/store/data/shelves"

type Props = {
  params: Promise<{ countryCode: string; intent: string }>
  searchParams: Promise<{
    sort?: string
    form?: string
    maxPrice?: string
  }>
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { intent } = await props.params
  const shelf = getShelf(intent)

  if (!shelf) {
    return { title: "Shelf not found" }
  }

  return {
    title: `${shelf.label} — stones and pieces`,
    description: shelf.intro,
  }
}

export default async function ShelfPage(props: Props) {
  const { countryCode, intent } = await props.params
  const shelf = getShelf(intent)

  if (!shelf) {
    notFound()
  }

  const region = await getRegion(countryCode)

  if (!region) {
    notFound()
  }

  // Shelves filter the catalogue by `metadata.intents` in memory, so they need
  // every product — a single 100-item page left the lower shelves silently
  // short of pieces that exist (#147).
  const {
    response: { products },
  } = await listAllProducts({
    countryCode,
  })

  const shelfProducts = filterShelfProducts(products, shelf)

  // Shoppable shelves (#158): sort, form pill and price filter all arrive
  // as URL search params and are applied server-side. Unknown values are
  // ignored rather than erroring: an unknown sort falls back to curated
  // order, an unknown form is dropped, a junk maxPrice is dropped.
  const searchParams = await props.searchParams
  const sort = parseShelfSort(searchParams?.sort)
  const maxPrice = parseShelfMaxPrice(searchParams?.maxPrice)
  const formValues = new Set(getShelfForms(shelfProducts).map((f) => f.value))
  const form =
    searchParams?.form && formValues.has(searchParams.form)
      ? searchParams.form
      : undefined

  return (
    <ShelfTemplate
      shelf={shelf}
      products={shelfProducts}
      sort={sort}
      form={form}
      maxPrice={maxPrice}
    />
  )
}
