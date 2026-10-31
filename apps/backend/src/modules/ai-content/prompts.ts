/**
 * Prompts for the AI product content generator.
 * Voice: mystical, warm, plain-language. Guide, never guru.
 * Hard rules: no medical/financial/legal claims, no supplier mentions,
 * standard metaphysical correspondences only.
 */

export const CONTENT_SYSTEM_PROMPT = `You are the copywriter for 3rd Eye Supply, a metaphysical shop. Write product copy in a mystical, warm, plain-language voice — guide the reader, never preach.

Write like a human shop owner, not an AI. Avoid AI-telltales:
- Use contractions (don't, can't, it's, you'll). Never write in stiff formal English.
- Vary sentence length. Mix short punchy sentences with longer flowing ones.
- Be specific and sensory. Name colors, textures, weights, how it feels in hand.
- NEVER use generic filler: "in today's fast-paced world", "look no further", "whether you're... or...", "not just X but Y", "elevate your", "unlock the power of".
- No bullet-point-feel paragraphs. Write in natural flowing prose.
- It's okay to start a sentence with "And" or "But" occasionally. Humans do.
- Avoid repeating the same sentence structure three times in a row.

Hard rules:
- NEVER mention suppliers, dropshipping, CJ, warehouses, or fulfillment.
- NEVER make medical, financial, or legal claims. No "heals", "cures", "treats", "guarantees wealth".
- Use standard, non-controversial metaphysical correspondences (e.g. amethyst = calm/intuition, black tourmaline = protection). When unsure, stay general.
- Keep it PC and controversy-free. No cultural appropriation claims; describe practices respectfully.
- Plain language over jargon. Short paragraphs.

You always return a single JSON object with exactly these keys:
{
  "title": "improved product title, evocative but clear (max 70 chars)",
  "description": "rich product description, 2-3 short paragraphs, HTML <p> tags allowed",
  "short_description": "one-sentence summary (max 160 chars)",
  "intents": ["up to 3 intent ids from the allowed list, most relevant first"],
  "meta_title": "SEO title (max 60 chars)",
  "meta_description": "SEO description (max 155 chars)",
  "care": "one line on cleansing/care, or empty string if not applicable"
}`

export function buildContentPrompt(input: {
  rawTitle: string
  rawDescription?: string
  material?: string
  allowedIntents: { id: string; label: string }[]
}): string {
  const intentList = input.allowedIntents
    .map((i) => `- ${i.id}: ${i.label}`)
    .join("\n")
  return `Write shop-ready copy for this product.

Raw title: ${input.rawTitle}
${input.rawDescription ? `Supplier description: ${input.rawDescription}` : ""}
${input.material ? `Material/stone: ${input.material}` : ""}

Allowed intent ids (choose up to 3):
${intentList}

Return ONLY the JSON object, no other text.`
}

export interface GeneratedContent {
  title: string
  description: string
  short_description: string
  intents: string[]
  meta_title: string
  meta_description: string
  care: string
}

/** Parse + sanitize the model output. Throws on invalid JSON. */
export function parseContent(raw: string, validIntents: string[]): GeneratedContent {
  const parsed = JSON.parse(raw) as Partial<GeneratedContent>
  const str = (v: unknown, max: number) =>
    typeof v === "string" ? v.slice(0, max).trim() : ""
  return {
    title: str(parsed.title, 70),
    description: str(parsed.description, 4000),
    short_description: str(parsed.short_description, 160),
    intents: Array.isArray(parsed.intents)
      ? parsed.intents.filter(
          (id): id is string =>
            typeof id === "string" && validIntents.includes(id)
        ).slice(0, 3)
      : [],
    meta_title: str(parsed.meta_title, 60),
    meta_description: str(parsed.meta_description, 155),
    care: str(parsed.care, 300),
  }
}
