import { Metadata } from "next"

import BestSellers from "@modules/home/components/best-sellers"
import Hero from "@modules/home/components/hero"
import HostVoice from "@modules/home/components/host-voice"
import IntentionShelves from "@modules/home/components/intention-shelves"
import OracleFrontDoor from "@modules/home/components/oracle-front-door"
import QuizGreeter from "@modules/home/components/quiz-greeter"
import ReviewWall from "@modules/home/components/review-wall"
import TrustFaq from "@modules/home/components/trust-faq"
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

  return (
    <>
      <Hero />
      <QuizGreeter />
      <IntentionShelves />
      <BestSellers region={region} />
      <TrustFaq />
      <ReviewWall />
      <OracleFrontDoor />
      <HostVoice />
    </>
  )
}
