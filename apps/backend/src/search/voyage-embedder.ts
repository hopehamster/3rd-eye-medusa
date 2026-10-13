/**
 * Voyage AI embedder for the PostgreSQL search provider.
 *
 * The search module's postgres provider calls this as
 * `(text: string) => Promise<number[]>` — once per document at index time,
 * and once per query when `search_options.vector.query` is used.
 *
 * Uses voyage-4-large (1024 dimensions, best retrieval quality).
 * Requires VOYAGE_API_KEY in the environment. The key is read lazily at
 * call time so a missing key fails indexing with a clear message instead
 * of breaking backend startup.
 */
import { MedusaError } from "@medusajs/framework/utils"

const VOYAGE_API_URL = "https://api.voyageai.com/v1/embeddings"
const VOYAGE_MODEL = "voyage-4-large"
export const VOYAGE_DIMENSIONS = 1024

interface VoyageResponse {
  data: { embedding: number[] }[]
}

export async function voyageEmbedder(text: string): Promise<number[]> {
  const apiKey = process.env.VOYAGE_API_KEY
  if (!apiKey) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "Search indexing: VOYAGE_API_KEY must be configured to embed the " +
        "product semantic field."
    )
  }

  const input = text.trim().slice(0, 8000)
  if (!input) {
    return new Array(VOYAGE_DIMENSIONS).fill(0)
  }

  let res: Response
  try {
    res = await fetch(VOYAGE_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: VOYAGE_MODEL,
        input: [input],
      }),
    })
  } catch (e) {
    throw new MedusaError(
      MedusaError.Types.DB_ERROR,
      `Search indexing: Voyage API unreachable: ${(e as Error).message}`
    )
  }

  if (!res.ok) {
    const body = await res.text().catch(() => "")
    throw new MedusaError(
      MedusaError.Types.DB_ERROR,
      `Search indexing: Voyage API error ${res.status}: ${body.slice(0, 200)}`
    )
  }

  const json = (await res.json()) as VoyageResponse
  const embedding = json.data?.[0]?.embedding
  if (!embedding || embedding.length !== VOYAGE_DIMENSIONS) {
    throw new MedusaError(
      MedusaError.Types.DB_ERROR,
      `Search indexing: Voyage returned ${embedding?.length ?? 0} dimensions, ` +
        `expected ${VOYAGE_DIMENSIONS}.`
    )
  }
  return embedding
}
