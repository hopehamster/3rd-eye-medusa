/**
 * Map Medusa product variants to CJ variant ids (metadata.cj_vid).
 *
 * The CJ fulfilment provider refuses any line item whose variant has no
 * cj_vid, and 0 of 43 products had one — so the provider could never fulfil
 * anything, which is why both shipping options still point at manual_manual.
 *
 * Products carry metadata.cj_pid (the CJ product id), so the link can be
 * resolved by asking CJ for that product's variants.
 *
 * Safety rule: only auto-write when CJ reports EXACTLY ONE variant for a
 * product — that is unambiguous. Products with several variants are reported
 * and skipped, because guessing the wrong variant ships the wrong item.
 *
 *   npx medusa exec ./src/scripts/map-cj-vids.ts            # report only
 *   WRITE_CJ_VID=1 npx medusa exec ./src/scripts/map-cj-vids.ts
 */
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { updateProductVariantsWorkflow } from "@medusajs/medusa/core-flows"
import type { ExecArgs } from "@medusajs/framework/types"
import { CJClient } from "../modules/cj-fulfillment/cj-client"

type Row = {
  id: string
  handle?: string | null
  metadata?: Record<string, unknown> | null
  variants?: { id: string; metadata?: Record<string, unknown> | null }[] | null
}

export default async function mapCjVids({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const write = process.env.WRITE_CJ_VID === "1"

  const client = new CJClient({
    apiKey: process.env.CJ_API_KEY ?? "",
    email: process.env.CJ_EMAIL ?? "",
  })

  const { data } = (await query.graph({
    entity: "product",
    fields: ["id", "handle", "metadata", "variants.id", "variants.metadata"],
  })) as { data: Row[] }

  const candidates = (data ?? []).filter((p) => p.metadata?.cj_pid)
  logger.info(`map-cj-vids: ${candidates.length} products have a cj_pid (write=${write})`)

  let single = 0
  let multi = 0
  let none = 0
  let failed = 0
  const updates: { id: string; metadata: Record<string, unknown> }[] = []

  // CJ allows 1 request/second (/product/query returns 1600200 otherwise), so
  // every lookup is throttled and retried with backoff.
  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))
  const getProductThrottled = async (pid: string) => {
    let lastErr: unknown
    for (let attempt = 1; attempt <= 4; attempt++) {
      try {
        const detail = await client.getProduct(pid)
        await sleep(1100)
        return detail
      } catch (e) {
        lastErr = e
        const msg = (e as Error).message ?? ""
        if (!/Too Many Requests|QPS|429/i.test(msg)) break
        await sleep(1200 * attempt)
      }
    }
    throw lastErr instanceof Error ? lastErr : new Error(String(lastErr))
  }

  for (const product of candidates) {
    const pid = String(product.metadata?.cj_pid)
    try {
      const detail = await getProductThrottled(pid)
      const cjVariants = (detail.variants ?? []).filter((v) => v.vid)

      if ((product.variants ?? []).every((v) => v.metadata?.cj_vid)) {
        continue
      }

      if (cjVariants.length === 1) {
        single++
        for (const v of product.variants ?? []) {
          updates.push({
            id: v.id,
            metadata: { ...(v.metadata ?? {}), cj_vid: cjVariants[0].vid },
          })
        }
        logger.info(`  ${product.handle}: single CJ variant ${cjVariants[0].vid}`)
      } else if (cjVariants.length === 0) {
        none++
        logger.warn(`  ${product.handle}: CJ returned no variants for pid ${pid}`)
      } else if (process.env.ALLOW_MULTI === "1") {
        // Owner decision: ship first, correct later. Every choice is logged with
        // the variant name so a wrong one can be spotted and fixed without
        // hunting through the CJ dashboard.
        multi++
        const chosen = cjVariants[0]
        for (const v of product.variants ?? []) {
          updates.push({
            id: v.id,
            metadata: { ...(v.metadata ?? {}), cj_vid: chosen.vid },
          })
        }
        logger.info(
          `  ${product.handle}: auto-picked 1 of ${cjVariants.length} CJ variants -> ` +
            `${chosen.vid} (${chosen.variantNameEn ?? chosen.variantSku ?? "unnamed"})`
        )
      } else {
        multi++
        logger.info(
          `  ${product.handle}: CJ has ${cjVariants.length} variants — needs manual mapping`
        )
      }
    } catch (e) {
      failed++
      logger.warn(`  ${product.handle}: CJ lookup failed — ${(e as Error).message}`)
    }
  }

  logger.info(
    `map-cj-vids: single=${single} multi=${multi} no-variant=${none} failed=${failed} updates=${updates.length}`
  )

  if (!write) {
    logger.info("map-cj-vids: report only. Re-run with WRITE_CJ_VID=1 to apply.")
    return
  }
  if (updates.length === 0) {
    logger.info("map-cj-vids: nothing to write")
    return
  }

  for (let i = 0; i < updates.length; i += 20) {
    const chunk = updates.slice(i, i + 20)
    await updateProductVariantsWorkflow(container).run({
      input: { product_variants: chunk },
    })
    logger.info(`map-cj-vids: wrote ${Math.min(i + 20, updates.length)}/${updates.length}`)
  }
  logger.info("map-cj-vids: done")
}
