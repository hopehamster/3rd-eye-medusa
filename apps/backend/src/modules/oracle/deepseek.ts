/**
 * DeepSeek client for the Oracle. OpenAI-compatible chat completions API.
 * DeepSeek is the house LLM standard — do not add another provider here.
 */
import { MedusaError } from "@medusajs/framework/utils"
import { EXPERT_PERSONAS, getExpert, type ExpertId } from "./experts"

const DEEPSEEK_API_URL = "https://api.deepseek.com/chat/completions"
const MODEL = process.env.ORACLE_MODEL || "deepseek-v4-pro"

function apiKey(): string {
  const key = process.env.DEEPSEEK_API_KEY
  if (!key) {
    throw new MedusaError(
      MedusaError.Types.UNEXPECTED_STATE,
      "DEEPSEEK_API_KEY is not set — the Oracle cannot think without it."
    )
  }
  return key
}

export interface ChatMessage {
  role: "system" | "user" | "assistant"
  content: string
}

async function chat(
  messages: ChatMessage[],
  jsonMode = false
): Promise<string> {
  const body: Record<string, unknown> = {
    model: MODEL,
    messages,
    temperature: 0.7,
  }
  if (jsonMode) {
    body.response_format = { type: "json_object" }
  }

  const res = await fetch(DEEPSEEK_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey()}`,
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const text = await res.text().catch(() => "")
    throw new MedusaError(
      MedusaError.Types.UNEXPECTED_STATE,
      `DeepSeek API error ${res.status}: ${text.slice(0, 200)}`
    )
  }

  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[]
  }
  const content = data.choices?.[0]?.message?.content
  if (!content) {
    throw new MedusaError(
      MedusaError.Types.UNEXPECTED_STATE,
      "DeepSeek returned an empty response"
    )
  }
  return content
}

/**
 * Streaming chat. Calls onToken for each text chunk as it arrives and
 * resolves with the full accumulated text. DeepSeek SSE format.
 */
export async function chatStream(
  messages: ChatMessage[],
  onToken: (token: string) => void
): Promise<string> {
  const res = await fetch(DEEPSEEK_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey()}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages,
      temperature: 0.7,
      stream: true,
    }),
  })

  if (!res.ok || !res.body) {
    const text = await res.text().catch(() => "")
    throw new MedusaError(
      MedusaError.Types.UNEXPECTED_STATE,
      `DeepSeek API error ${res.status}: ${text.slice(0, 200)}`
    )
  }

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let full = ""
  let buffer = ""

  const pump = async (): Promise<void> => {
    const { done, value } = await reader.read()
    if (done) {
      return
    }
    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split("\n")
    buffer = lines.pop() ?? ""
    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed.startsWith("data:")) {
        continue
      }
      const payload = trimmed.slice(5).trim()
      if (payload === "[DONE]") {
        continue
      }
      try {
        const data = JSON.parse(payload) as {
          choices?: { delta?: { content?: string } }[]
        }
        const token = data.choices?.[0]?.delta?.content ?? ""
        if (token) {
          full += token
          onToken(token)
        }
      } catch {
        // Partial JSON chunk — ignore, the next read completes it
      }
    }
    return pump()
  }
  await pump()
  return full
}

/** Format recent turns for prompt injection. */
export function formatHistory(
  history: { role: string; content: string }[]
): ChatMessage[] {
  return history
    .filter((m) => m.role === "user" || m.role === "expert")
    .slice(-10)
    .map((m) => ({
      role: (m.role === "expert" ? "assistant" : "user") as
        | "user"
        | "assistant",
      content: m.content.slice(0, 2000),
    }))
}

export interface Classification {
  intents: string[]
  mode: "guidance" | "knowledge"
}

const CLASSIFY_SYSTEM = `You are the intent classifier for the Oracle of 3rd Eye Supply, a metaphysical shop.
Given a visitor's message, classify it into 1-3 intents from this exact list (use the ids verbatim, never invent new ones):
protection, cleansing-purification, grounding, clarity-focus, calm-soothing, love-self, love-romantic, abundance-prosperity, intuition-third-eye, sleep-dreams, energy-chakra-balancing, grief-healing, confidence-courage, creativity-inspiration, spiritual-connection-ritual
Also choose the mode:
- "guidance" if the visitor expresses a need, feeling, or situation where a product could help
- "knowledge" if they ask a purely informational metaphysical question with no buying intent
Respond with JSON only: {"intents": ["id1", "id2"], "mode": "guidance"}`

export async function classifyQuestion(
  question: string,
  history?: { role: string; content: string }[]
): Promise<Classification> {
  // Include a hint of recent conversation so follow-ups like
  // "what about for sleep?" classify against what came before.
  const historyHint =
    history && history.length > 0
      ? `Recent conversation (for context on follow-ups):\n${history
          .slice(-4)
          .map((m) => `${m.role === "expert" ? "Guide" : "Visitor"}: ${m.content.slice(0, 300)}`)
          .join("\n")}\n---\n`
      : ""
  const raw = await chat(
    [
      { role: "system", content: CLASSIFY_SYSTEM },
      {
        role: "user",
        content: `${historyHint}Classify this visitor message: "${question}"`,
      },
    ],
    true
  )
  const parsed = JSON.parse(raw) as Partial<Classification>
  const intents = Array.isArray(parsed.intents)
    ? parsed.intents.filter((i): i is string => typeof i === "string")
    : []
  const mode = parsed.mode === "knowledge" ? "knowledge" : "guidance"
  return { intents, mode }
}

const VOICE_AND_RULES = `Voice: mystical, warm, plain-language. A guide, not a guru. Explain jargon before using it.
Hard rules:
- Never claim medical, financial, or legal outcomes. Use "traditionally associated with" / "used in ritual to support", never "cures", "treats", "will bring you money".
- Never diagnose the visitor's mental or emotional state. Reflect their words; don't label them.
- Stay PC: avoid politics and controversial topics entirely. If a question heads there, gently redirect to the metaphysical topic.
- Never mention suppliers, CJ, or dropshipping. Products are ours; shipping is our shipping.
- Never invent products, prices, or availability. Only mention products from the provided list, with their given prices.
- Keep answers 150-250 words unless the question clearly needs more.`

export interface OracleProduct {
  id: string
  title: string
  price: string
  variantId?: string | null
}

export interface GuidanceResult {
  answer: string
  picks: { product_id: string; why_it_fits: string }[]
}

export interface ComposeParams {
  question: string
  intents: string[]
  canonExcerpts: string[]
  products: OracleProduct[]
  expertId?: string
  userProfile?: Record<string, unknown>
  history?: { role: string; content: string }[]
}

function buildGuidanceSystem(params: ComposeParams): string {
  const expert = getExpert(params.expertId)
  const productList =
    params.products.length > 0
      ? params.products
          .map((p) => `- id: ${p.id} | ${p.title} (${p.price})`)
          .join("\n")
      : "(no in-stock products match right now)"
  const memoryBlock =
    params.userProfile && Object.keys(params.userProfile).length > 0
      ? `What you remember about this visitor: ${JSON.stringify(params.userProfile)}. Weave this in naturally — like a good reader would, not like a database lookup.`
      : ""

  return `${expert.identity} ${expert.voice}
Your expertise: ${expert.expertise}
${VOICE_AND_RULES}
${memoryBlock}
The visitor asked: "${params.question}"
Their needs map to: ${params.intents.join(", ")}.
Relevant reference material:
${params.canonExcerpts.join("\n---\n") || "(no reference material)"}
Products you may recommend (in stock now — use ONLY these, by id):
${productList}`
}

function sanitizePicks(
  raw: unknown,
  products: OracleProduct[]
): { product_id: string; why_it_fits: string }[] {
  const parsed = raw as {
    picks?: { product_id?: string; why_it_fits?: string }[]
  }
  const validIds = new Set(products.map((p) => p.id))
  return (Array.isArray(parsed.picks) ? parsed.picks : [])
    .filter(
      (p) =>
        typeof p?.product_id === "string" &&
        validIds.has(p.product_id) &&
        typeof p?.why_it_fits === "string"
    )
    .slice(0, 3)
    .map((p) => ({
      product_id: p.product_id as string,
      why_it_fits: p.why_it_fits as string,
    }))
}

export async function composeGuidance(
  params: ComposeParams
): Promise<GuidanceResult> {
  const system =
    buildGuidanceSystem(params) +
    `
Respond with JSON only: {"answer_markdown": string, "picks": [{"product_id": string, "why_it_fits": string}]}
The answer_markdown: a short reflection tying their words to the need, then your recommendations woven in naturally (mention each by title), then one free ritual tip they can do tonight with no purchase. If no products match, give the guidance and the free tip honestly — never force a product. Be conversational — ask a follow-up question if it feels natural, like a real guide would.
The picks array: 1-3 products, each with a one-line why_it_fits written in the VISITOR's language (their words, their need). Empty array if nothing genuinely fits.`

  const messages: ChatMessage[] = [{ role: "system", content: system }]
  if (params.history?.length) {
    messages.push(...formatHistory(params.history))
  }
  const raw = await chat(messages, true)
  const parsed = JSON.parse(raw) as { answer_markdown?: string }
  return {
    answer: parsed.answer_markdown ?? "",
    picks: sanitizePicks(parsed, params.products),
  }
}

