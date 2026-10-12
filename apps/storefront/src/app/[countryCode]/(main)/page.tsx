import { Metadata } from "next"

import FeaturedProducts from "@modules/home/components/featured-products"
import GuidesPreview from "@modules/home/components/guides-preview"
import Hero from "@modules/home/components/hero"
import IntentionGrid from "@modules/home/components/intention-grid"
import OracleCta from "@modules/home/components/oracle-cta"
import { listCollections } from "@lib/data/collections"
import { getRegion } from "@lib/data/regions"

export const metadata: Metadata = {
  title: "3rd Eye Supply — Crystals, Ritual Objects & Spiritual Goods",
  description:
    "Hand-selected crystals, wood rings, and orgone art from Las Vegas. Chosen for intention, craft, and beauty.",
}

export default async function Home(props: {
  params: Promise<{ countryCode: string }>
}) {
  const params = await props.params

  const { countryCode } = params

  const region = await getRegion(countryCode)

  const { collections } = await listCollections({
    fields: "id, handle, title",
  })

  if (!collections || !region) {
    return null
  }

  return (
    <>
      <Hero />
      <IntentionGrid />
      <OracleCta />
      <GuidesPreview />
      <div className="py-12">
        <ul className="flex flex-col gap-x-6">
          <FeaturedProducts collections={collections} region={region} />
        </ul>
      </div>
    </>
  )
}
