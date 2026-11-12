import { HttpTypes } from "@medusajs/types"

import { getProductPrice } from "@lib/util/get-product-price"

/**
 * Intention shelves.
 *
 * Curated editorial presentations over the existing product/intent plumbing.
 * The six slugs match the homepage intention-grid taxonomy and the intent
 * values used by the store's `?intent=` refinement (INTENTS_ATTRIBUTE).
 *
 * ONE SOURCE FOR EVERY SURFACE: the homepage cards, the /store shelf index and
 * the /store/shelf/<intent> header all read this file and the product media
 * helper below. Shelf cards show the shelf's own first product, so a card can
 * never picture something that is not for sale on that shelf (#150).
 *
 * Product selection (see filterShelfProducts):
 *  1. Products whose metadata.intents include the shelf slug win first.
 *     As of 2026-10-31 every published product carries intents, so this is the
 *     live path — not a dormant one.
 *  2. The curated `handles` list below is the fallback for anything untagged.
 *
 * COPY: headlines, intros and usage bullets are final shop copy, deliberately
 * free of medical or efficacy claims.
 */

export type ShelfDefinition = {
  /** Intent slug — matches intention-grid taxonomy */
  intent: string
  /** Shelf name, e.g. "Protection" */
  label: string
  stone: string
  /** Shelf name as printed on the homepage card, e.g. "Guard & Ground" */
  cardName: string
  /** One-line teaser under the card name on the homepage card */
  cardTeaser: string
  headline: string
  intro: string
  usageTitle: string
  usage: string[]
  /** Curated product handles, in display order */
  handles: string[]
}

