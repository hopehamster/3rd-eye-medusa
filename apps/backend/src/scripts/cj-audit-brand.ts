import type { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { deleteProductsWorkflow } from "@medusajs/medusa/core-flows"
import { qualifiesBrand } from "./lib/cj-brand"

/**
 * Remove imported products that are not wellness / metaphysical.
 *
 * The importer filters on CJ's search name, which sometimes differs from the
 * product's real name, so off-brand rows (lip liner, disposable tableware) can
 * still land. This audits every CJ-linked product by its actual title.
 *
 * Report by default; WRITE_CJ_AUDIT=1 applies.
 */
type Row = { id: string; title?: string | null; metadata?: Record<string, unknown> | null }

export default async function cjAuditBrand({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const write = process.env.WRITE_CJ_AUDIT === "1"

  const { data } = (await query.graph({
    entity: "product",
    fields: ["id", "title", "metadata"],
    filters: { deleted_at: null },
  })) as { data: Row[] }

  const linked = (data ?? []).filter((p) => p.metadata?.cj_pid)
  const offBrand = linked.filter((p) => !qualifiesBrand(p.title ?? ""))

  logger.info(
    `cj-audit-brand: ${offBrand.length} off-brand of ${linked.length} CJ products (write=${write})`
  )
  if (offBrand.length === 0) return
  if (!write) {
    logger.info("[report] " + offBrand.map((p) => p.title).slice(0, 10).join(" | "))
    return
  }

  await deleteProductsWorkflow(container).run({ input: { ids: offBrand.map((p) => p.id) } })
  logger.info(`cj-audit-brand: deleted ${offBrand.length} off-brand products`)
}