/**
 * Stream the guidance answer as markdown (no JSON). Runs alongside
 * selectPicks — the frontend renders tokens live, product cards land after.
 */
export async function streamGuidanceAnswer(
  params: ComposeParams,
  onToken: (token: string) => void
): Promise<string> {
  const system =
    buildGuidanceSystem(params) +
    `
Write your answer in markdown (no JSON): a short reflection tying their words to the need, then your recommendations woven in naturally (mention each by title), then one free ritual tip they can do tonight with no purchase. If no products match, give the guidance and the free tip honestly — never force a product. Be conversational — ask a follow-up question if it feels natural, like a real guide would.`

  const messages: ChatMessage[] = [{ role: "system", content: system }]
  if (params.history?.length) {
    messages.push(...formatHistory(params.history))
  }
  return chatStream(messages, onToken)
}

/** Pick 1-3 products as JSON. Small, fast — runs while the answer streams. */
export async function selectPicks(
  params: ComposeParams
): Promise<{ product_id: string; why_it_fits: string }[]> {
  if (params.products.length === 0) {
    return []
  }
  const expert = getExpert(params.expertId)
  const system = `${expert.identity}
The visitor asked: "${params.question}"
Their needs map to: ${params.intents.join(", ")}.
Products in stock now (use ONLY these, by id):
${params.products.map((p) => `- id: ${p.id} | ${p.title} (${p.price})`).join("\n")}
Respond with JSON only: {"picks": [{"product_id": string, "why_it_fits": string}]}
1-3 products that genuinely fit the visitor's need, each with a one-line why_it_fits written in the VISITOR's language (their words, their need). Empty array if nothing genuinely fits — never force a product.`
  const raw = await chat([{ role: "system", content: system }], true)
  return sanitizePicks(JSON.parse(raw), params.products)
}