export const SHELVES: ShelfDefinition[] = [
  {
    intent: "protection",
    label: "Protection",
    stone: "Black Tourmaline",
    cardName: "Guard & Ground",
    cardTeaser: "Stones for the door, the car, and the travel bag.",
    headline: "A little armor for the day",
    intro:
      "Some days the world feels sharp. These are the stones people reach for when they want to feel steady: worn at the wrist, kept in a pocket, set by the front door.",
    usageTitle: "How people use these",
    usage: [
      "Wear the bracelet through the day and take it off when you get home.",
      "Keep the pendant in your bag or by the front door, where you will actually see it.",
      "Hold the stone in your palm for a quiet minute when the noise gets loud.",
    ],
    handles: [
      "silver-obsidian-root-chakra-bracelet-purification-protection",
      "red-agate-root-chakra-bracelet-grounding-security",
      "tree-of-life-pendant-necklace-7-chakra-natural-gemstone-crystal-stones-healing",
    ],
  },
  {
    intent: "abundance-prosperity",
    label: "Abundance",
    stone: "Citrine",
    cardName: "The Full Cup",
    cardTeaser: "Stones for work, money, and momentum.",
    headline: "Room for good things",
    intro:
      "Prosperity is partly a mindset and partly just having things around you that you chose on purpose. These are the pieces customers buy when they are redecorating, goal-setting, or treating themselves deliberately.",
    usageTitle: "How people use these",
    usage: [
      "Set the pyramid where you will see it every morning, not in a drawer.",
      "Wear the pendant on days when you want a confidence cue.",
      "Gift one to someone who is starting something new.",
    ],
    handles: [
      "crystal-pyramid-home-decor-ornament",
      "natural-crystal-hexagonal-cone-rose-quartz-tigers-eye-pendulum-natural",
      "natural-stone-three-dimensional-hexagonal-pendulum-necklace",
    ],
  },
  {
    intent: "calm-soothing",
    label: "Calm",
    stone: "Amethyst",
    cardName: "Quiet Hours",
    cardTeaser: "Stones for loud weeks and busy rooms.",
    headline: "Turn the volume down",
    intro:
      "Amethyst has been the wind-down stone for a long time. These are the pieces that live by the bed, in the car, and wherever the day runs hot.",
    usageTitle: "How people use these",
    usage: [
      "Rest the mala beads on your nightstand so the evening ends with them, not your phone.",
      "Do slow breathing with the bracelet in your hand: in for four, out for six.",
      "Leave one piece in the room where you unwind, and leave it there.",
    ],
    handles: [
      "natural-lavender-amethyst-clear-quartz-bracelet-round-beaded-chain-wisdom-energy-jewelry-for-women",
      "natural-amethyst-bracelet-108-mala-beads-clear-quartz-spacer-multi-layer-chain-u",
      "tibetan-style-six-syllable-mantra-braided-bracelet-with-s925-silver",
      "natural-aquamarine-rose-quartz-bracelet-amethyst-multi-stone-beaded-chain-water",
    ],
  },
  {
    intent: "love-self",
    label: "Love",
    stone: "Rose Quartz",
    cardName: "Open Heart",
    cardTeaser: "Stones for the person in the mirror.",
    headline: "Start with the person in the mirror",
    intro:
      "Rose quartz is the self-love classic for a reason: it is soft, pink, and hard to ignore on a dresser. These pieces are reminders as much as they are jewelry.",
    usageTitle: "How people use these",
    usage: [
      "Wear the bracelet daily; let it be the reminder, not the fix.",
      "Tuck the pendulum into your morning routine, next to the mirror.",
      "Gift the set to a friend who needs the nudge more than you do.",
    ],
    handles: [
      "rose-quartz-heart-chakra-bracelet-self-love-emotional-healing",
      "green-crystal-heart-chakra-bracelet-stress-release-vitality",
      "natural-aquamarine-rose-quartz-bracelet-amethyst-multi-stone-beaded-chain-water",
      "natural-crystal-hexagonal-cone-rose-quartz-tigers-eye-pendulum-natural",
    ],
  },
  {
    intent: "clarity-focus",
    label: "Clarity",
    stone: "Clear Quartz",
    cardName: "Clear Water",
    cardTeaser: "Stones for foggy mornings and big decisions.",
    headline: "Cut through your own noise",
    intro:
      "Clear quartz and amethyst are the desk stones: the ones that live next to the keyboard and the notebook. For days when your own head is the loudest thing in the room.",
    usageTitle: "How people use these",
    usage: [
      "Keep one piece on the desk where you work, in sight line.",
      "Carry the mala on a walk when you need to think something through.",
      "Set the pendant near your journal or planner so it gets used.",
    ],
    handles: [
      "bolivian-amethyst-crown-chakra-bracelet-clarity-wisdom",
      "clear-quartz-aquamarine-throat-chakra-bracelet-expression-reconciliation",
      "kunzite-crown-chakra-set-deep-awakening-spiritual-healing",
      "tarot-card-stainless-steel-pendant-necklace",
      "multi-gemstone-all-chakra-set-holistic-balance-energy-alignment",
    ],
  },
  {
    intent: "sleep-dreams",
    label: "Sleep",
    stone: "Selenite",
    cardName: "The Night Table",
    cardTeaser: "Stones for the bedside and the dark.",
    headline: "Your brain needs the dark too",
    intro:
      "Moonstone is the bedtime stone in a lot of traditions. These are the pieces customers buy for the nightstand: the wind-down shelf.",
    usageTitle: "How people use these",
    usage: [
      "Keep the bracelet on the nightstand at night instead of on your wrist.",
      "Dim the lights an hour before bed and let the room do the work.",
      "Pair the ritual with a no-phone-before-bed rule for a week and see.",
    ],
    handles: [
      "gray-moonstone-throat-chakra-bracelet-anxiety-relief-sleep-aid",
      "natural-amethyst-bracelet-108-mala-beads-clear-quartz-spacer-multi-layer-chain-u",
      "crystal-pyramid-home-decor-ornament",
    ],
  },
]

export const getShelf = (intent: string): ShelfDefinition | undefined =>
  SHELVES.find((s) => s.intent === intent)

const productIntents = (product: {
  metadata?: Record<string, unknown> | null
}): string[] => {
  const raw = product.metadata?.intents
  if (Array.isArray(raw)) {
    return raw.map((v) => String(v).trim().toLowerCase()).filter(Boolean)
  }
  if (typeof raw === "string") {
    return raw
      .split(",")
      .map((v) => v.trim().toLowerCase())
      .filter(Boolean)
  }
  return []
}

/**
 * Products belonging to a shelf. Metadata intents win; the curated handle
 * list fills membership until the catalog is tagged. Curated order is kept.
 */
export const filterShelfProducts = <
  T extends { handle?: string | null; metadata?: Record<string, unknown> | null }
>(
  products: T[],
  shelf: ShelfDefinition
): T[] => {
  const byHandle = new Map<string, T>()
  for (const p of products) {
    if (p.handle) byHandle.set(p.handle, p)
  }

  const curated: T[] = []
  const curatedSet = new Set<string>()
  for (const handle of shelf.handles) {
    const p = byHandle.get(handle)
    if (p) {
      curated.push(p)
      curatedSet.add(handle)
    }
  }

  const tagged = products.filter(
    (p) =>
      p.handle &&
      !curatedSet.has(p.handle) &&
      productIntents(p).includes(shelf.intent)
  )

  return [...curated, ...tagged]
}

