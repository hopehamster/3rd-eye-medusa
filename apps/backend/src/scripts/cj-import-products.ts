import type { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { createProductsWorkflow } from "@medusajs/medusa/core-flows"
import { CJClient } from "../modules/cj-fulfillment/cj-client"

/**
 * Import wellness / metaphysical products from CJ's catalogue.
 *
 * The store sells wellness and metaphysical goods, so discovery is restricted to
 * that vocabulary and every candidate must carry one of those terms in its name
 * — a bare CJ search returns Christmas trees, tents and underwear otherwise.
 *
 * Pricing matches the existing catalogue: CJ cost x 2.5, EUR at 0.92 of USD.
 * Variants are preserved (each with its own cj_vid and price) so an order ships
 * the exact variant a customer chose; products with too many variants are
 * skipped rather than collapsed to one.
 *
 * Report by default; WRITE_CJ_IMPORT=1 applies. LIMIT caps the batch.
 *
 *   LIMIT=20 npx medusa exec ./src/scripts/cj-import-products.ts
 *   WRITE_CJ_IMPORT=1 LIMIT=50 npx medusa exec ./src/scripts/cj-import-products.ts
 */
const KEYWORDS = [
  "crystal", "healing crystal", "amethyst", "rose quartz", "clear quartz",
  "obsidian", "moonstone", "citrine", "selenite", "black tourmaline",
  "mala beads", "prayer beads", "tarot", "oracle cards", "pendulum",
  "chakra", "sage smudge", "palo santo", "incense", "singing bowl",
  "orgone", "pyramid", "buddha", "zen decor", "feng shui",
  "manifestation", "affirmation", "zodiac", "astrology", "meditation",
  "aromatherapy", "essential oil", "gua sha", "jade roller", "reiki",
  "crystal tree", "geode", "evil eye", "amulet", "altar",
]

/**
 * On-brand means metaphysical or wellness *intent*, not just a material word.
 * "Crystal" alone pulls Christmas ornaments and whiskey tumblers, so a bare
 * material name only qualifies alongside jewellery/ritual context.
 */
const STRONG_TERMS = [
  "chakra", "reiki", "tarot", "oracle card", "pendulum", "mala", "buddha",
  "zen", "meditation", "spiritual", "orgone", "incense", "smudge", "sage",
  "singing bowl", "tibetan", "feng shui", "astrolog", "zodiac", "affirmation",
  "manifest", "altar", "evil eye", "amulet", "healing", "aura", "ritual",
  "lotus", "crystal healing", "energy jewelry", "yoga", "aromatherapy",
  "essential oil", "gua sha", "jade roller",
]
const MATERIAL_TERMS = [
  "crystal", "quartz", "amethyst", "obsidian", "moonstone", "citrine",
  "selenite", "tourmaline", "agate", "geode", "jade", "tiger eye",
  "labradorite", "fluorite", "garnet", "onyx", "aventurine", "rhodonite",
]
const RITUAL_CONTEXT = [
  "bracelet", "necklace", "pendant", "ring", "earring", "bead", "anklet",
  "pyramid", "tree", "sphere", "point", "wand", "tumble", "stone", "chip",
  "bowl", "candle", "charm", "talisman", "cairn", "cluster", "skull",
]
const BLOCK_TERMS = [
  "christmas", "halloween", "easter", "valentine", "beanie", "hat",
  "headband", "tumbler", "whiskey", "wine glass", "phone", "case for",
  "nail", "makeup", "lipstick", "mascara", "dress", "shirt", "shoes",
  "boot", "handbag", "wallet", "watch band", "tent", "blanket", "pillow",
  "tablecloth", "curtain",
]

const qualifies = (name: string): boolean => {
  const n = name.toLowerCase()
  if (BLOCK_TERMS.some((t) => n.includes(t))) return false
  if (STRONG_TERMS.some((t) => n.includes(t))) return true
  const material = MATERIAL_TERMS.some((t) => n.includes(t))
  return material && RITUAL_CONTEXT.some((t) => n.includes(t))
}

const MARKUP = 2.5
const EUR_RATE = 0.92
const MAX_VARIANTS = 12

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))
const slug = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60)

const money = (usd: number) => Math.max(1, Math.round(usd * 100))

