/**
 * apply-ai-content workflow.
 * Applies an approved AI content draft to a product.
 */
import {
  createStep,
  createWorkflow,
  StepResponse,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { Modules } from "@medusajs/framework/utils"
import type { IProductModuleService } from "@medusajs/framework/types"
import type { GeneratedContent } from "../modules/ai-content/prompts"

interface ApplyInput {
  product_id: string
  draft: GeneratedContent
}

const applyContentStep = createStep(
  "apply-content",
  async ({ product_id, draft }: ApplyInput, { container }) => {
    const productModule = container.resolve<IProductModuleService>(
      Modules.PRODUCT
    )

    await productModule.updateProducts(product_id, {
      title: draft.title || undefined,
      description: draft.description || undefined,
      metadata: {
        intents: draft.intents,
        meta_title: draft.meta_title,
        meta_description: draft.meta_description,
        care: draft.care,
        ai_content_applied: new Date().toISOString(),
      },
    })

    return new StepResponse({ product_id })
  }
)

export const applyAiContentWorkflow = createWorkflow(
  "apply-ai-content",
  (input: ApplyInput) => {
    const result = applyContentStep(input)
    return new WorkflowResponse(result)
  }
)
