import { Metadata } from "next"
import Link from "next/link"
import { MotionConfig, motion } from "framer-motion"

import { getCanonGuides } from "@lib/canon"

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
          a 4px rise over 0.3s, easeOut. This is a server component, so the
          reduced-motion guard uses framer-motion's MotionConfig instead of
          the useReducedMotion hook (hooks are client-only, same guard as
          #203): with reduced motion preferred, the lift is disabled and
          only the border colour change remains, as today. */}
      <MotionConfig reducedMotion="user">
        <div className="grid gap-4 sm:grid-cols-2">
          {guides.map((g) => (
            <motion.div
              key={g.slug}
              whileHover={{ y: -4 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              <Link
                href={`/${countryCode}/guides/${g.slug}`}
                className="block h-full rounded-lg border border-white/10 bg-white/[0.02] p-5 hover:border-violet-700/50 hover:bg-white/[0.04] transition"
              >
                <h2 className="font-medium mb-1">{g.title}</h2>
                <p className="text-sm text-gray-400 line-clamp-2">
                  {g.excerpt}
                </p>
                {g.topics.length > 0 && (
                  <p className="text-xs text-gray-500 mt-3">
                    {g.topics.slice(0, 3).join(" · ")}
                  </p>
                )}
              </Link>
            </motion.div>
          ))}
        </div>
      </MotionConfig>
    </div>
  )
}