export default async function cjImportProducts({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const write = process.env.WRITE_CJ_IMPORT === "1"
  const limit = Number(process.env.LIMIT ?? 20)

  const client = new CJClient({
    apiKey: process.env.CJ_API_KEY ?? "",
    email: process.env.CJ_EMAIL ?? "",
  })

  const throttle = async <T>(fn: () => Promise<T>): Promise<T> => {
    let lastErr: unknown
    for (let attempt = 1; attempt <= 5; attempt++) {
      try {
        const out = await fn()
        await sleep(1200)
        return out
      } catch (e) {
        lastErr = e
        if (!/Too Many Requests|QPS|429|1600200/i.test((e as Error).message ?? "")) break
        await sleep(1500 * attempt)
      }
    }
    throw lastErr instanceof Error ? lastErr : new Error(String(lastErr))
  }

  const { data: existing } = (await query.graph({
    entity: "product",
    fields: ["id", "metadata"],
    filters: { deleted_at: null },
  })) as { data: { id: string; metadata?: Record<string, unknown> | null }[] }
  const havePids = new Set(
    (existing ?? []).map((p) => p.metadata?.cj_pid).filter(Boolean).map(String)
  )

  // CJ lists family variants as separate products, so near-identical titles are
  // common. Seed the title key from the whole catalogue and keep adding to it as
  // the batch runs, or the shop fills with the same bracelet four times.
  const titleKey = (s: string) =>
    s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim()
  const { data: titled } = (await query.graph({
    entity: "product",
    fields: ["id", "title"],
    filters: { deleted_at: null },
  })) as { data: { id: string; title?: string | null }[] }
  const haveTitles = new Set((titled ?? []).map((p) => titleKey(p.title ?? "")))

  const { data: profiles } = (await query.graph({
    entity: "shipping_profile",
    fields: ["id", "name"],
  })) as { data: { id: string; name: string }[] }
  const profileId = profiles?.find((p) => /default/i.test(p.name))?.id ?? profiles?.[0]?.id
  if (!profileId) throw new Error("cj-import-products: no shipping profile found")

  const { data: channels } = (await query.graph({
    entity: "sales_channel",
    fields: ["id", "name"],
  })) as { data: { id: string; name: string }[] }
  const channelId = channels?.[0]?.id
  if (!channelId) throw new Error("cj-import-products: no sales channel found")

  logger.info(
    `cj-import-products: profile=${profileId} channel=${channels?.[0]?.name} have=${havePids.size} limit=${limit} write=${write}`
  )

  // 1. Collect candidate pids from on-brand keywords.
  const candidates = new Map<string, string>()
  for (const term of KEYWORDS) {
    if (candidates.size >= limit * 4) break
    try {
      const results = await throttle(() => client.searchProducts({ keyWord: term, size: 20 }))
      for (const r of results) {
        const name = (r.nameEn ?? "").toLowerCase()
        if (!r.id || havePids.has(r.id) || candidates.has(r.id)) continue
        if (!qualifies(name)) continue
        candidates.set(r.id, r.nameEn ?? "")
      }
    } catch (e) {
      logger.warn(`cj-import-products: search "${term}" failed: ${(e as Error).message}`)
    }
  }
  logger.info(`cj-import-products: ${candidates.size} on-brand candidates after filtering`)

  // 2. Build and create.
  let created = 0
  let skipped = 0
  let failed = 0

  for (const [pid, name] of candidates) {
    if (created >= limit) break
    try {
      const detail = await throttle(() => client.getProduct(pid))
      const variants = (detail.variants ?? []).filter((v) => v.vid)
      if (variants.length === 0 || variants.length > MAX_VARIANTS) {
        skipped++
        continue
      }

      const gallery = [detail.bigImage, ...(detail.images ?? [])].filter(
        (u): u is string => typeof u === "string" && u.length > 0
      )
      if (gallery.length === 0) {
        skipped++
        continue
      }

      const priced = variants
        .map((v) => ({ v, usd: Number(v.variantSellPrice ?? 0) }))
        .filter((x) => Number.isFinite(x.usd) && x.usd > 0)
      if (priced.length === 0) {
        skipped++
        continue
      }
      // Cost sanity: below $0.50 or above $60 would resell as nonsense.
      if (priced[0].usd < 0.5 || priced[0].usd > 60) {
        skipped++
        continue
      }

      const title = (detail.nameEn ?? name).trim()
      const key = titleKey(title)
      if (!key || haveTitles.has(key)) {
        skipped++
        continue
      }
      const handle = `${slug(title)}-${pid.slice(-6)}`
      const prices = (usd: number) => [
        { currency_code: "usd", amount: money(usd * MARKUP) },
        { currency_code: "eur", amount: money(usd * MARKUP * EUR_RATE) },
      ]

      const input = {
        title,
        handle,
        description: (detail.description ?? "").slice(0, 5000) || undefined,
        status: "published" as const,
        thumbnail: gallery[0],
        images: gallery.slice(0, 8).map((url) => ({ url })),
        shipping_profile_id: profileId,
        sales_channels: [{ id: channelId }],
        metadata: { cj_pid: pid, cj_imported_at: new Date().toISOString() },
        options: [{ title: "Style", values: ["Default"] }],
        variants: priced.length === 1
          ? [
              {
                title: "Default",
                sku: variants[0].variantSku ?? undefined,
                manage_inventory: false,
                allow_backorder: true,
                prices: prices(priced[0].usd),
                metadata: { cj_vid: priced[0].v.vid },
                options: { Style: "Default" },
              },
            ]
          : priced.map((x, i) => ({
              title: (x.v.variantNameEn ?? `Option ${i + 1}`).slice(0, 90),
              sku: x.v.variantSku ?? undefined,
              manage_inventory: false,
              allow_backorder: true,
              prices: prices(x.usd),
              metadata: { cj_vid: x.v.vid },
              options: { Style: "Default" },
            })),
      }

      if (priced.length > 1) {
        // each distinct variant title becomes an option value
        const values = Array.from(
          new Set(input.variants.map((v) => v.title))
        )
        ;(input as any).options = [{ title: "Style", values }]
        input.variants.forEach((v) => { (v as any).options = { Style: v.title } })
      }

      if (!write) {
        logger.info(
          `[report] ${title} pid=${pid} variants=${variants.length} usd=${money(priced[0].usd * MARKUP)}`
        )
        created++
        continue
      }

      await createProductsWorkflow(container).run({ input: { products: [input as any] } })
      haveTitles.add(key)
      created++
      logger.info(`cj-import-products: created ${title} (${variants.length} variants)`)
    } catch (e) {
      failed++
      logger.error(`cj-import-products: ${pid} failed: ${(e as Error).message}`)
    }
  }

  logger.info(
    `cj-import-products done: created=${created} skipped=${skipped} failed=${failed} write=${write}`
  )
}
