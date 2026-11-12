import { HttpTypes } from "@medusajs/types"
import { getProductPrice } from "@lib/util/get-product-price"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import QuickAdd from "@modules/products/components/quick-add"
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
 * Matching: same collection first, then same tag (#170), then everything
 * else (this catalog is small — 20 published pieces). Cards are rendered
 * in paper tokens rather than reusing ProductPreview, which still belongs
 * to the store grid.
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

    const fields =
      "id,handle,title,thumbnail,collection_id,*variants.calculated_price"

    // Ask the API for the product's own collection first (#147). Deriving
    // "same collection" from the first 100 products silently dropped
    // collection mates that lived beyond that cap; the collection filter is
    // exact, so the priority set is now complete no matter how big the
    // catalogue gets. The rail only ever shows 4, so it stays bounded
    // requests rather than a full pagination walk.
    const sameCollection: HttpTypes.StoreProduct[] = []
    if (product.collection_id) {
      const collectionRes = await fetch(
        `${backendUrl}/store/products?limit=10&collection_id=${encodeURIComponent(product.collection_id)}&region_id=${region.id}&fields=${fields}`,
        { headers }
      )
      if (collectionRes.ok) {
        const collectionData = await collectionRes.json()
        sameCollection.push(
          ...(collectionData.products ?? []).filter(
            (p: HttpTypes.StoreProduct) => p.id !== product.id
          )
        )
      }
    }

    if (sameCollection.length >= 4) {
      return sameCollection.slice(0, 4)
    }

    // Same-tag pieces next (#170): a piece sharing one of this product's
    // tags is preferred over an arbitrary catalogue pick, even when it
    // lives in another collection. The starter passes the tag ids as one
    // listProducts call; here that is one direct fetch with a repeated
    // tag_id param per tag, which the store API treats as a match on any
    // of them. Skipped entirely when the product has no tags.
    const tagIds = (product.tags ?? []).map((tag) => tag.id).filter(Boolean)
    const sameTag: HttpTypes.StoreProduct[] = []
    if (tagIds.length) {
      try {
        const tagParams = new URLSearchParams()
        tagParams.set("limit", "10")
        tagIds.forEach((tagId) => tagParams.append("tag_id", tagId))
        tagParams.set("region_id", region.id)
        tagParams.set("fields", fields)
        const tagRes = await fetch(
          `${backendUrl}/store/products?${tagParams.toString()}`,
          { headers }
        )
        if (tagRes.ok) {
          const tagData = await tagRes.json()
          const picked = new Set(sameCollection.map((p) => p.id))
          sameTag.push(
            ...(tagData.products ?? []).filter(
              (p: HttpTypes.StoreProduct) =>
                p.id !== product.id && !picked.has(p.id)
            )
          )
        }
      } catch {
        // A failed tag fetch degrades to the old behaviour: sameTag stays
        // empty and the fill tops up from the collection tier alone.
      }
    }

    if (sameCollection.length + sameTag.length >= 4) {
      return [...sameCollection, ...sameTag].slice(0, 4)
    }

    // Fill the remainder from the wider catalogue. Which 4 "other" pieces show
    // is deliberately arbitrary — there is no ranking signal — so one page is
    // enough here.
    const res = await fetch(
      `${backendUrl}/store/products?limit=100&region_id=${region.id}&fields=${fields}`,
      { headers }
    )
    if (!res.ok) return [...sameCollection, ...sameTag].slice(0, 4)
    const data = await res.json()
    const picked = new Set([
      ...sameCollection.map((p) => p.id),
      ...sameTag.map((p) => p.id),
    ])
    const rest: HttpTypes.StoreProduct[] = (data.products ?? []).filter(
      (p: HttpTypes.StoreProduct) => p.id !== product.id && !picked.has(p.id)
    )

    return [...sameCollection, ...sameTag, ...rest].slice(0, 4)
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
        Pair it with
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
                  <QuickAdd
                    product={relatedProduct}
                    testId="cross-sell-add"
                    label="Add to cart"
                  />
                </div>
              </LocalizedClientLink>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
