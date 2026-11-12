import { Metadata } from "next"

import BestSellers from "@modules/home/components/best-sellers"
import Hero from "@modules/home/components/hero"
import HostVoice from "@modules/home/components/host-voice"
import IntentionShelves from "@modules/home/components/intention-shelves"
import OracleFrontDoor from "@modules/home/components/oracle-front-door"
import QuizGreeter from "@modules/home/components/quiz-greeter"
import ReviewWall from "@modules/home/components/review-wall"
import TrustFaq from "@modules/home/components/trust-faq"
import Reveal from "@modules/common/components/reveal"
import { FEATURED_HERO_HANDLES } from "@modules/home/data/featured"
import { getProductByHandle } from "@lib/data/products"
import { getRegion } from "@lib/data/regions"

export const metadata: Metadata = {
  title: "3rd Eye Supply — Real Crystals, Ritual Goods & the Oracle",
  description:
    "Natural crystals and ritual goods, chosen by hand and organized by what you're dealing with. Ask the Oracle where to begin. Shipped directly to you.",
}

/**
 * Homepage — Bright Apothecary rebuild (issue #21).
 *
 * Section order follows the niche winners' pattern (Energy Muse /
 * Conscious Items): daylight hero, quiz greeter, intention shelves,
 * best sellers, trust furniture (FAQ + review wall), Oracle front
 * door, host voice.
 *
 * Retired from the homepage (components still in the repo): the dark
 * hero, IntentionGrid, Interweave, FeaturedProducts (collection rails),
 * OracleCta.
 */
export default async function Home(props: {
  params: Promise<{ countryCode: string }>
}) {
  const params = await props.params

  const { countryCode } = params

  const region = await getRegion(countryCode)

  if (!region) {
    return null
  }

  // First featured handle that resolves to a real, photo-carrying product.
  let featured = null
  for (const handle of FEATURED_HERO_HANDLES) {
    const candidate = await getProductByHandle(handle, region.id)
    if (candidate?.thumbnail || candidate?.images?.length) {
      featured = candidate
      break
    }
  }

  return (
    <>
      <Hero product={featured} />
      <QuizGreeter />
      <IntentionShelves region={region} />
      {/* Home sections fade in on scroll (#230) — one Reveal per section,
          the same component the shelves already use. Hero, quiz greeter,
          and shelves are untouched: the hero stays still, the shelves
          already reveal card by card. */}
      <Reveal duration={0.5}>
        <BestSellers region={region} />
      </Reveal>
      <Reveal duration={0.5}>
        <TrustFaq />
      </Reveal>
      <Reveal duration={0.5}>
        <ReviewWall />
      </Reveal>
      <Reveal duration={0.5}>
        <OracleFrontDoor />
      </Reveal>
      <Reveal duration={0.5}>
        <HostVoice />
      </Reveal>
    </>
  )
}
