import type { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import {
  deleteProductsWorkflow,
  updateProductsWorkflow,
} from "@medusajs/medusa/core-flows"

/**
 * Keep this site to CJ products only.
 *
 * The owner has products of his own but does not sell them here, and Medusa's
 * seed apparel is demo data that never belonged in the catalogue. Anything
 * without metadata.cj_pid therefore must not be live:
 *
 *   - Medusa's seed apparel  -> deleted (demo data, not the owner's)
 *   - everything else non-CJ -> forced to draft and tagged metadata.channel=owner
 *
 * Report by default; WRITE_CURATE=1 applies.
 *
 *   npx medusa exec ./src/scripts/catalogue-curate.ts
 *   WRITE_CURATE=1 npx medusa exec ./src/scripts/catalogue-curate.ts
 */
const SEED_TITLES = [
  "Medusa T-Shirt",
  "Medusa Shorts",
  "Medusa Sweatshirt",
  "Medusa Sweatpants",
]

type Row = {
  id: string
  title?: string | null
  status?: string | null
  metadata?: Record<string, unknown> | null
}

export default async function catalogueCurate({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const write = process.env.WRITE_CURATE === "1"

  const { data } = (await query.graph({
    entity: "product",
    fields: ["id", "title", "status", "metadata"],
  })) as { data: Row[] }

  const products = data ?? []
  const seed = products.filter(
    (p) => !p.metadata?.cj_pid && SEED_TITLES.includes(p.title ?? "")
  )
  const others = products.filter(
    (p) => !p.metadata?.cj_pid && !SEED_TITLES.includes(p.title ?? "")
  )
  const liveNonCj = others.filter((p) => p.status === "published")

  logger.info(
    `catalogue-curate: ${seed.length} seed products to delete, ${others.length} owner products to hold as draft (${liveNonCj.length} currently live), write=${write}`
  )

  if (!write) {
    logger.info("[report] delete: " + seed.map((p) => p.title).join(" | "))
    logger.info(
      "[report] draft+tag: " + others.map((p) => `${p.title}(${p.status})`).join(" | ")
    )
    return
  }

  if (seed.length > 0) {
    await deleteProductsWorkflow(container).run({
      input: { ids: seed.map((p) => p.id) },
    })
    logger.info(`catalogue-curate: deleted ${seed.length} seed products`)
  }

  for (const p of others) {
    await updateProductsWorkflow(container).run({
      input: {
        selector: { id: p.id },
        update: {
          status: "draft",
          metadata: { ...(p.metadata ?? {}), channel: "owner" },
        },
      },
    })
  }
  logger.info(
    `catalogue-curate: ${others.length} owner products held as draft (channel=owner)`
  )
}
