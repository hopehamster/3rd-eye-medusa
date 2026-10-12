import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { getCanonGuides } from "@lib/canon"

const GuidesPreview = async () => {
  let guides: { slug: string; title: string; excerpt: string }[] = []
  try {
    guides = (await getCanonGuides()).slice(0, 3)
  } catch {
    return null
  }

  if (!guides.length) {
    return null
  }

  return (
    <div className="content-container py-16">
      <div className="text-center mb-10">
        <p className="text-xs uppercase tracking-widest text-cosmos-gold mb-2">
          From the canon
        </p>
        <h2 className="text-3xl font-light font-display text-cosmos-text">
          Learn the craft
        </h2>
        <p className="text-cosmos-muted mt-2 max-w-xl mx-auto">
          Plain-language guides on crystals, rituals, and the metaphysical
          basics — the same knowledge the Oracle draws on.
        </p>
      </div>
      <div className="grid gap-4 small:grid-cols-3">
        {guides.map((g) => (
          <LocalizedClientLink
            key={g.slug}
            href={`/guides/${g.slug}`}
            className="group rounded-lg border border-cosmos-borderSoft bg-white/[0.02] p-6 hover:border-cosmos-gold/50 hover:bg-white/[0.04] transition"
          >
            <h3 className="font-display text-lg text-cosmos-text group-hover:text-cosmos-goldBright transition mb-2">
              {g.title}
            </h3>
            <p className="text-sm text-cosmos-muted line-clamp-3">{g.excerpt}</p>
          </LocalizedClientLink>
        ))}
      </div>
      <div className="text-center mt-8">
        <LocalizedClientLink
          href="/guides"
          className="text-sm text-cosmos-gold hover:text-cosmos-goldBright transition"
        >
          Browse all guides →
        </LocalizedClientLink>
      </div>
    </div>
  )
}

export default GuidesPreview
