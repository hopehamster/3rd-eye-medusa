"use client"

import { useEffect, useRef, useState } from "react"
import { sdk } from "@lib/config"
import { addToCart } from "@lib/data/cart"

interface Pick {
  product_id: string
  why_it_fits: string
}

interface ProductInfo {
  id: string
  title: string
  price: string
  thumbnail: string | null
  handle: string
  variantId?: string | null
}

interface OracleResponse {
  answer: string
  picks: Pick[]
  products: ProductInfo[]
  intents: string[]
  mode: "guidance" | "knowledge"
  logId: string | null
}

interface Message {
  role: "user" | "oracle"
  text: string
  picks?: (Pick & { product?: ProductInfo })[]
  logId?: string | null
  feedback?: boolean | null
}

const OPENERS = [
  "I need protection for my home",
  "I've been feeling scattered lately",
  "Help me sleep better",
  "I want to attract abundance",
  "Teach me about moon phases",
]

/** Minimal markdown-lite: paragraphs + **bold**. */
function renderMarkdown(text: string) {
  return text.split(/\n\n+/).map((para, i) => {
    const parts = para.split(/(\*\*[^*]+\*\*)/g)
    return (
      <p key={i} className="mb-3 last:mb-0 leading-relaxed">
        {parts.map((part, j) =>
          part.startsWith("**") && part.endsWith("**") ? (
            <strong key={j} className="text-amber-200 font-semibold">
              {part.slice(2, -2)}
            </strong>
          ) : (
            <span key={j}>{part}</span>
          )
        )}
      </p>
    )
  })
}

function ProductCard({
  pick,
  countryCode,
}: {
  pick: Pick & { product?: ProductInfo }
  countryCode: string
}) {
  const [added, setAdded] = useState(false)
  const [adding, setAdding] = useState(false)
  const product = pick.product

  const handleAdd = async () => {
    if (!product?.variantId || adding || added) {
      return
    }
    setAdding(true)
    try {
      await addToCart({
        variantId: product.variantId,
        quantity: 1,
        countryCode,
      })
      setAdded(true)
    } catch {
      // cart errors surface on the cart page; keep the chat calm
    } finally {
      setAdding(false)
    }
  }

  return (
    <div className="mt-3 rounded-xl border border-purple-400/20 bg-purple-950/40 p-3 flex gap-3">
      {product?.thumbnail && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={product.thumbnail}
          alt={product.title}
          className="w-16 h-16 rounded-lg object-cover shrink-0"
        />
      )}
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <p className="text-sm font-medium text-purple-100 truncate">
            {product?.title ?? "A piece from the collection"}
          </p>
          {product?.price && (
            <p className="text-sm text-amber-200 shrink-0">{product.price}</p>
          )}
        </div>
        <p className="text-xs text-purple-300/80 mt-1 leading-relaxed">
          {pick.why_it_fits}
        </p>
        {product?.variantId && (
          <button
            onClick={handleAdd}
            disabled={adding || added}
            className="mt-2 text-xs px-3 py-1.5 rounded-full border border-amber-200/30 text-amber-200 hover:bg-amber-200/10 transition disabled:opacity-50"
          >
            {added ? "Added to your bag" : adding ? "Adding…" : "Add to bag"}
          </button>
        )}
      </div>
    </div>
  )
}

const EXPERTS = [
  {
    id: "crystal",
    label: "Sage · Crystal Guide",
    greeting:
      "Hey, I'm Sage. I help people find the right stones — whether you know exactly what you need or you're just starting to get curious. What's on your mind?",
  },
  {
    id: "tarot",
    label: "Luna · Tarot Reader",
    greeting:
      "Hey, I'm Luna. I read tarot — not to tell you the future, but to help you see your present more clearly. What's weighing on you? Or want me to pull some cards and see what comes up?",
  },
  {
    id: "numerology",
    label: "Theo · Numerologist",
    greeting:
      "Hey, I'm Theo. I work with numbers — life path, personal cycles, timing. Everything has a rhythm, and once you see yours, decisions get easier. What's your birth date? Or just tell me what's on your mind.",
  },
  {
    id: "general",
    label: "Oracle · General Guide",
    greeting:
      "Welcome, seeker. What brings you to the Oracle today? Speak plainly — a feeling, a question, a need — and I will guide you.",
  },
]

function greetingFor(id: string): string {
  return EXPERTS.find((e) => e.id === id)?.greeting ?? EXPERTS[0].greeting
}

