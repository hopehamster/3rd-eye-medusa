import { Metadata } from "next"
import { notFound } from "next/navigation"
import { MotionConfig } from "framer-motion"
import { getCanonGuide, getCanonGuides } from "@lib/canon"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Reveal from "@modules/common/components/reveal"

/**
 * Split a rendered guide into its sections: the intro (everything before
 * the first h2) plus one section per h2, each running to the next h2.
 * The canon renderer only emits top-level <h2>/<h3>/<ul>/<p> blocks, so a
 * lookahead split on <h2> is enough. A guide with no h2 is one section.
 */
function splitGuideSections(html: string): string[] {
  const sections = html
    .split(/(?=<h2[\s>])/)
    .map((s) => s.trim())
    .filter(Boolean)
  return sections.length > 0 ? sections : [html]
}

export async function generateStaticParams() {
  const guides = await getCanonGuides()
  // Guides are region-independent content, but the route has a [countryCode]
  // segment, so every entry must include it or Next.js prerenders nothing.
  // Prefer the backend region list; fall back to "us" for offline builds.
  let countryCodes = ["us"]
  try {
    const { listRegions } = await import("@lib/data/regions")
    const regions = await listRegions()
    const codes = regions
      ?.flatMap((r) => r.countries?.map((c) => c.iso_2) ?? [])
      .filter(Boolean) as string[]
    if (codes?.length) {
      countryCodes = Array.from(new Set(codes))
    }
  } catch {
    // Offline build without backend access — keep the "us" fallback.
  }
  return countryCodes.flatMap((countryCode) =>
    guides.map((g) => ({ countryCode, slug: g.slug }))
  )
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ countryCode: string; slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const guide = await getCanonGuide(slug)
  if (!guide) {
    return { title: "Guide not found" }
  }
  return {
    title: `${guide.title} | 3rd Eye Supply Guides`,
    description: guide.excerpt,
    keywords: guide.topics,
  }
}

export default async function GuidePage({
  params,
}: {
  params: Promise<{ countryCode: string; slug: string }>
}) {
  const { slug } = await params
  const guide = await getCanonGuide(slug)
  if (!guide) {
    notFound()
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: guide.title,
    description: guide.excerpt,
    author: {
      "@type": "Organization",
      name: "3rd Eye Supply",
    },
    about: guide.topics,
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <p className="text-xs uppercase tracking-widest text-violet-400 mb-3">
        3rd Eye Supply Guide
      </p>
      <h1 className="text-3xl font-semibold mb-2">{guide.title}</h1>
      {guide.topics.length > 0 && (
        <p className="text-sm text-gray-400 mb-8">{guide.topics.join(" · ")}</p>
      )}
      {/*
        Guide text fades in section by section as you scroll (#249): the
        body is split at each h2 and every section gets the shared Reveal
        (opacity only, once, as it enters view). The prose child selectors
        move onto each section's wrapper, since the headings are no longer
        direct children of the article. MotionConfig reducedMotion="user"
        honours the OS reduced-motion setting; Reveal itself moves nothing.
      */}
      <MotionConfig reducedMotion="user">
        <article className="prose prose-invert max-w-none">
          {splitGuideSections(guide.html).map((sectionHtml, i) => (
            <Reveal key={i}>
              <div
                className="space-y-4 [&>h2]:text-xl [&>h2]:font-semibold [&>h2]:mt-8 [&>h3]:text-lg [&>h3]:font-medium [&>ul]:list-disc [&>ul]:pl-6 [&>ul]:space-y-1"
                dangerouslySetInnerHTML={{ __html: sectionHtml }}
              />
            </Reveal>
          ))}
        </article>
      </MotionConfig>
      {guide.sources.length > 0 && (
        <div className="mt-10 border-t border-white/10 pt-6">
          <p className="text-xs uppercase tracking-widest text-gray-500 mb-2">
            Sources
          </p>
          <ul className="text-sm text-gray-400 space-y-1">
            {guide.sources.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        </div>
      )}
      <div className="mt-10 rounded-lg bg-violet-950/40 border border-violet-800/30 p-6">
        <p className="font-medium mb-1">Want guidance tailored to you?</p>
        <p className="text-sm text-gray-400 mb-4">
          Ask the Oracle — describe what you need, and it will guide you to the
          right knowledge or the right piece.
        </p>
        <LocalizedClientLink
          href="/oracle"
          className="inline-block rounded bg-violet-600 px-4 py-2 text-sm font-medium text-white"
        >
          Consult the Oracle
        </LocalizedClientLink>
      </div>
    </div>
  )
}
