import { Metadata } from "next"

import AiSearch from "@modules/home/components/ai-search"
import BestSellers from "@modules/home/components/best-sellers"
import FountainBackground from "@modules/home/components/fountain-background"
import Hero from "@modules/home/components/hero"
import HostVoice from "@modules/home/components/host-voice"
import IntentionShelves from "@modules/home/components/intention-shelves"
import MeetTheOracles from "@modules/home/components/meet-the-oracles"
import OracleFrontDoor from "@modules/home/components/oracle-front-door"
import QuizGreeter from "@modules/home/components/quiz-greeter"
import RitualBuilderHome from "@modules/home/components/ritual-builder-home"
import ReviewWall from "@modules/home/components/review-wall"
import TrustFaq from "@modules/home/components/trust-faq"
import Reveal from "@modules/common/components/reveal"
import { FEATURED_HERO_HANDLES } from "@modules/home/data/featured"
import { getProductByHandle } from "@lib/data/products"
import { getRegion } from "@lib/data/regions"

export const metadata: Metadata = {
  title: "3rd Eye Supply — Real Crystals, Ritual Goods & the AI Oracles",
  description:
    "Where AI meets the metaphysical arts — a wellness shop unlike any other. Four AI guides who know every stone on the shelf, a Ritual Builder, and real stones described plainly. Nothing promised but the stone itself.",
}

/**
 * Homepage — Bright Apothecary rebuild (issue #21).
 *
 * Section order follows the niche winners' pattern (Energy Muse /
 * Conscious Items): daylight hero, quiz greeter, intention shelves,
 * best sellers, trust furniture (FAQ + review wall), Oracle front
 * door, host voice.
 *
 * Positioning (2026-11-28): Meet the Oracles sits directly under the
 * hero — the four AI guides named where the traffic lands — and the
 * AI search and Ritual Builder sections join the tool story after
 * best sellers. The Oracle front door band stays as the deep-green
 * closing pitch.
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
    <div className="relative">
      {/* Zen fountain behind the whole homepage (issue #331). The
          sections below sit on translucent paper bands over its
          wash, so the water shows through the page and every word
          stays readable. */}
      <FountainBackground />
      <div className="relative z-[5]">
      <Hero product={featured} />
      <MeetTheOracles />
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
        <AiSearch />
      </Reveal>
      <Reveal duration={0.5}>
        <RitualBuilderHome />
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
      </div>
    </div>
  )
}
