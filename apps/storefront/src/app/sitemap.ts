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
      // Add all published products
      const productsRes = await fetch(
        `${backendUrl}/store/products?limit=100&fields=handle,updated_at`,
        { headers: { "x-publishable-api-key": publishableKey } }
      )
      if (productsRes.ok) {
        const { products } = await productsRes.json()
        for (const p of products || []) {
          if (p.handle) {
            urls.push({
              url: `${base}/us/products/${p.handle}`,
              lastModified: p.updated_at ? new Date(p.updated_at) : new Date(),
              changeFrequency: "weekly",
              priority: 0.6,
            })
          }
        }
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
