"use client"

import { useEffect, useRef, useState } from "react"
import { sdk, MEDUSA_BACKEND_URL } from "@lib/config"
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
      <p key={i} className="mb-3 last:mb-0 leading-7">
        {parts.map((part, j) =>
          part.startsWith("**") && part.endsWith("**") ? (
            <strong key={j} className="text-paper-accent font-semibold">
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
    <div className="specimen-card mt-4 flex gap-4 p-3">
      {product?.thumbnail && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={product.thumbnail}
          alt={product.title}
          className="h-16 w-16 shrink-0 rounded-specimen border border-paper-borderSoft object-cover"
        />
      )}
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <p className="truncate font-display text-base text-paper-text">
            {product?.title ?? "A piece from the collection"}
          </p>
          {product?.price && (
            <p className="shrink-0 font-humanist text-sm font-semibold text-paper-text">
              {product.price}
            </p>
          )}
        </div>
        <p className="specimen-meta mt-1">{pick.why_it_fits}</p>
        {product?.variantId && (
          <button
            onClick={handleAdd}
            disabled={adding || added}
            className="mt-3 inline-flex items-center rounded-soft bg-paper-accent px-4 py-2 font-humanist text-xs font-semibold text-paper-bg transition-colors hover:bg-paper-accentBright disabled:opacity-50"
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
    label: "Sage",
    role: "Crystal Guide",
    description: "Find the right stones for your needs",
    greeting:
      "Hey, I'm Sage. I help people find the right stones — whether you know exactly what you need or you're just starting to get curious. What's on your mind?",
  },
  {
    id: "tarot",
    label: "Luna",
    role: "Tarot Reader",
    description: "Card pulls for clarity and insight",
    greeting:
      "Hey, I'm Luna. I read tarot — not to tell you the future, but to help you see your present more clearly. What's weighing on you? Or want me to pull some cards and see what comes up?",
  },
  {
    id: "numerology",
    label: "Theo",
    role: "Numerologist",
    description: "Life path numbers and personal cycles",
    greeting:
      "Hey, I'm Theo. I work with numbers — life path, personal cycles, timing. Everything has a rhythm, and once you see yours, decisions get easier. What's your birth date? Or just tell me what's on your mind.",
  },
  {
    id: "general",
    label: "Oracle",
    role: "General Guide",
    description: "Open guidance on anything",
    greeting:
      "Welcome, seeker. What brings you to the Oracle today? Speak plainly — a feeling, a question, a need — and I will guide you.",
  },
]

function greetingFor(id: string): string {
  return EXPERTS.find((e) => e.id === id)?.greeting ?? EXPERTS[0].greeting
}

function ThinkingDots() {
  return (
    <span
      className="flex items-center gap-1.5 py-2"
      role="status"
      aria-label="Oracle is thinking"
    >
      <span className="h-1.5 w-1.5 rounded-full bg-paper-stone animate-bounce [animation-delay:-0.3s]" />
      <span className="h-1.5 w-1.5 rounded-full bg-paper-stone animate-bounce [animation-delay:-0.15s]" />
      <span className="h-1.5 w-1.5 rounded-full bg-paper-stone animate-bounce" />
    </span>
  )
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
    (globalThis.crypto?.randomUUID?.() ?? `oracle-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`)
  )
  const bottomRef = useRef<HTMLDivElement>(null)

  const activeExpert = EXPERTS.find((e) => e.id === expertId) ?? EXPERTS[0]

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

    // Streaming message placeholder — tokens append here live
    const streamIndex = { current: -1 }
    setMessages((m) => {
      streamIndex.current = m.length
      return [...m, { role: "oracle", text: "" }]
    })

    const appendToken = (token: string) => {
      setMessages((m) =>
        m.map((msg, i) =>
          i === streamIndex.current
            ? { ...msg, text: msg.text + token }
            : msg
        )
      )
    }
    const failover = () => {
      // Streaming failed — fall back to the non-streaming endpoint
      setMessages((m) => m.filter((_, i) => i !== streamIndex.current))
      void askLegacy(q)
    }

    try {
      const publishableKey =
        process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY ?? ""
      const res = await fetch(
        `${MEDUSA_BACKEND_URL}/store/oracle/ask/stream`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "text/event-stream",
            ...(publishableKey ? { "x-publishable-api-key": publishableKey } : {}),
          },
          body: JSON.stringify({
            question: knowledgeOnly ? `[knowledge only] ${q}` : q,
            sessionId: sessionId.current,
            expertId,
          }),
        }
      )
      if (!res.ok || !res.body) {
        failover()
        return
      }

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ""
      let productById = new Map<string, ProductInfo>()
      let streamed = false
      let done = false

      const handleEvent = (event: {
        type: string
        text?: string
        picks?: Pick[]
        products?: ProductInfo[]
        logId?: string | null
        error?: string
      }) => {
        switch (event.type) {
          case "token":
            streamed = true
            if (event.text) {
              appendToken(event.text)
              scrollDown()
            }
            break
          case "products":
            productById = new Map(
              (event.products ?? []).map((p) => [p.id, p])
            )
            break
          case "picks":
            setMessages((m) =>
              m.map((msg, i) =>
                i === streamIndex.current
                  ? {
                      ...msg,
                      picks: (event.picks ?? []).map((pick) => ({
                        ...pick,
                        product: productById.get(pick.product_id),
                      })),
                    }
                  : msg
              )
            )
            break
          case "done":
            done = true
            setMessages((m) =>
              m.map((msg, i) =>
                i === streamIndex.current
                  ? { ...msg, logId: event.logId ?? null }
                  : msg
              )
            )
            setLoading(false)
            scrollDown()
            break
          case "error":
            if (!streamed) {
              failover()
            } else {
              appendToken(
                "\n\n(The connection flickered — that was the full answer.)"
              )
              setLoading(false)
            }
            break
        }
      }

      for (;;) {
        const { done: readerDone, value } = await reader.read()
        if (readerDone) {
          break
        }
        buffer += decoder.decode(value, { stream: true })
        const parts = buffer.split("\n\n")
        buffer = parts.pop() ?? ""
        for (const part of parts) {
          const line = part.trim()
          if (!line.startsWith("data:")) {
            continue
          }
          try {
            handleEvent(JSON.parse(line.slice(5).trim()))
          } catch {
            // malformed event — skip
          }
        }
        if (done) {
          break
        }
      }
      if (!done && !streamed) {
        failover()
      } else if (!done) {
        setLoading(false)
      }
    } catch {
      failover()
    }
  }

  /** Non-streaming fallback when SSE is unavailable. */
  const askLegacy = async (q: string) => {
    setLoading(true)
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
    <div className="mx-auto max-w-2xl">
      <p className="specimen-meta mb-3">
        Choose who you would like to consult. Each guide keeps their own
        counsel — pick the one whose way of seeing fits your question.
      </p>
      <div className="grid grid-cols-1 gap-3 small:grid-cols-2">
        {EXPERTS.map((expert) => {
          const active = expertId === expert.id
          return (
            <button
              key={expert.id}
              onClick={() => {
                setExpertId(expert.id)
                setMessages([{ role: "oracle", text: expert.greeting }])
              }}
              aria-pressed={active}
              className={`specimen-card p-4 text-left transition-colors ${
                active
                  ? "border-paper-accent bg-paper-accentSoft/50"
                  : "hover:border-paper-stone"
              }`}
            >
              <span className="flex items-start gap-3">
                <span
                  aria-hidden="true"
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full border font-display text-xl ${
                    active
                      ? "border-paper-accent text-paper-accent"
                      : "border-paper-border text-paper-muted"
                  }`}
                >
                  {expert.label.charAt(0)}
                </span>
                <span className="min-w-0">
                  <span className="block font-display text-lg leading-snug text-paper-text">
                    {expert.label}
                  </span>
                  <span className="mt-0.5 block font-humanist text-sm text-paper-faint">
                    {expert.role}
                  </span>
                  <span className="mt-1.5 block font-humanist text-sm leading-6 text-paper-muted">
                    {expert.description}
                  </span>
                  {active && (
                    <span className="mt-2 block font-humanist text-xs font-semibold text-paper-accent">
                      Now consulting
                    </span>
                  )}
                </span>
              </span>
            </button>
          )
        })}
      </div>

      <div className="mt-4 flex justify-end">
        <label className="inline-flex cursor-pointer items-center gap-2 font-humanist text-xs text-paper-muted">
          <input
            type="checkbox"
            checked={knowledgeOnly}
            onChange={(e) => setKnowledgeOnly(e.target.checked)}
            className="accent-paper-accent"
          />
          <span title="Get guidance without product recommendations">
            Guidance only (no product picks)
          </span>
        </label>
      </div>

      <div className="specimen-card mt-3 flex min-h-[50vh] flex-col p-5 small:p-7">
        <div className="flex-1 space-y-8 overflow-y-auto">
          {messages.map((msg, i) =>
            msg.role === "oracle" ? (
              <article key={i} className="max-w-[92%]">
                <div className="mb-2 flex items-baseline gap-3">
                  <span className="font-display text-base text-paper-text">
                    {activeExpert.label}
                  </span>
                  <span className="paper-hairline flex-1" aria-hidden="true" />
                </div>
                <div className="font-humanist text-[15px] text-paper-text">
                  {msg.text === "" ? (
                    <ThinkingDots />
                  ) : (
                    renderMarkdown(msg.text)
                  )}
                  {msg.picks?.map((pick) => (
                    <ProductCard
                      key={pick.product_id}
                      pick={pick}
                      countryCode={countryCode}
                    />
                  ))}
                  {msg.logId && msg.feedback === undefined && (
                    <div className="mt-4 flex gap-3 font-humanist text-xs text-paper-faint">
                      <span>Was this helpful?</span>
                      <button
                        onClick={() => sendFeedback(i, true)}
                        className="underline underline-offset-4 transition-colors hover:text-paper-accent"
                        aria-label="Helpful"
                      >
                        Helpful
                      </button>
                      <button
                        onClick={() => sendFeedback(i, false)}
                        className="underline underline-offset-4 transition-colors hover:text-paper-accent"
                        aria-label="Not helpful"
                      >
                        Not helpful
                      </button>
                    </div>
                  )}
                  {msg.feedback !== undefined && (
                    <p className="mt-4 font-humanist text-xs text-paper-faint">
                      Thanks for the feedback.
                    </p>
                  )}
                </div>
              </article>
            ) : (
              <div key={i} className="flex flex-col items-end">
                <span className="mb-1.5 font-humanist text-xs text-paper-faint">
                  You wrote
                </span>
                <p className="max-w-[85%] border-r-2 border-paper-accent pr-4 text-right font-humanist text-[15px] leading-7 text-paper-text">
                  {msg.text}
                </p>
              </div>
            )
          )}
          {loading && messages[messages.length - 1]?.role !== "oracle" && (
            <div className="max-w-[92%]">
              <div className="mb-2 flex items-baseline gap-3">
                <span className="font-display text-base text-paper-text">
                  {activeExpert.label}
                </span>
                <span className="paper-hairline flex-1" aria-hidden="true" />
              </div>
              <ThinkingDots />
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {messages.length <= 1 && (
          <div className="mt-6 flex flex-wrap gap-2">
            {OPENERS.map((opener) => (
              <button
                key={opener}
                onClick={() => ask(opener)}
                disabled={loading}
                className="specimen-chip transition-colors hover:border-paper-accent hover:text-paper-accent disabled:opacity-50"
              >
                {opener}
              </button>
            ))}
          </div>
        )}

        <form
          className="mt-6 flex gap-2 border-t border-paper-borderSoft pt-5"
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
            className="flex-1 rounded-soft border border-paper-border bg-paper-raised px-4 py-3 font-humanist text-sm text-paper-text placeholder:text-paper-faint focus:border-paper-accent focus:outline-none"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            aria-label="Send question"
            className="btn-paper px-6 py-3 disabled:opacity-50"
          >
            Ask
          </button>
        </form>
      </div>
    </div>
  )
}
