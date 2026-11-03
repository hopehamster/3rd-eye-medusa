import { MetadataRoute } from "next"

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = "https://3rdeyesupply.com"
  const backendUrl = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL
  const publishableKey = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY
  
  const urls: MetadataRoute.Sitemap = [
    {
      url: base,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${base}/us`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${base}/us/store`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${base}/us/oracle`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${base}/us/guides`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
    },
  ]
  
  if (backendUrl && publishableKey) {
    try {
      // Every published product, not just the first page (#147). Medusa caps a
      // page at 100, so page through `count` until the catalogue is exhausted —
      // otherwise the 84 products past the cap never reach the sitemap.
      const headers = { "x-publishable-api-key": publishableKey }
      const PAGE_SIZE = 100
      const MAX_PAGES = 50
      const seen = new Set<string>()

      for (let page = 0; page < MAX_PAGES; page++) {
        const productsRes = await fetch(
          `${backendUrl}/store/products?limit=${PAGE_SIZE}&offset=${page * PAGE_SIZE}&fields=handle,updated_at`,
          { headers }
        )
        if (!productsRes.ok) break

        const { products } = await productsRes.json()
        const batch = (products || []).filter(
          (p: { handle?: string }) => p.handle && !seen.has(p.handle)
        )

        for (const p of batch) {
          seen.add(p.handle)
          urls.push({
            url: `${base}/us/products/${p.handle}`,
            lastModified: p.updated_at ? new Date(p.updated_at) : new Date(),
            changeFrequency: "weekly",
            priority: 0.6,
          })
        }

        // A short page is the last page.
        if ((products || []).length < PAGE_SIZE) break
      }
    } catch {
      // Silently fail - static URLs still work
    }
  }
  
  // Guide articles (static list - 6 guides)
  const guides = [
    "what-is-ritual",
    "crystal-care-guide", 
    "tarot-for-beginners",
    "chakra-basics",
    "moon-rituals",
    "smudging-guide",
  ]
  for (const slug of guides) {
    urls.push({
      url: `${base}/us/guides/${slug}`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    })
  }
  
  return urls
}
