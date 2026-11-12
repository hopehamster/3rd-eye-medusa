import { sdk } from "@lib/config"
import { listRegions } from "@lib/data/regions"
import { SHELVES } from "@modules/store/data/shelves"
import {
  DEFAULT_COUNTRY_CODE,
  getSiteOrigin,
  listCountryCodes,
} from "@lib/util/site"
import type { MetadataRoute } from "next"

type ChangeFrequency = MetadataRoute.Sitemap[number]["changeFrequency"]

// Static pages that exist under every country code: the starter's shop and
// policy pages, plus our own Oracle and guides index.
const STATIC_PATHS: {
  path: string
  changeFrequency: ChangeFrequency
  priority: number
}[] = [
  { path: "", changeFrequency: "daily", priority: 0.9 },
  { path: "/store", changeFrequency: "daily", priority: 0.8 },
  { path: "/oracle", changeFrequency: "weekly", priority: 0.8 },
  { path: "/guides", changeFrequency: "weekly", priority: 0.7 },
  { path: "/shipping", changeFrequency: "monthly", priority: 0.5 },
  { path: "/returns", changeFrequency: "monthly", priority: 0.5 },
  { path: "/terms", changeFrequency: "monthly", priority: 0.5 },
  { path: "/privacy", changeFrequency: "monthly", priority: 0.5 },
  { path: "/contact", changeFrequency: "monthly", priority: 0.5 },
]

// Guide articles (static list - 6 guides)
const GUIDES = [
  "what-is-ritual",
  "crystal-care-guide",
  "tarot-for-beginners",
  "chakra-basics",
  "moon-rituals",
  "smudging-guide",
]

// Medusa caps a page at 100 (#147), so page through `count` in 100-item
// pages — a 200-item page would silently skip everything past the cap.
const PAGE_SIZE = 100
const MAX_PAGES = 50

type Page<T> = { items: T[]; count: number }

async function listAll<T>(fetchPage: (offset: number) => Promise<Page<T>>) {
  const all: T[] = []
  for (let page = 0; page < MAX_PAGES; page++) {
    const offset = page * PAGE_SIZE
    const { items, count } = await fetchPage(offset)
    all.push(...items)
    if (offset + PAGE_SIZE >= count || !items.length) {
      return all
    }
  }
  return all
}

type Entry = { handle?: string | null; updated_at?: string | Date | null }

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const origin = await getSiteOrigin()
  const now = new Date()

  // Regions first: without them there are no country codes to expand. If the
  // backend is unreachable the static pages still list under the default
  // country instead of failing the whole sitemap.
  let countryCodes: string[]
  try {
    countryCodes = listCountryCodes(await listRegions())
  } catch {
    countryCodes = [DEFAULT_COUNTRY_CODE]
  }
  if (!countryCodes.length) {
    countryCodes = [DEFAULT_COUNTRY_CODE]
  }

  // Products, categories and collections, paged through the SDK. A backend
  // failure leaves these empty — the static pages still work.
  const query = { fields: "handle,updated_at", limit: PAGE_SIZE }
  const [products, categories, collections] = await Promise.all([
    listAll<Entry>((offset) =>
      sdk.store.product
        .list({ ...query, offset })
        .then((res) => ({ items: res.products, count: res.count }))
    ).catch(() => [] as Entry[]),
    listAll<Entry>((offset) =>
      sdk.store.category
        .list({ ...query, offset })
        .then((res) => ({ items: res.product_categories, count: res.count }))
    ).catch(() => [] as Entry[]),
    listAll<Entry>((offset) =>
      sdk.store.collection
        .list({ ...query, offset })
        .then((res) => ({ items: res.collections, count: res.count }))
    ).catch(() => [] as Entry[]),
  ])

  const toEntries = (
    base: string,
    prefix: string,
    items: Entry[],
    changeFrequency: ChangeFrequency,
    priority: number
  ): MetadataRoute.Sitemap => {
    const seen = new Set<string>()
    const entries: MetadataRoute.Sitemap = []
    for (const item of items) {
      if (!item.handle || seen.has(item.handle)) {
        continue
      }
      seen.add(item.handle)
      entries.push({
        url: `${base}/${prefix}/${item.handle}`,
        lastModified: item.updated_at ? new Date(item.updated_at) : now,
        changeFrequency,
        priority,
      })
    }
    return entries
  }

  const urls: MetadataRoute.Sitemap = [
    {
      url: origin,
      lastModified: now,
      changeFrequency: "daily",
      priority: 1,
    },
  ]

  for (const countryCode of countryCodes) {
    const base = `${origin}/${countryCode}`
    urls.push(
      ...STATIC_PATHS.map((page) => ({
        url: `${base}${page.path}`,
        lastModified: now,
        changeFrequency: page.changeFrequency,
        priority: page.priority,
      })),
      // Our own intention shelves, from the one shelf list every surface reads.
      ...SHELVES.map((shelf) => ({
        url: `${base}/store/shelf/${shelf.intent}`,
        lastModified: now,
        changeFrequency: "weekly" as ChangeFrequency,
        priority: 0.7,
      })),
      ...toEntries(base, "products", products, "weekly", 0.6),
      ...toEntries(base, "categories", categories, "weekly", 0.6),
      ...toEntries(base, "collections", collections, "weekly", 0.6),
      ...GUIDES.map((slug) => ({
        url: `${base}/guides/${slug}`,
        lastModified: now,
        changeFrequency: "monthly" as ChangeFrequency,
        priority: 0.5,
      }))
    )
  }

  return urls
}
