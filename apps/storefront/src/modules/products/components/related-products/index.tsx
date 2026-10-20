import { HttpTypes } from "@medusajs/types"
import { getProductPrice } from "@lib/util/get-product-price"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Image from "next/image"

type RelatedProductsProps = {
  product: HttpTypes.StoreProduct
  countryCode: string
}

/**
 * Related products, restored (issue #24).
 * Uses direct fetch against the Medusa store API — the same pattern as the
 * PDP page — because the SDK helpers (listProducts/getRegion) call cookies()
 * and throw DYNAMIC_SERVER_USAGE here, which is why this was disabled.
 * Matching: same collection first, then everything else (this catalog is
 * small — 20 published pieces). Cards are rendered in paper tokens rather
 * than reusing ProductPreview, which still belongs to the store grid.
 */
async function fetchRelated(
  product: HttpTypes.StoreProduct,
  countryCode: string
): Promise<HttpTypes.StoreProduct[]> {
  const backendUrl = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL
  const publishableKey = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY

  if (!backendUrl || !publishableKey) {
    return []
  }

  const headers = { "x-publishable-api-key": publishableKey }

  try {
    const regionsRes = await fetch(`${backendUrl}/store/regions`, { headers })
    if (!regionsRes.ok) return []
    const regionsData = await regionsRes.json()
    const region = regionsData.regions?.find((r: HttpTypes.StoreRegion) =>
      r.countries?.some((c) => c.iso_2 === countryCode)
    )
    if (!region) return []

    const res = await fetch(
      `${backendUrl}/store/products?limit=100&region_id=${region.id}&fields=id,handle,title,thumbnail,collection_id,*variants.calculated_price`,
      { headers }
    )
    if (!res.ok) return []
    const data = await res.json()
    const all: HttpTypes.StoreProduct[] = (data.products ?? []).filter(
      (p: HttpTypes.StoreProduct) => p.id !== product.id
    )

    const sameCollection = product.collection_id
      ? all.filter((p) => p.collection_id === product.collection_id)
      : []
    const rest = all.filter((p) => !sameCollection.includes(p))

    return [...sameCollection, ...rest].slice(0, 4)
  } catch {
    return []
  }
}

export default async function RelatedProducts({
  product,
  countryCode,
}: RelatedProductsProps) {
  const related = await fetchRelated(product, countryCode)

  if (!related.length) {
    return null
  }

  return (
    <div className="border-t border-paper-border pt-10 small:pt-14 font-humanist">
      <h2 className="font-display text-2xl text-paper-text font-normal tracking-tight mb-8">
        More like this
      </h2>
      <ul className="grid grid-cols-2 medium:grid-cols-4 gap-5">
        {related.map((relatedProduct) => {
          const { cheapestPrice } = getProductPrice({
            product: relatedProduct,
          })
          return (
            <li key={relatedProduct.id}>
              <LocalizedClientLink
                href={`/products/${relatedProduct.handle}`}
                className="group block"
              >
                <div className="specimen-card p-3 transition-colors group-hover:border-paper-accent">
                  <div className="relative aspect-[4/5] w-full overflow-hidden bg-paper-surface rounded-soft">
                    {relatedProduct.thumbnail && (
                      <Image
                        src={relatedProduct.thumbnail}
                        alt={relatedProduct.title ?? ""}
                        fill
                        sizes="(max-width: 768px) 50vw, 25vw"
                        style={{ objectFit: "cover" }}
                      />
                    )}
                  </div>
                  <p className="mt-3 font-display text-[15px] leading-snug text-paper-text group-hover:text-paper-accent transition-colors">
                    {relatedProduct.title}
                  </p>
                  {cheapestPrice && (
                    <p className="mt-1 text-sm text-paper-muted">
                      {cheapestPrice.calculated_price}
                    </p>
                  )}
                </div>
              </LocalizedClientLink>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