export default function OracleChat({
  countryCode,
  initialQuestion,
}: {
  countryCode: string
  initialQuestion?: string
}) {
  const [expertId, setExpertId] = useState<string>("crystal")
  const [messages, setMessages] = useState<Message[]>([
    { role: "oracle", text: greetingFor("crystal") },
  ])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [knowledgeOnly, setKnowledgeOnly] = useState(false)
  const initialSent = useRef(false)
  const sessionId = useRef(
    `oracle-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  )
  const bottomRef = useRef<HTMLDivElement>(null)

  const scrollDown = () => {
    requestAnimationFrame(() =>
      bottomRef.current?.scrollIntoView({ behavior: "smooth" })
    )
  }

  const sendFeedback = async (index: number, helpful: boolean) => {
    const msg = messages[index]
    if (!msg?.logId || msg.feedback !== undefined) {
      return
    }
    setMessages((m) =>
      m.map((mm, i) => (i === index ? { ...mm, feedback: helpful } : mm))
    )
    try {
      await sdk.client.fetch(`/store/oracle/feedback`, {
        method: "POST",
        body: { logId: msg.logId, helpful },
      })
    } catch {
      // best-effort; the UI already reflects the tap
    }
  }

  const ask = async (question: string) => {
    const q = question.trim()
    if (!q || loading) {
      return
    }
    setMessages((m) => [...m, { role: "user", text: q }])
    setInput("")
    setLoading(true)
    scrollDown()

    try {
      const res = await sdk.client.fetch<OracleResponse>(`/store/oracle/ask`, {
        method: "POST",
        body: {
          question: knowledgeOnly ? `[knowledge only] ${q}` : q,
          sessionId: sessionId.current,
          expertId,
        },
      })
      const productById = new Map(res.products.map((p) => [p.id, p]))
      setMessages((m) => [
        ...m,
        {
          role: "oracle",
          text: res.answer,
          logId: res.logId,
          picks: res.picks.map((pick) => ({
            ...pick,
            product: productById.get(pick.product_id),
          })),
        },
      ])
    } catch {
      setMessages((m) => [
        ...m,
        {
          role: "oracle",
          text: "The veil is thick right now — I couldn't quite hear you. Try asking again in a moment.",
        },
      ])
    } finally {
      setLoading(false)
      scrollDown()
    }
  }

  // Auto-send the quiz-compiled question once, on mount.
  useEffect(() => {
    if (initialQuestion && !initialSent.current) {
      initialSent.current = true
      const t = setTimeout(() => ask(initialQuestion), 300)
      return () => clearTimeout(t)
    }
  }, [initialQuestion])

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-3">
        <div className="flex gap-2 flex-wrap">
          {EXPERTS.map((expert) => (
            <button
              key={expert.id}
              onClick={() => {
                setExpertId(expert.id)
                setMessages([{ role: "oracle", text: expert.greeting }])
              }}
              className={`text-xs px-3 py-1.5 rounded-full border transition ${
                expertId === expert.id
                  ? "border-amber-200/50 bg-amber-200/10 text-amber-200"
                  : "border-purple-400/20 text-purple-300/60 hover:border-purple-400/40"
              }`}
            >
              {expert.label}
            </button>
          ))}
        </div>
        <label className="inline-flex items-center gap-2 text-xs text-purple-300/80 cursor-pointer">
          <input
            type="checkbox"
            checked={knowledgeOnly}
            onChange={(e) => setKnowledgeOnly(e.target.checked)}
            className="accent-purple-400"
          />
          Knowledge only
        </label>
      </div>

      <div className="rounded-2xl border border-purple-400/20 bg-[#150b26]/80 p-4 min-h-[50vh] flex flex-col">
        <div className="flex-1 space-y-4 overflow-y-auto">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${
                msg.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${
                  msg.role === "user"
                    ? "bg-purple-600/40 text-purple-50"
                    : "bg-purple-950/60 text-purple-100/90 border border-purple-400/10"
                }`}
              >
                {msg.role === "oracle" ? (
                  <>
                    {renderMarkdown(msg.text)}
                    {msg.picks?.map((pick) => (
                      <ProductCard
                        key={pick.product_id}
                        pick={pick}
                        countryCode={countryCode}
                      />
                    ))}
                    {msg.logId && msg.feedback === undefined && (
                      <div className="flex gap-2 mt-3 text-xs text-purple-300/60">
                        <span>Was this helpful?</span>
                        <button
                          onClick={() => sendFeedback(i, true)}
                          className="hover:text-green-300 transition"
                          aria-label="Helpful"
                        >
                          Helpful
                        </button>
                        <button
                          onClick={() => sendFeedback(i, false)}
                          className="hover:text-red-300 transition"
                          aria-label="Not helpful"
                        >
                          Not helpful
                        </button>
                      </div>
                    )}
                    {msg.feedback !== undefined && (
                      <p className="mt-3 text-xs text-purple-300/50">
                        Thanks for the feedback.
                      </p>
                    )}
                  </>
                ) : (
                  msg.text
                )}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div
                className="rounded-2xl px-4 py-3 bg-purple-950/60 border border-purple-400/10 flex items-center gap-1.5"
                role="status"
                aria-label="Oracle is thinking"
              >
                <span className="w-2 h-2 rounded-full bg-purple-300/70 animate-bounce [animation-delay:-0.3s]" />
                <span className="w-2 h-2 rounded-full bg-purple-300/70 animate-bounce [animation-delay:-0.15s]" />
                <span className="w-2 h-2 rounded-full bg-purple-300/70 animate-bounce" />
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {messages.length <= 1 && (
          <div className="flex flex-wrap gap-2 mt-4">
            {OPENERS.map((opener) => (
              <button
                key={opener}
                onClick={() => ask(opener)}
                disabled={loading}
                className="text-xs px-3 py-1.5 rounded-full border border-purple-400/30 text-purple-200 hover:bg-purple-400/10 transition disabled:opacity-50"
              >
                {opener}
              </button>
            ))}
          </div>
        )}

        <form
          className="flex gap-2 mt-4"
          onSubmit={(e) => {
            e.preventDefault()
            ask(input)
          }}
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask the Oracle…"
            maxLength={500}
            aria-label="Ask the Oracle a question"
            autoComplete="off"
            className="flex-1 rounded-full bg-purple-950/60 border border-purple-400/20 px-4 py-2.5 text-sm text-purple-50 placeholder:text-purple-400/50 focus:outline-none focus:border-purple-300/50"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            aria-label="Send question"
            className="px-5 py-2.5 rounded-full bg-purple-500/80 hover:bg-purple-500 text-white text-sm transition disabled:opacity-50"
          >
            Ask
          </button>
        </form>
      </div>
    </div>
  )
}
