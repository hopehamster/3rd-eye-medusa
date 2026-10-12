import { sdk } from "@lib/config"
import { HttpTypes } from "@medusajs/types"

interface SearchHit {
  id: string
  score: number
  document: {
    id: string
    title: string
    handle: string
    thumbnail: string | null
  }
}

interface SearchResponse {
  results: {
    hits: SearchHit[]
  }[]
}

/**
 * Find products semantically similar to the given text using the Voyage
 * embeddings on the product `semantic` vector field.
 * Returns product IDs ordered by similarity, excluding `excludeId`.
 */
export async function findSimilarProducts(
  text: string,
  excludeId: string,
  take = 4
): Promise<string[]> {
  const query = text.trim().slice(0, 2000)
  if (!query) {
    return []
  }

  try {
    const res = await sdk.client.fetch<SearchResponse>(`/store/search`, {
      method: "POST",
      body: {
        entity: "product",
        search_options: {
          vector: {
            query,
            field: "semantic",
          },
        },
        pagination: { take: take + 1 },
      },
    })
    const hits = res.results?.[0]?.hits ?? []
    return hits
      .map((h) => h.document?.id || h.id)
      .filter((id) => id && id !== excludeId)
      .slice(0, take)
  } catch {
    return []
  }
}

/**
 * Hydrate product IDs into full StoreProduct records for display.
 */
export async function getProductsByIds(
  ids: string[],
  countryCode: string,
  regionId?: string
): Promise<HttpTypes.StoreProduct[]> {
  if (!ids.length) {
    return []
  }
  const { listProducts } = await import("@lib/data/products")
  const { response } = await listProducts({
    countryCode,
    queryParams: {
      id: ids,
      region_id: regionId,
      limit: ids.length,
    },
  })
  // Preserve similarity order
  const byId = new Map(response.products.map((p) => [p.id, p]))
  return ids
    .map((id) => byId.get(id))
    .filter((p): p is HttpTypes.StoreProduct => Boolean(p))
}
