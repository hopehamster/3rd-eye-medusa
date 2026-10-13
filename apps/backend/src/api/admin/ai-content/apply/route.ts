import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { applyAiContentWorkflow } from "../../../../workflows/apply-ai-content"
import type { GeneratedContent } from "../../../../modules/ai-content/prompts"

/**
 * POST /admin/ai-content/apply
 * Body: { product_id, draft: GeneratedContent }
 * Applies the approved draft to the product via workflow. The product keeps
 * its current status — this never publishes on its own.
 */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const { product_id, draft } = req.body as {
    product_id?: string
    draft?: GeneratedContent
  }

  if (!product_id || !draft) {
    res.status(400).json({ error: "product_id and draft are required." })
    return
  }

  try {
    await applyAiContentWorkflow(req.scope).run({
      input: { product_id, draft },
    })
    res.json({ ok: true, product_id })
  } catch (e) {
    const logger = req.scope.resolve(ContainerRegistrationKeys.LOGGER)
    logger.error(`[ai-content] apply failed: ${(e as Error).message}`)
    res.status(500).json({ error: "Could not apply content to the product." })
  }
}
