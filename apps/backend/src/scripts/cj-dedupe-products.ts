import type { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { deleteProductsWorkflow } from "@medusajs/medusa/core-flows"

/**
 * Remove duplicate CJ imports.
 *
 * CJ lists product families as separate products with near-identical English
 * names, so an import can create the same bracelet several times. This keeps the
 * oldest row per normalised title and deletes the rest (the CJ source is
 * untouched, so nothing is lost upstream).
 *
 * Report by default; WRITE_CJ_DEDUPE=1 applies.
 */
type Row = {
  id: string
  title?: string | null
  created_at?: string | null
  metadata?: Record<string, unknown> | null
}

const key = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim()

export default async function cjDedupeProducts({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const write = process.env.WRITE_CJ_DEDUPE === "1"

  const { data } = (await query.graph({
    entity: "product",
    fields: ["id", "title", "created_at", "metadata"],
    filters: { deleted_at: null },
  })) as { data: Row[] }

  const groups = new Map<string, Row[]>()
  for (const p of data ?? []) {
    if (!p.metadata?.cj_imported_at) continue // only touch imported rows
    const k = key(p.title ?? "")
    if (!k) continue
    const list = groups.get(k) ?? []
    list.push(p)
    groups.set(k, list)
  }

  const doomed: Row[] = []
  for (const [, list] of groups) {
    if (list.length < 2) continue
    list.sort((a, b) => String(a.created_at).localeCompare(String(b.created_at)))
    doomed.push(...list.slice(1))
  }

  logger.info(
    `cj-dedupe-products: ${doomed.length} duplicates across ${[...groups.values()].filter((l) => l.length > 1).length} titles (write=${write})`
  )
  if (doomed.length === 0) return
  if (!write) {
    logger.info("[report] would delete: " + doomed.map((p) => p.title).slice(0, 8).join(" | "))
    return
  }

  await deleteProductsWorkflow(container).run({ input: { ids: doomed.map((p) => p.id) } })
  logger.info(`cj-dedupe-products: deleted ${doomed.length} duplicates`)
}
