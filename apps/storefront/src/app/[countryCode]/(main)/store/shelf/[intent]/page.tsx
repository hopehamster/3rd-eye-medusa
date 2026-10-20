import { Metadata } from "next"
import { notFound } from "next/navigation"

import { listProducts } from "@lib/data/products"
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

  const {
    response: { products },
  } = await listProducts({
    queryParams: { limit: 100 },
    countryCode,
  })

  const shelfProducts = filterShelfProducts(products, shelf)

  return <ShelfTemplate shelf={shelf} products={shelfProducts} />
}
