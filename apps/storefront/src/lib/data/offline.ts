import { HttpTypes } from "@medusajs/types"

/**
 * Offline/demo mode for the 3rd Eye Supply storefront.
 *
 * When NEXT_PUBLIC_STOREFRONT_OFFLINE_MODE is "1" (or "true"), the data layer
 * serves static fallback content instead of calling the Medusa backend. This lets
 * `next build` succeed and the site render (preview deploys, theme work,
 * screenshots) before the backend is live. Turn the flag off once the backend is
 * up — no code changes needed.
 *
 * Fallback content is clearly demo data, not real inventory.
 */

export const isOfflineMode = () => {
  const value = process.env.NEXT_PUBLIC_STOREFRONT_OFFLINE_MODE
  return value === "1" || value?.toLowerCase() === "true"
}

const OFFLINE_COUNTRY = (
  process.env.NEXT_PUBLIC_DEFAULT_REGION || "us"
).toLowerCase()

export const fallbackRegion = {
  id: "reg_offline",
  name: "Offline demo region",
  currency_code: "usd",
  tax_rate: 0,
  tax_code: null,
  gift_cards_taxable: false,
  automatic_taxes: false,
  countries: [{ iso_2: OFFLINE_COUNTRY }],
} as unknown as HttpTypes.StoreRegion

export const fallbackRegions: HttpTypes.StoreRegion[] = [fallbackRegion]

const demoVariant = (
  id: string,
  amount: number
): HttpTypes.StoreProductVariant =>
  ({
    id,
    title: "Default",
    sku: id,
    barcode: null,
    ean: null,
    upc: null,
    allow_backorder: false,
    manage_inventory: true,
    inventory_quantity: 25,
    hs_code: null,
    origin_country: null,
    mid_code: null,
    material: null,
    weight: null,
    length: null,
    height: null,
    width: null,
    calculated_price: {
      calculated_amount: amount,
      original_amount: amount,
      currency_code: "usd",
      calculated_price: { price_list_type: "default" },
    },
    options: [],
    images: [],
  } as unknown as HttpTypes.StoreProductVariant)

const demoProduct = (
  id: string,
  title: string,
  handle: string,
  description: string,
  amount: number
): HttpTypes.StoreProduct =>
  ({
    id,
    title,
    handle,
    subtitle: null,
    description,
    thumbnail: null,
    images: [],
    variants: [demoVariant(`${id}-variant`, amount)],
    options: [],
    tags: [],
    categories: [],
    collection: null,
    type: null,
    discountable: true,
    is_giftcard: false,
    status: "published",
    external_id: null,
    metadata: { offline_demo: true },
  } as unknown as HttpTypes.StoreProduct)

export const fallbackProducts: HttpTypes.StoreProduct[] = [
  demoProduct(
    "prod_offline_wood_ring",
    "Handcrafted Wood Ring",
    "wood-ring",
    "Turned from solid hardwood and finished by hand, each ring carries the grain of the tree it came from — no two are exactly alike. A quiet, weighty object for daily wear: an anchor for intention, set in wood rather than stone.",
    2200
  ),
  demoProduct(
    "prod_offline_orgone_angel",
    "Orgone Angel",
    "orgone-angel",
    "A hand-cast angel figure built up in layers of resin, metal shavings, and set stone. Made as a small altar or desk companion — something to hold during a moment of stillness, or to keep where you want the room to feel more considered.",
    3500
  ),
  demoProduct(
    "prod_offline_crystal_tree_green_aventurine",
    "Crystal Tree — Green Aventurine",
    "crystal-tree-green-aventurine",
    "A miniature tree with a wire trunk and branches tipped in green aventurine chips, mounted on a polished stone base. Made for desks, altars, and shelves — a composed piece of the mineral world.",
    3000
  ),
  demoProduct(
    "prod_offline_crystal_stud_earrings",
    "Crystal Stud Earrings",
    "crystal-stud-earrings",
    "Polished stone cabochons set as simple studs — understated enough for every day, with the particular character of real mineral: veining, depth, small variations no two stones share.",
    2000
  ),
  demoProduct(
    "prod_offline_3rd_eye_leggings",
    "3rd Eye Leggings",
    "3rd-eye-leggings",
    "High-waisted leggings in original 3rd Eye prints, including Lightning and Dragon. Built for movement — training, practice, long days on your feet.",
    2500
  ),
  demoProduct(
    "prod_offline_crystal_ring",
    "Crystal Ring",
    "crystal-ring",
    "A single polished stone bezel-set on a simple band — the stone is the whole statement. Each ring is one of a small case lot.",
    2800
  ),
  demoProduct(
    "prod_offline_orgone_pyramid",
    "Orgone Pyramid",
    "orgone-pyramid",
    "A hand-cast pyramid of layered resin, metal, and stone — the classic orgone form, made as a desk or altar object. Heavy in the hand, quiet in the room.",
    38500
  ),
  demoProduct(
    "prod_offline_orgone_buddha",
    "Orgone Buddha",
    "orgone-buddha",
    "A seated Buddha cast in layered orgone — resin, metal shavings, and inlaid stone. A substantial piece, made as the centerpiece of a meditation corner or shelf.",
    30000
  ),
  demoProduct(
    "prod_offline_orgone_starfish",
    "Orgone Starfish",
    "orgone-starfish",
    "An orgone starfish — resin, metal, and stone cast into an unexpected form. A little playful, a little strange; a conversation piece for the shelf.",
    17500
  ),
  demoProduct(
    "prod_offline_stone_protection_pouch",
    "Stone Protection Pouch",
    "stone-protection-pouch",
    "A small drawstring pouch, sized for stones, rings, or whatever you carry through the day. Simple, durable, made to be used.",
    2000
  ),
]

export const fallbackCollections: HttpTypes.StoreCollection[] = [
  {
    id: "coll_offline_crystals",
    title: "Crystals",
    handle: "crystals",
    products: [
      fallbackProducts[2],
      fallbackProducts[3],
      fallbackProducts[5],
      fallbackProducts[9],
    ],
    metadata: { offline_demo: true },
  } as unknown as HttpTypes.StoreCollection,
  {
    id: "coll_offline_jewelry",
    title: "Jewelry",
    handle: "jewelry",
    products: [
      fallbackProducts[0],
      fallbackProducts[3],
      fallbackProducts[5],
    ],
    metadata: { offline_demo: true },
  } as unknown as HttpTypes.StoreCollection,
  {
    id: "coll_offline_orgone",
    title: "Orgone Art",
    handle: "orgone-art",
    products: [
      fallbackProducts[1],
      fallbackProducts[6],
      fallbackProducts[7],
      fallbackProducts[8],
    ],
    metadata: { offline_demo: true },
  } as unknown as HttpTypes.StoreCollection,
  {
    id: "coll_offline_apparel",
    title: "Apparel",
    handle: "apparel",
    products: [fallbackProducts[4]],
    metadata: { offline_demo: true },
  } as unknown as HttpTypes.StoreCollection,
]

export const fallbackCategories: HttpTypes.StoreProductCategory[] = []