export async function composeKnowledge(params: {
  question: string
  intents: string[]
  canonExcerpts: string[]
  expertId?: string
  userProfile?: Record<string, unknown>
  history?: { role: string; content: string }[]
}): Promise<string> {
  const expert = getExpert(params.expertId)
  const memoryBlock =
    params.userProfile && Object.keys(params.userProfile).length > 0
      ? `What you remember about this visitor: ${JSON.stringify(params.userProfile)}. Weave this in naturally — like a good reader would, not like a database lookup.`
      : ""
  const system = `${expert.identity} ${expert.voice}
Your expertise: ${expert.expertise}
${VOICE_AND_RULES}
${memoryBlock}
The visitor asked a knowledge question: "${params.question}"
Related topics: ${params.intents.join(", ")}.
Reference material (ground your answer here; where it is silent you may use general metaphysical knowledge, but present that as general knowledge, not canon):
${params.canonExcerpts.join("\n---\n") || "(no reference material — answer from general metaphysical knowledge)"}
Write the answer in markdown: definition first, then correspondences, then a short practical how-to. End with at most one gentle bridge to practice ("If you want to work with this practically...") — no product names, no selling. Be conversational — this is a dialogue, not a lecture.`

  const messages: ChatMessage[] = [{ role: "system", content: system }]
  if (params.history?.length) {
    messages.push(...formatHistory(params.history))
  }
  return chat(messages)
}

