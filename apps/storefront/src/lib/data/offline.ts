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
    "prod_offline_amethyst",
    "Amethyst Cathedral Cluster",
    "amethyst-cathedral-cluster",
    "Demo listing. A deep-violet amethyst cathedral cluster for the altar, the desk, or the nightstand. Real inventory appears here once the store backend is connected.",
    4800
  ),
  demoProduct(
    "prod_offline_koa_ring",
    "Koa Wood Ring — Hand Turned",
    "koa-wood-ring-hand-turned",
    "Demo listing. A hand-turned Hawaiian koa wood band, finished with natural oils. Real inventory appears here once the store backend is connected.",
    6500
  ),
  demoProduct(
    "prod_offline_orgone",
    "Orgonite Pyramid — Black Tourmaline",
    "orgonite-pyramid-black-tourmaline",
    "Demo listing. Hand-cast orgonite pyramid with black tourmaline, copper, and gold leaf. Real inventory appears here once the store backend is connected.",
    3900
  ),
]

export const fallbackCollections: HttpTypes.StoreCollection[] = [
  {
    id: "coll_offline_crystals",
    title: "Crystals",
    handle: "crystals",
    products: [fallbackProducts[0]],
    metadata: { offline_demo: true },
  } as unknown as HttpTypes.StoreCollection,
  {
    id: "coll_offline_jewelry",
    title: "Jewelry",
    handle: "jewelry",
    products: [fallbackProducts[1]],
    metadata: { offline_demo: true },
  } as unknown as HttpTypes.StoreCollection,
  {
    id: "coll_offline_orgone",
    title: "Orgone Art",
    handle: "orgone-art",
    products: [fallbackProducts[2]],
    metadata: { offline_demo: true },
  } as unknown as HttpTypes.StoreCollection,
]

export const fallbackCategories: HttpTypes.StoreProductCategory[] = []
