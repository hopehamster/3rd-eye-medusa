/**
 * AI content module: DeepSeek-powered product copy generation.
 * Drafts are reviewed in admin before anything is applied.
 */
import { Module } from "@medusajs/framework/utils"
import AIContentService from "./service"

export const AI_CONTENT_MODULE = "ai_content"

export default Module(AI_CONTENT_MODULE, {
  service: AIContentService,
})
