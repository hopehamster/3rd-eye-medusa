import { HttpTypes } from "@medusajs/types"
import { fallbackProducts, isOfflineMode } from "@lib/data/offline"
import { DEFAULT_COUNTRY_CODE, getSiteOrigin } from "@lib/util/site"

// The route serves live data, never a prerendered page.
export const dynamic = "force-dynamic"

/**
 * GET /products/[handle]/markdown
 * One product as Markdown: title, description, and a variants table with
 * variant IDs, prices, and stock. Unknown handle -> 404.
 *
 * Data access follows the product page
 * (src/app/[countryCode]/(main)/products/[handle]/page.tsx): a direct fetch
 * to the Medusa backend with the publishable key, the `handle` filter, and a
 * `region_id` — without it `*variants.calculated_price` comes back null.
 * Field selection mirrors src/lib/data/products.ts: `*variants.calculated_price`
 * for prices, `+variants.inventory_quantity` for stock. In offline mode the
 * demo catalogue (src/lib/data/offline.ts) is served, like listProducts does.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ handle: string }> }
) {
  const { handle } = await params
  const product = await fetchProduct(handle)

  if (!product) {
    return new Response("Product not found\n", {
      status: 404,
      headers: { "Content-Type": "text/markdown; charset=utf-8" },
    })
  }

  const origin = await getSiteOrigin()
  return new Response(toMarkdown(product, origin), {
    headers: { "Content-Type": "text/markdown; charset=utf-8" },
  })
}

async function fetchProduct(
  handle: string
): Promise<HttpTypes.StoreProduct | null> {
  if (isOfflineMode()) {
    return fallbackProducts.find((p) => p.handle === handle) ?? null
  }

  const backendUrl = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL
  const publishableKey = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY

  if (!backendUrl || !publishableKey) {
    return null
  }

  const headers = { "x-publishable-api-key": publishableKey }

  try {
    // Resolve the default region first: prices need a region_id.
    const regionsRes = await fetch(`${backendUrl}/store/regions`, { headers })
    if (!regionsRes.ok) {
      return null
    }
    const regionsData = await regionsRes.json()
    const regions: HttpTypes.StoreRegion[] = regionsData.regions ?? []
    const region =
      regions.find((r) =>
        r.countries?.some((c) => c.iso_2 === DEFAULT_COUNTRY_CODE)
      ) ?? regions[0]
    if (!region) {
      return null
    }

    const query = new URLSearchParams({
      limit: "1",
      handle,
      region_id: region.id,
      fields:
        "id,handle,title,subtitle,description,thumbnail,*variants.calculated_price,+variants.inventory_quantity,*variants.options,*options",
    })

    const productsRes = await fetch(
      `${backendUrl}/store/products?${query.toString()}`,
      { headers }
    )
    if (!productsRes.ok) {
      return null
    }
    const productsData = await productsRes.json()
    return productsData.products?.[0] ?? null
  } catch {
    return null
  }
}

function formatPrice(
  variant: HttpTypes.StoreProductVariant
): string {
  const price = variant.calculated_price
  if (!price || price.calculated_amount == null || !price.currency_code) {
    return "—"
  }
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: price.currency_code.toUpperCase(),
  }).format(price.calculated_amount / 100)
}

function variantLabel(variant: HttpTypes.StoreProductVariant): string {
  const optionValues = (variant.options ?? [])
    .map((o) => o.value)
    .filter(Boolean)
  if (optionValues.length > 0) {
    return optionValues.join(" / ")
  }
  return variant.title || "Default"
}

function toMarkdown(product: HttpTypes.StoreProduct, origin: string): string {
  const lines: string[] = [`# ${product.title}`, ""]

  if (product.subtitle) {
    lines.push(product.subtitle, "")
  }
  if (product.description) {
    lines.push(product.description, "")
  }

  lines.push(
    `- Handle: ${product.handle}`,
    `- Product ID: ${product.id}`,
    `- Shop: ${origin}/${DEFAULT_COUNTRY_CODE}/products/${product.handle}`,
    "",
    "## Variants",
    "",
    "| Variant | ID | Price | Stock |",
    "| --- | --- | --- | --- |"
  )

  for (const variant of product.variants ?? []) {
    const stock =
      variant.inventory_quantity == null
        ? "—"
        : String(variant.inventory_quantity)
    lines.push(
      `| ${variantLabel(variant)} | ${variant.id} | ${formatPrice(variant)} | ${stock} |`
    )
  }

  lines.push("")
  return lines.join("\n")
}
