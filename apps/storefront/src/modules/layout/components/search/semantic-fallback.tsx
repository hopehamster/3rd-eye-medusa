"use client"

import { useEffect, useState } from "react"

import { sdk } from "@lib/config"
import { Text } from "@modules/common/components/ui"
import SearchHit, { ProductHit } from "./hit"

interface VectorSearchResponse {
  results: {
    hits: {
      id: string
      score: number
      document: {
        id: string
        title: string | null
        handle: string | null
        thumbnail: string | null
      }
    }[]
  }[]
}

/**
 * When keyword search finds nothing, ask Voyage for semantically similar
 * products. Fires once per settled empty query.
 */
const SemanticFallback = ({
  query,
  onNavigate,
}: {
  query: string
  onNavigate: () => void
}) => {
  const [hits, setHits] = useState<ProductHit[] | null>(null)

  useEffect(() => {
    const q = query.trim()
    if (!q) {
      setHits(null)
      return
    }
    let cancelled = false
    setHits(null)

    sdk.client
      .fetch<VectorSearchResponse>(`/store/search`, {
        method: "POST",
        body: {
          entity: "product",
          search_options: {
            vector: { query: q.slice(0, 2000), field: "semantic" },
          },
          pagination: { take: 6 },
        },
      })
      .then((res) => {
        if (cancelled) {
          return
        }
        const items = (res.results?.[0]?.hits ?? [])
          .filter((h) => h.document?.handle)
          .map(
            (h) =>
              ({
                objectID: h.document.id,
                title: h.document.title,
                handle: h.document.handle,
                thumbnail: h.document.thumbnail,
              } as unknown as ProductHit)
          )
        setHits(items)
      })
      .catch(() => {
        if (!cancelled) {
          setHits([])
        }
      })

    return () => {
      cancelled = true
    }
  }, [query])

  if (hits === null) {
    return (
      <Text className="px-4 py-6 text-center text-ui-fg-muted">
        No exact matches — asking the Oracle&apos;s memory&hellip;
      </Text>
    )
  }

  if (hits.length === 0) {
    return (
      <Text
        className="px-4 py-6 text-center text-ui-fg-subtle"
        data-testid="search-no-results"
      >
        No products found for &quot;{query}&quot;
      </Text>
    )
  }

  return (
    <div>
      <Text className="px-4 pt-4 pb-1 text-center text-xs uppercase tracking-widest text-violet-300">
        Similar in spirit
      </Text>
      <ul className="py-2" data-testid="search-semantic-results">
        {hits.map((hit) => (
          <SearchHit key={hit.objectID} hit={hit} onNavigate={onNavigate} />
        ))}
      </ul>
    </div>
  )
}

export default SemanticFallback
