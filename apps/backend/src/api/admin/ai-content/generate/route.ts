import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { AI_CONTENT_MODULE } from "../../../../modules/ai-content"
import type AIContentService from "../../../../modules/ai-content/service"

/**
 * POST /admin/ai-content/generate
 * Body: { raw_title, raw_description?, material? }
 * Returns a draft — nothing is saved until /apply is called.
 */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const { raw_title, raw_description, material } = req.body as {
    raw_title?: string
    raw_description?: string
    material?: string
  }

  if (!raw_title?.trim()) {
    res.status(400).json({ error: "raw_title is required." })
    return
  }

  try {
    const aiContent = req.scope.resolve(AI_CONTENT_MODULE) as AIContentService
    const draft = await aiContent.generateProductContent({
      rawTitle: raw_title,
      rawDescription: raw_description,
      material,
    })
    res.json({ draft })
  } catch (e) {
    const logger = req.scope.resolve(ContainerRegistrationKeys.LOGGER)
    logger.error(`[ai-content] generate failed: ${(e as Error).message}`)
    res.status(500).json({ error: "Could not generate content. Try again." })
  }
}
