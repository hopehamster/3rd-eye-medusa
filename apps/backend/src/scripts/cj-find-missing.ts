import type { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { updateProductsWorkflow } from "@medusajs/medusa/core-flows"
import { CJClient } from "../modules/cj-fulfillment/cj-client"

/**
 * Find CJ products for catalogue items that carry no cj_pid.
 *
 * Only CJ products belong on this site, so anything in the catalogue without a
 * cj_pid is either one of the owner's own products (leave it) or a CJ product
 * that was imported without its link (recover it).
 *
 * Safety: a name match is only written when CJ returns EXACTLY ONE product whose
 * normalised name equals the title. Everything else is reported, never guessed —
 * linking the wrong supplier product ships the wrong item.
 *
 *   npx medusa exec ./src/scripts/cj-find-missing.ts
 *   WRITE_CJ_LINK=1 npx medusa exec ./src/scripts/cj-find-missing.ts
 */
type Row = {
  id: string
  title?: string | null
  status?: string | null
  metadata?: Record<string, unknown> | null
}

const norm = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim().replace(/\s+/g, " ")

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

export default async function cjFindMissing({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const write = process.env.WRITE_CJ_LINK === "1"

  const client = new CJClient({
    apiKey: process.env.CJ_API_KEY ?? "",
    email: process.env.CJ_EMAIL ?? "",
  })

  const searchThrottled = async (term: string) => {
    let lastErr: unknown
    for (let attempt = 1; attempt <= 5; attempt++) {
      try {
        const list = await client.searchProducts({ keyWord: term, size: 10 })
        await sleep(1200)
        return list
      } catch (e) {
        lastErr = e
        if (!/Too Many Requests|QPS|429|1600200/i.test((e as Error).message ?? "")) break
        await sleep(1500 * attempt)
      }
    }
    throw lastErr instanceof Error ? lastErr : new Error(String(lastErr))
  }

  const { data } = (await query.graph({
    entity: "product",
    fields: ["id", "title", "status", "metadata"],
    filters: { deleted_at: null },
  })) as { data: Row[] }

  const unlinked = (data ?? []).filter((p) => !p.metadata?.cj_pid)
  logger.info(`cj-find-missing: ${unlinked.length} products without cj_pid (write=${write})`)

  let exact = 0
  let ambiguous = 0
  let none = 0
  let failed = 0

  for (const product of unlinked) {
    const title = product.title ?? ""
    try {
      const results = await searchThrottled(title)
      const matches = results.filter((r) => norm(r.nameEn ?? "") === norm(title))

      if (matches.length === 1) {
        exact++
        logger.info(
          `EXACT  "${title}" -> pid=${matches[0].id} ${matches[0].nameEn} (${matches[0].sellPrice ?? "?"})`
        )
        if (write) {
          await updateProductsWorkflow(container).run({
            input: {
              selector: { id: product.id },
              update: {
                metadata: { ...(product.metadata ?? {}), cj_pid: matches[0].id },
              },
            },
          })
        }
        continue
      }

      if (results.length > 0) {
        ambiguous++
        logger.info(
          `NEAR   "${title}" -> ` +
            results
              .slice(0, 2)
              .map((r) => `${r.id}:${r.nameEn ?? "?"}`)
              .join(" | ")
        )
      } else {
        none++
        logger.info(`NO-MATCH "${title}"`)
      }
    } catch (e) {
      failed++
      logger.error(`cj-find-missing: "${title}" failed: ${(e as Error).message}`)
    }
  }

  logger.info(
    `cj-find-missing done: exact=${exact} near=${ambiguous} none=${none} failed=${failed} (write=${write})`
  )
}
