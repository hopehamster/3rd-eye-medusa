import { Metadata } from "next"
import { notFound } from "next/navigation"

import { listAllProducts } from "@lib/data/products"
import { getRegion } from "@lib/data/regions"
import ShelfTemplate from "@modules/store/templates/shelf"
import {
  filterShelfProducts,
  getShelf,
} from "@modules/store/data/shelves"

type Props = {
  params: Promise<{ countryCode: string; intent: string }>
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

  return <ShelfTemplate shelf={shelf} products={shelfProducts} />
}
