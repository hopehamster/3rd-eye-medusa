import { Metadata } from "next"
import { MotionConfig } from "framer-motion"

import { getCanonGuides } from "@lib/canon"
import GuideCard from "@modules/guides/components/guide-card"

export const metadata: Metadata = {
  title: "Guides | 3rd Eye Supply",
  description:
    "Plain-language guides on crystals, rituals, cleansing, moon work, and the metaphysical basics — from the 3rd Eye Supply canon.",
}

export default async function GuidesPage({
  params,
}: {
  params: Promise<{ countryCode: string }>
}) {
  const { countryCode } = await params
  const guides = await getCanonGuides()

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <p className="text-xs uppercase tracking-widest text-violet-400 mb-3">
        The Canon
      </p>
      <h1 className="text-3xl font-semibold mb-2">Guides</h1>
      <p className="text-gray-400 mb-10 max-w-2xl">
        Plain-language guides on the metaphysical basics — crystals, cleansing,
        rituals, moon work, and more. The same knowledge the Oracle draws on.
      </p>
      {/* Guide cards lift on hover (issue #248), matching the shelf cards:
          a 4px rise over 0.3s, easeOut. The card itself is a client
          component (GuideCard): this page is a server component, and
          touching motion.div here called createMotionComponent() on the
          server and 500'd the index at runtime. The reduced-motion guard
          stays framer-motion's MotionConfig instead of the
          useReducedMotion hook (hooks are client-only, same guard as
          #203): with reduced motion preferred, the lift is disabled and
          only the border colour change remains, as today. */}
      <MotionConfig reducedMotion="user">
        <div className="grid gap-4 sm:grid-cols-2">
          {guides.map((g) => (
            <GuideCard
              key={g.slug}
              href={`/${countryCode}/guides/${g.slug}`}
              title={g.title}
              excerpt={g.excerpt}
              topics={g.topics}
            />
          ))}
        </div>
      </MotionConfig>
    </div>
  )
}