/** Streaming variant of composeKnowledge. */
export async function streamKnowledgeAnswer(
  params: {
    question: string
    intents: string[]
    canonExcerpts: string[]
    expertId?: string
    userProfile?: Record<string, unknown>
    history?: { role: string; content: string }[]
  },
  onToken: (token: string) => void
): Promise<string> {
  const expert = getExpert(params.expertId)
  const memoryBlock =
    params.userProfile && Object.keys(params.userProfile).length > 0
      ? `What you remember about this visitor: ${JSON.stringify(params.userProfile)}. Weave this in naturally — like a good reader would, not like a database lookup.`
      : ""
  const system = `${expert.identity} ${expert.voice}
Your expertise: ${expert.expertise}
${VOICE_AND_RULES}
${memoryBlock}
The visitor asked a knowledge question: "${params.question}"
Related topics: ${params.intents.join(", ")}.
Reference material (ground your answer here; where it is silent you may use general metaphysical knowledge, but present that as general knowledge, not canon):
${params.canonExcerpts.join("\n---\n") || "(no reference material — answer from general metaphysical knowledge)"}
Write the answer in markdown: definition first, then correspondences, then a short practical how-to. End with at most one gentle bridge to practice ("If you want to work with this practically...") — no product names, no selling. Be conversational — this is a dialogue, not a lecture.`

  const messages: ChatMessage[] = [{ role: "system", content: system }]
  if (params.history?.length) {
    messages.push(...formatHistory(params.history))
  }
  return chatStream(messages, onToken)
}

/**
 * Extract memorable facts from a consultation to update the user's profile.
 * Runs as a background job after the consultation — never blocks the response.
 * Returns a flat object of facts/preferences worth remembering, or empty object.
 */
export async function extractMemorableFacts(params: {
  question: string
  answer: string
  expertId?: string
  currentProfile: Record<string, unknown>
}): Promise<Record<string, unknown>> {
  const expert = getExpert(params.expertId)
  const system = `You are helping ${expert.name}, ${expert.title} at 3rd Eye Supply, remember their customer.
Current profile: ${JSON.stringify(params.currentProfile) || "(empty)"}
Recent exchange:
Visitor: "${params.question}"
${expert.name}: "${params.answer.slice(0, 1000)}"
Extract NEW facts, preferences, or context worth remembering for future conversations. Focus on: stone/crystal preferences, intentions they care about, life context they shared, what resonated.
Respond with JSON only: flat object like {"favorite_stone": "amethyst", "seeking": "better sleep"}. Empty object {} if nothing new worth keeping. Never store sensitive personal data (full names, addresses, health details).`

  try {
    const raw = await chat([{ role: "system", content: system }], true)
    const parsed = JSON.parse(raw) as Record<string, unknown>
    // Sanitize: only keep string/number/boolean values, drop anything suspicious
    const clean: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(parsed)) {
      if (
        typeof k === "string" &&
        k.length < 50 &&
        ["string", "number", "boolean"].includes(typeof v)
      ) {
        clean[k] = v
      }
    }
    return clean
  } catch {
    return {}
  }
}
