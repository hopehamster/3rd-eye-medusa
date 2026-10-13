/**
 * AI product content generator.
 *
 * Generates shop-ready copy for products (titles, descriptions, SEO fields,
 * intent tags) via DeepSeek. Nothing is published automatically — the admin
 * UI reviews every draft and applies it explicitly.
 *
 * Intent tags use the Oracle's 15-intent taxonomy so search, the Oracle,
 * and collections all speak the same language.
 */
import { MedusaError } from "@medusajs/framework/utils"
import type { Logger } from "@medusajs/framework/types"
import { chatComplete } from "./deepseek"
import {
  CONTENT_SYSTEM_PROMPT,
  buildContentPrompt,
  parseContent,
  type GeneratedContent,
} from "./prompts"
import { ORACLE_INTENTS } from "../oracle/taxonomy"

type InjectedDependencies = {
  logger: Logger
}

export interface GenerateInput {
  rawTitle: string
  rawDescription?: string
  material?: string
}

class AIContentService {
  protected logger_: Logger

  constructor({ logger }: InjectedDependencies) {
    this.logger_ = logger
  }

  /**
   * Generate draft copy for a product. Returns the draft — the caller
   * decides whether to apply it.
   */
  async generateProductContent(
    input: GenerateInput
  ): Promise<GeneratedContent> {
    if (!input.rawTitle?.trim()) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "AI content: rawTitle is required."
      )
    }

    const raw = await chatComplete(
      [
        { role: "system", content: CONTENT_SYSTEM_PROMPT },
        {
          role: "user",
          content: buildContentPrompt({
            ...input,
            allowedIntents: ORACLE_INTENTS.map((i) => ({
              id: i.id,
              label: i.name,
            })),
          }),
        },
      ],
      { json: true, maxTokens: 1500 }
    )

    let content: GeneratedContent
    try {
      content = parseContent(
        raw,
        ORACLE_INTENTS.map((i) => i.id)
      )
    } catch {
      throw new MedusaError(
        MedusaError.Types.DB_ERROR,
        "AI content: the model returned invalid JSON. Try again."
      )
    }

    this.logger_.info(
      `AI content: generated draft for "${input.rawTitle}" ` +
        `(intents: ${content.intents.join(", ") || "none"})`
    )
    return content
  }
}

export default AIContentService
