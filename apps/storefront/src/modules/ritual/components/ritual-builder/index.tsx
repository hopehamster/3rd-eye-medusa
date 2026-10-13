"use client"

import { useEffect, useState } from "react"
import { sdk } from "@lib/config"
import { addToCart } from "@lib/data/cart"
import { HttpTypes } from "@medusajs/types"

interface Intention {
  id: string
  label: string
  description: string
  intents: string[]
}

const INTENTIONS: Intention[] = [
  {
    id: "protection",
    label: "Protection",
    description: "Shield your space and energy from negativity",
    intents: ["protection", "grounding", "cleansing-purification"],
  },
  {
    id: "abundance",
    label: "Abundance",
    description: "Open the flow of prosperity and opportunity",
    intents: ["abundance-prosperity", "creativity-inspiration"],
  },
  {
    id: "calm",
    label: "Calm & Sleep",
    description: "Quiet the mind and invite restful nights",
    intents: ["calm-soothing", "sleep-dreams"],
  },
  {
    id: "love",
    label: "Love",
    description: "Soften the heart — for yourself or another",
    intents: ["love-self", "love-romantic"],
  },
  {
    id: "clarity",
    label: "Clarity",
    description: "Cut through fog and see your path",
    intents: ["clarity-focus", "intuition-third-eye"],
  },
  {
    id: "new-beginnings",
    label: "New Beginnings",
    description: "Mark a threshold and step through brave",
    intents: ["confidence-courage", "spiritual-connection-ritual"],
  },
]

interface BuilderProduct {
  id: string
  title: string
  thumbnail: string | null
  variantId: string | null
  intents: string[]
}

function productIntents(p: HttpTypes.StoreProduct): string[] {
  const meta = (p.metadata ?? {}) as Record<string, unknown>
  return Array.isArray(meta.intents) ? (meta.intents as string[]) : []
}

const RITUAL_SCRIPTS: Record<string, (items: string[]) => string[]> = {
  protection: (items) => [
    "Cleanse your space. Light incense or ring a bell in each corner, imagining stagnant energy dissolving.",
    `Hold ${items[0] || "your stone"} in your dominant hand. Close your eyes and picture a sphere of white-gold light around you.`,
    "State aloud: 'Only what serves me may enter. All else, turn away.'",
    `Place ${items[0] || "your stone"} by your front door or carry it with you for seven days.`,
    "Each night, hold it briefly and repeat your statement. Protection is a practice, not a purchase.",
  ],
  abundance: (items) => [
    `Set ${items[0] || "your stone"} where you handle money or plan — a desk, an altar, a wallet.`,
    "Write one concrete opportunity you want on paper. Be specific: an amount, a client, a door.",
    "Hold the paper and the stone together. Say: 'I make room. I am ready to receive.'",
    "Take one real-world step toward it within 24 hours — the ritual opens the door, you walk through.",
    "Each morning for a week, touch the stone and name one thing you're grateful for.",
  ],
  calm: (items) => [
    "An hour before bed, dim the lights and put the phone in another room.",
    `Hold ${items[0] || "your stone"}. Breathe in for four counts, out for six. Let the shoulders drop.`,
    "Name three things from today — good or hard — and set each one down, like stones from a pocket.",
    `Place ${items[0] || "your stone"} on your nightstand. It keeps the watch while you rest.`,
    "If sleep won't come, don't fight it. Breathe with the stone until the edges soften.",
  ],
  love: (items) => [
    `Hold ${items[0] || "your stone"} over your heart. Feel its weight, its coolness.`,
    "Say your own name aloud, then: 'I am worthy of the love I give so freely.'",
    "Write one kind truth about yourself. Keep it where you'll see it tomorrow.",
    `Carry ${items[0] || "your stone"} for a week as a reminder, not a rule.`,
    "Love rituals work inward first. The rest follows.",
  ],
  clarity: (items) => [
    "Sit somewhere quiet with paper. Write the question that's been circling.",
    `Hold ${items[0] || "your stone"} and breathe until the mental noise drops a notch.`,
    "Write for ten minutes without stopping — no editing, no judging. The answer is usually in the third paragraph.",
    "Read it back. Circle the one true sentence.",
    `Keep ${items[0] || "your stone"} on your desk as an anchor for clear thinking.`,
  ],
  "new-beginnings": (items) => [
    "Choose a threshold — a doorway, a sunrise, the first of the month.",
    `Hold ${items[0] || "your stone"}. Name what you're leaving behind, out loud, once.`,
    "Name what you're stepping toward. Say it like it's already true.",
    "Step through your threshold. Don't look back — beginnings face forward.",
    `Carry ${items[0] || "your stone"} through the first week as a witness to your courage.`,
  ],
}

