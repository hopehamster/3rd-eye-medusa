import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"

/**
 * POST /admin/cj-review/reject
 * Body: { product_id: string } or { product_ids: string[] }
 * Deletes draft products permanently.
 */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const { product_id, product_ids } = req.body as {
      product_id?: string
      product_ids?: string[]
    }

    const ids = product_ids || (product_id ? [product_id] : [])
    if (ids.length === 0) {
      res.status(400).json({ error: "No product IDs provided." })
      return
    }

    const productModule = req.scope.resolve(Modules.PRODUCT)

    // Only delete drafts (safety check - never delete published products)
    const [drafts] = await productModule.listAndCountProducts({
      id: ids,
      status: "draft",
    })

    const draftIds = drafts.map((p: any) => p.id)
    if (draftIds.length === 0) {
      res.status(400).json({ error: "No draft products found for the given IDs." })
      return
    }

    await productModule.deleteProducts(draftIds)

    res.json({ rejected: draftIds, count: draftIds.length })
  } catch (e) {
    const logger = req.scope.resolve(ContainerRegistrationKeys.LOGGER)
    logger.error("[cj-review] reject failed: " + (e as Error).message)
    res.status(500).json({ error: "Could not reject products." })
  }
}
