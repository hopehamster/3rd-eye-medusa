import type { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { updateProductsWorkflow } from "@medusajs/medusa/core-flows"
import { CJClient } from "../modules/cj-fulfillment/cj-client"

/**
 * Fill products from CJ's own data.
 *
 * Only CJ products belong on this site (the owner has his own products but does
 * not sell them here). Products linked to a supplier carry metadata.cj_pid, and
 * CJ's /product/query returns nameEn, description, bigImage and images[] — so a
 * CJ product should arrive with its photography and copy already on it.
 *
 * Report mode by default; WRITE_CJ_MEDIA=1 applies. Products that gain a real
 * image and are still drafts get published in the same pass.
 *
 *   npx medusa exec ./src/scripts/cj-sync-product-media.ts
 *   WRITE_CJ_MEDIA=1 npx medusa exec ./src/scripts/cj-sync-product-media.ts
 */
type Row = {
  id: string
  title?: string | null
  description?: string | null
  thumbnail?: string | null
  status?: string | null
  metadata?: Record<string, unknown> | null
  images?: { id: string; url: string }[] | null
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

export default async function cjSyncProductMedia({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const write = process.env.WRITE_CJ_MEDIA === "1"

  const client = new CJClient({
    apiKey: process.env.CJ_API_KEY ?? "",
    email: process.env.CJ_EMAIL ?? "",
  })

  /** CJ enforces 1 request/second and answers 1600200 otherwise. */
  const getProductThrottled = async (pid: string) => {
    let lastErr: unknown
    for (let attempt = 1; attempt <= 5; attempt++) {
      try {
        const detail = await client.getProduct(pid)
        await sleep(1200)
        return detail
      } catch (e) {
        lastErr = e
        const msg = (e as Error).message ?? ""
        if (!/Too Many Requests|QPS|429|1600200/i.test(msg)) break
        await sleep(1500 * attempt)
      }
    }
    throw lastErr instanceof Error ? lastErr : new Error(String(lastErr))
  }

  const { data } = (await query.graph({
    entity: "product",
    fields: [
      "id",
      "title",
      "description",
      "thumbnail",
      "status",
      "metadata",
      "images.id",
      "images.url",
    ],
  })) as { data: Row[] }

  const linked = (data ?? []).filter((p) => p.metadata?.cj_pid)
  const unlinked = (data ?? []).filter((p) => !p.metadata?.cj_pid)
  logger.info(
    `cj-sync-product-media: ${linked.length} CJ-linked, ${unlinked.length} non-CJ on the site (write=${write})`
  )

  let filled = 0
  let published = 0
  let skipped = 0
  let failed = 0

  for (const product of linked) {
    const pid = String(product.metadata?.cj_pid)
    try {
      const detail = await getProductThrottled(pid)

      const cjImages = [detail.bigImage, ...(detail.images ?? [])]
        .filter((u): u is string => typeof u === "string" && u.length > 0)
        .map((u) => (u.startsWith("//") ? `https:${u}` : u))
        .map((u) => u.replace(/^http:\/\//, "https://"))
      const unique = Array.from(new Set(cjImages))

      if (unique.length === 0) {
        logger.warn(`cj-sync-product-media: CJ has no images for ${product.title} (${pid})`)
        skipped++
        continue
      }

      const existing = new Set((product.images ?? []).map((i) => i.url))
      const newImages = unique.filter((u) => !existing.has(u))
      const needsThumb = !product.thumbnail
      const needsDesc = !product.description && !!detail.description
      const isDraft = product.status !== "published"

      if (!needsThumb && newImages.length === 0 && !needsDesc) {
        skipped++
        continue
      }

      const willPublish = isDraft
      filled++
      if (willPublish) published++

      if (!write) {
        logger.info(
          `[report] ${product.title}: +${newImages.length} images, desc=${needsDesc ? "yes" : "no"}, publish=${willPublish}`
        )
        continue
      }

      await updateProductsWorkflow(container).run({
        input: {
          selector: { id: product.id },
          update: {
            ...(needsDesc ? { description: detail.description } : {}),
            ...(needsThumb ? { thumbnail: unique[0] } : {}),
            ...(newImages.length
              ? {
                  images: [
                    ...(product.images ?? []).map((i) => ({ url: i.url })),
                    ...newImages.map((url) => ({ url })),
                  ],
                }
              : {}),
            ...(willPublish ? { status: "published" } : {}),
          },
        },
      })
      logger.info(`cj-sync-product-media: updated ${product.title}`)
    } catch (e) {
      failed++
      logger.error(`cj-sync-product-media: ${product.title} failed: ${(e as Error).message}`)
    }
  }

  logger.info(
    `cj-sync-product-media done: filled=${filled} publish=${published} skipped=${skipped} failed=${failed}`
  )
}