/** The catalogue fields a shelf card needs to picture and name a product. */
type ShelfProductLike = {
  handle?: string | null
  metadata?: Record<string, unknown> | null
  title?: string | null
  thumbnail?: string | null
  material?: string | null
  images?: ({ url?: string | null } | null)[] | null
}

export type ShelfCardMedia = {
  /** Product thumbnail URL */
  src: string
  /** Alt text naming the product and its material, both taken from the listing */
  alt: string
  /** Product name, as listed */
  title: string
  /** Product material, as listed; null when the catalogue has not filled it in */
  material: string | null
}

/**
 * Media for a shelf card: the shelf's own first product, with its real name
 * and material. Returns null when the shelf has no product (or the product has
 * no image) so callers render no image rather than stock scenery (#150).
 */
export const getShelfCardMedia = <T extends ShelfProductLike>(
  products: T[],
  shelf: ShelfDefinition
): ShelfCardMedia | null => {
  const [product] = filterShelfProducts(products, shelf)
  if (!product) return null

  const src = product.thumbnail || product.images?.[0]?.url || null
  const title = (product.title ?? "").trim()
  if (!src || !title) return null

  const material = (product.material ?? "").trim() || null

  return {
    src,
    alt: material ? `${title}, ${material}` : title,
    title,
    material,
  }
}

/**
 * Shoppable shelves (issue #158). Shelves hold 3-5 pieces, so every control
 * below earns its place or stays hidden: a pill, a sort option, or a price
 * cutoff exists only when the shelf's own products give it something to do.
 * Nothing here invents a category, a price, or a claim — every value comes
 * from the products on the shelf.
 */

/** Sort orders for a shelf page, carried in `?sort=`. */
export type ShelfSort = "curated" | "price_asc" | "price_desc" | "name_asc"

