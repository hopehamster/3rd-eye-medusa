/**
 * Rebuild the product search index.
 *
 *   npx medusa exec ./src/scripts/reindex-search.ts
 *
 * Needed after changing prices (or any product data) with raw SQL: direct
 * writes emit no product events, so the index keeps stale per-currency price
 * fields until something rebuilds it.
 *
 * CAVEAT: reindexSearchIndexesWorkflow runs the rebuild as a background job in
 * the calling process. Through `medusa exec` that process exits immediately and
 * kills the job — it logs "submitted" and nothing happens. Run this from a
 * long-lived context (a job/subscriber/route in the server), not from exec. The
 * EUR backfill was therefore applied by updating the index documents directly.
 */
import { reindexSearchIndexesWorkflow } from "@medusajs/medusa/core-flows"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import type { ExecArgs } from "@medusajs/framework/types"

export default async function reindexSearch({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  logger.info("reindex-search: rebuilding the product index…")
  const { result } = await reindexSearchIndexesWorkflow(container).run({
    input: { index: "product" },
  })
  logger.info(`reindex-search: submitted ${JSON.stringify(result)}`)
}
