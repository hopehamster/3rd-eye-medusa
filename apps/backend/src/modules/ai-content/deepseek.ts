/**
 * Minimal DeepSeek chat client for the AI content module.
 * (Kept module-local so ai-content stays self-contained.)
 */

import { MedusaError } from "@medusajs/framework/utils"

const DEEPSEEK_API_URL = "https://api.deepseek.com/chat/completions"
const MODEL = process.env.AI_CONTENT_MODEL || "deepseek-v4-pro"

export interface ChatMessage {
  role: "system" | "user"
  content: string
}

export async function chatComplete(
  messages: ChatMessage[],
  opts: { json?: boolean; maxTokens?: number } = {}
): Promise<string> {
  const apiKey = process.env.DEEPSEEK_API_KEY
  if (!apiKey) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "AI content: DEEPSEEK_API_KEY must be configured."
    )
  }

  const res = await fetch(DEEPSEEK_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages,
      max_tokens: opts.maxTokens ?? 1500,
      temperature: 0.7,
      ...(opts.json ? { response_format: { type: "json_object" } } : {}),
    }),
  })

  if (!res.ok) {
    const text = await res.text().catch(() => "")
    throw new MedusaError(
      MedusaError.Types.DB_ERROR,
      `AI content: DeepSeek error ${res.status}: ${text.slice(0, 200)}`
    )
  }

  const body = (await res.json()) as {
    choices?: { message?: { content?: string } }[]
  }
  const content = body.choices?.[0]?.message?.content
  if (!content) {
    throw new MedusaError(
      MedusaError.Types.DB_ERROR,
      "AI content: empty response from DeepSeek."
    )
  }
  return content
}