export default function RitualBuilder({
  countryCode,
}: {
  countryCode: string
}) {
  const [step, setStep] = useState(0)
  const [intention, setIntention] = useState<Intention | null>(null)
  const [products, setProducts] = useState<BuilderProduct[]>([])
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)
  const [adding, setAdding] = useState(false)
  const [added, setAdded] = useState(false)

  useEffect(() => {
    if (step === 1 && intention) {
      setLoading(true)
      sdk.store.product
        .list({ limit: 100, fields: "id,title,thumbnail,variants,metadata" })
        .then(({ products: list }) => {
          const mapped: BuilderProduct[] = list.map((p) => ({
            id: p.id,
            title: p.title,
            thumbnail: p.thumbnail,
            variantId: p.variants?.[0]?.id ?? null,
            intents: productIntents(p),
          }))
          // Intent-matched first, then the rest
          mapped.sort((a, b) => {
            const am = a.intents.some((i) => intention.intents.includes(i)) ? 0 : 1
            const bm = b.intents.some((i) => intention.intents.includes(i)) ? 0 : 1
            return am - bm
          })
          setProducts(mapped)
        })
        .catch(() => setProducts([]))
        .finally(() => setLoading(false))
    }
  }, [step, intention])

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else if (next.size < 5) {
        next.add(id)
      }
      return next
    })
  }

  const selectedProducts = products.filter((p) => selected.has(p.id))
  const script = intention
    ? (RITUAL_SCRIPTS[intention.id] || RITUAL_SCRIPTS.protection)(
        selectedProducts.map((p) => p.title)
      )
    : []

  const addAllToCart = async () => {
    const withVariant = selectedProducts.filter((p) => p.variantId)
    if (!withVariant.length || adding || added) {
      return
    }
    setAdding(true)
    try {
      for (const p of withVariant) {
        await addToCart({
          variantId: p.variantId!,
          quantity: 1,
          countryCode,
        })
      }
      setAdded(true)
    } catch {
      // cart errors surface on the cart page; keep the builder usable
    } finally {
      setAdding(false)
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="flex items-center gap-2 mb-8">
        {["Intention", "Components", "Your ritual"].map((label, i) => (
          <div key={label} className="flex items-center gap-2 flex-1">
            <div
              className={`h-1 flex-1 rounded-full ${
                i <= step ? "bg-violet-500" : "bg-white/10"
              }`}
            />
          </div>
        ))}
      </div>

      {step === 0 && (
        <div>
          <h2 className="text-2xl font-semibold mb-2">
            What are you building this ritual for?
          </h2>
          <p className="text-sm text-gray-400 mb-6">
            Choose the intention. Everything else follows from it.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            {INTENTIONS.map((intent) => (
              <button
                key={intent.id}
                onClick={() => {
                  setIntention(intent)
                  setSelected(new Set())
                  setStep(1)
                }}
                className="text-left rounded-lg border border-white/10 bg-white/[0.02] p-5 hover:border-violet-600/60 hover:bg-violet-950/30 transition"
              >
                <span className="font-medium text-lg">{intent.label}</span>
                <span className="block text-sm text-gray-400 mt-1">
                  {intent.description}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 1 && intention && (
        <div>
          <h2 className="text-2xl font-semibold mb-2">
            Choose your components
          </h2>
          <p className="text-sm text-gray-400 mb-6">
            Pick up to 5 pieces for your {intention.label.toLowerCase()} ritual.
            Matched pieces appear first.
          </p>
          {loading ? (
            <p className="text-gray-400">Gathering pieces...</p>
          ) : products.length === 0 ? (
            <p className="text-gray-400">
              The shelves are being stocked — check back soon.
            </p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {products.map((p) => {
                const isSelected = selected.has(p.id)
                const matched = p.intents.some((i) =>
                  intention.intents.includes(i)
                )
                return (
                  <button
                    key={p.id}
                    onClick={() => toggle(p.id)}
                    className={`text-left rounded-lg border p-4 transition flex gap-3 items-center ${
                      isSelected
                        ? "border-violet-500 bg-violet-950/40"
                        : "border-white/10 bg-white/[0.02] hover:border-violet-700/50"
                    }`}
                  >
                    {p.thumbnail ? (
                      <img
                        src={p.thumbnail}
                        alt={p.title}
                        className="w-14 h-14 rounded object-cover shrink-0"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded bg-white/5 shrink-0" />
                    )}
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">{p.title}</p>
                      {matched && (
                        <p className="text-xs text-violet-300 mt-0.5">
                          Aligned with your intention
                        </p>
                      )}
                      <p className="text-xs text-gray-500 mt-0.5">
                        {isSelected ? "Selected" : "Tap to add"}
                      </p>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
          <div className="mt-6 flex justify-between">
            <button
              onClick={() => setStep(0)}
              className="text-sm text-gray-400 hover:text-white"
            >
              Back
            </button>
            <button
              onClick={() => setStep(2)}
              disabled={selected.size === 0}
              className="rounded bg-violet-600 px-5 py-2 text-sm font-medium text-white disabled:opacity-40"
            >
              Write my ritual ({selected.size})
            </button>
          </div>
        </div>
      )}

      {step === 2 && intention && (
        <div>
          <p className="text-xs uppercase tracking-widest text-violet-400 mb-2">
            Your {intention.label} ritual
          </p>
          <h2 className="text-2xl font-semibold mb-6">
            {selectedProducts.length} {selectedProducts.length === 1 ? "piece" : "pieces"},
            one working
          </h2>

          <div className="flex flex-wrap gap-2 mb-8">
            {selectedProducts.map((p) => (
              <span
                key={p.id}
                className="rounded-full border border-violet-700/40 bg-violet-950/30 px-3 py-1 text-xs text-violet-200"
              >
                {p.title}
              </span>
            ))}
          </div>

          <ol className="space-y-5">
            {script.map((line, i) => (
              <li key={i} className="flex gap-4">
                <span className="shrink-0 w-8 h-8 rounded-full border border-violet-700/50 flex items-center justify-center text-sm text-violet-200">
                  {i + 1}
                </span>
                <p className="text-gray-200 leading-relaxed pt-1">{line}</p>
              </li>
            ))}
          </ol>

          <div className="mt-10 rounded-lg border border-white/10 bg-white/[0.02] p-6">
            <p className="font-medium mb-1">Take the ritual home</p>
            <p className="text-sm text-gray-400 mb-4">
              Add {selectedProducts.length === 1 ? "this piece" : "all these pieces"} to
              your cart and begin tonight.
            </p>
            <button
              onClick={addAllToCart}
              disabled={adding || added || selectedProducts.length === 0}
              className="rounded bg-violet-600 px-5 py-2 text-sm font-medium text-white disabled:opacity-40"
            >
              {added
                ? "Added to cart"
                : adding
                ? "Adding..."
                : `Add ${selectedProducts.length} to cart`}
            </button>
          </div>

          <div className="mt-6 flex justify-between">
            <button
              onClick={() => setStep(1)}
              className="text-sm text-gray-400 hover:text-white"
            >
              Change pieces
            </button>
            <button
              onClick={() => {
                setStep(0)
                setIntention(null)
                setSelected(new Set())
                setAdded(false)
              }}
              className="text-sm text-gray-400 hover:text-white"
            >
              Start over
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