export const SHELF_SORTS: { value: ShelfSort; label: string }[] = [
  { value: "curated", label: "Curated order" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
  { value: "name_asc", label: "Name: A to Z" },
]

/** Unknown or missing sort values fall back to the curated shelf order. */
export const parseShelfSort = (
  value: string | string[] | null | undefined
): ShelfSort => {
  const raw = Array.isArray(value) ? value[0] : value
  if (raw && SHELF_SORTS.some((s) => s.value === raw)) {
    return raw as ShelfSort
  }
  return "curated"
}

/**
 * Form of a piece, read from the words in its own title — the only
 * form signal the catalogue carries on the product itself. The first
 * matching keyword in this order wins, so "pendant necklace" reads as a
 * necklace and "mala beads bracelet" reads as a bracelet. A title that
 * matches nothing has no form: it still shows under "All", it just gets
 * no pill of its own.
 */
const FORM_KEYWORDS: { value: string; label: string; keyword: string }[] = [
  { value: "bracelet", label: "Bracelets", keyword: "bracelet" },
  { value: "necklace", label: "Necklaces", keyword: "necklace" },
  { value: "pendant", label: "Pendants", keyword: "pendant" },
  { value: "pyramid", label: "Pyramids", keyword: "pyramid" },
  { value: "pendulum", label: "Pendulums", keyword: "pendulum" },
  { value: "mala", label: "Malas", keyword: "mala" },
  { value: "set", label: "Sets", keyword: "set" },
]

export type ShelfForm = {
  value: string
  label: string
  count: number
}

export const getProductForm = (product: {
  title?: string | null
}): string | null => {
  const title = (product.title ?? "").toLowerCase()
  if (!title) return null
  const match = FORM_KEYWORDS.find((f) => title.includes(f.keyword))
  return match ? match.value : null
}

/**
 * The forms actually present on this shelf, with counts, most common first.
 * A pill exists only for a form at least one piece on the shelf has.
 */
export const getShelfForms = (
  products: { title?: string | null }[]
): ShelfForm[] => {
  const counts = new Map<string, number>()
  for (const product of products) {
    const form = getProductForm(product)
    if (form) counts.set(form, (counts.get(form) ?? 0) + 1)
  }
  return FORM_KEYWORDS.filter((f) => counts.has(f.value))
    .map((f) => ({
      value: f.value,
      label: f.label,
      count: counts.get(f.value) ?? 0,
    }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))
}

/** Keep only pieces of the given form; no form means no filtering. */
export const filterShelfProductsByForm = (
  products: HttpTypes.StoreProduct[],
  form: string | undefined
): HttpTypes.StoreProduct[] => {
  if (!form) return products
  return products.filter((p) => getProductForm(p) === form)
}

/** Cheapest variant price as a raw number, or null when unpriced. */
const getCheapestPriceNumber = (
  product: HttpTypes.StoreProduct
): number | null => {
  if (!product.id) return null
  const cheapest = getProductPrice({ product }).cheapestPrice
  return cheapest?.calculated_price_number ?? null
}

/** Cheapest variant price as the shop already formats it, e.g. "$50". */
const getCheapestPriceLabel = (
  product: HttpTypes.StoreProduct
): string | null => {
  if (!product.id) return null
  const cheapest = getProductPrice({ product }).cheapestPrice
  return cheapest?.calculated_price ?? null
}

export type ShelfPriceCutoff = {
  /** Raw cheapest-price number, used as the `?maxPrice=` value */
  value: number
  /** "Up to $50" — the formatted price comes from the listing itself */
  label: string
  /** Pieces on the shelf priced at or under this cutoff */
  count: number
}

/**
 * Price cutoffs drawn from the shelf's own prices: one cutoff per distinct
 * cheapest price, except the highest (a cutoff at the top price would match
 * everything). Comparing raw numbers and labelling with the shop's own
 * formatted price keeps this correct whatever currency unit the backend
 * stores — no dollar threshold is invented here.
 */
export const getShelfPriceCutoffs = (
  products: HttpTypes.StoreProduct[]
): ShelfPriceCutoff[] => {
  const byAmount = new Map<number, string>()
  for (const product of products) {
    const amount = getCheapestPriceNumber(product)
    const label = getCheapestPriceLabel(product)
    if (amount !== null && label && !byAmount.has(amount)) {
      byAmount.set(amount, label)
    }
  }
  const amounts = [...byAmount.keys()].sort((a, b) => a - b)
  // Drop the highest price: it filters nothing out.
  amounts.pop()
  return amounts.map((amount) => ({
    value: amount,
    label: `Up to ${byAmount.get(amount)}`,
    count: products.filter((p) => {
      const price = getCheapestPriceNumber(p)
      return price !== null && price <= amount
    }).length,
  }))
}

/**
 * The price filter earns a place only on a shelf with at least 4 pieces and
 * at least 2 usable cutoffs — on a 3-piece shelf with one price each, a
 * price filter is clutter, not help.
 */
export const shouldShowShelfPriceFilter = (
  products: HttpTypes.StoreProduct[]
): boolean =>
  products.length >= 4 && getShelfPriceCutoffs(products).length >= 2

/** A positive raw price number, or null when the param is missing or junk. */
export const parseShelfMaxPrice = (
  value: string | string[] | null | undefined
): number | null => {
  const raw = Array.isArray(value) ? value[0] : value
  if (!raw) return null
  const parsed = Number(raw)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null
}

/**
 * Keep only pieces priced at or under the cutoff. Unpriced pieces are left
 * out while the filter is on — the shelf cannot say they are under the cap.
 */
export const filterShelfProductsByMaxPrice = (
  products: HttpTypes.StoreProduct[],
  maxPrice: number | null
): HttpTypes.StoreProduct[] => {
  if (maxPrice === null) return products
  return products.filter((p) => {
    const price = getCheapestPriceNumber(p)
    return price !== null && price <= maxPrice
  })
}

/**
 * Sort a shelf's pieces. Curated order is the shelf order from
 * filterShelfProducts, untouched. Unpriced pieces sort last on price sorts.
 */
export const sortShelfProducts = (
  products: HttpTypes.StoreProduct[],
  sort: ShelfSort
): HttpTypes.StoreProduct[] => {
  const sorted = [...products]
  switch (sort) {
    case "price_asc":
      return sorted.sort((a, b) => {
        const pa = getCheapestPriceNumber(a)
        const pb = getCheapestPriceNumber(b)
        if (pa === null && pb === null) return 0
        if (pa === null) return 1
        if (pb === null) return -1
        return pa - pb
      })
    case "price_desc":
      return sorted.sort((a, b) => {
        const pa = getCheapestPriceNumber(a)
        const pb = getCheapestPriceNumber(b)
        if (pa === null && pb === null) return 0
        if (pa === null) return 1
        if (pb === null) return -1
        return pb - pa
      })
    case "name_asc":
      return sorted.sort((a, b) =>
        (a.title ?? "").localeCompare(b.title ?? "")
      )
    case "curated":
    default:
      return sorted
  }
}
