import { defineRouteConfig } from "@medusajs/admin-sdk"
import { useState } from "react"

interface GeneratedContent {
  title: string
  description: string
  short_description: string
  intents: string[]
  meta_title: string
  meta_description: string
  care: string
}

const EMPTY_DRAFT: GeneratedContent = {
  title: "",
  description: "",
  short_description: "",
  intents: [],
  meta_title: "",
  meta_description: "",
  care: "",
}

const AIContentPage = () => {
  const [productId, setProductId] = useState("")
  const [rawTitle, setRawTitle] = useState("")
  const [rawDescription, setRawDescription] = useState("")
  const [material, setMaterial] = useState("")
  const [draft, setDraft] = useState<GeneratedContent | null>(null)
  const [generating, setGenerating] = useState(false)
  const [applying, setApplying] = useState(false)
  const [message, setMessage] = useState("")

  const generate = async () => {
    if (!rawTitle.trim()) {
      setMessage("Enter the raw product title first.")
      return
    }
    setGenerating(true)
    setMessage("")
    setDraft(null)
    try {
      const res = await fetch("/admin/ai-content/generate", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          raw_title: rawTitle,
          raw_description: rawDescription || undefined,
          material: material || undefined,
        }),
      })
      if (!res.ok) {
        throw new Error("Generation failed")
      }
      const data = await res.json()
      setDraft({ ...EMPTY_DRAFT, ...data.draft })
      setMessage("Draft ready — review and edit before applying.")
    } catch {
      setMessage("Could not generate content. Check the DeepSeek key and try again.")
    } finally {
      setGenerating(false)
    }
  }

  const apply = async () => {
    if (!productId.trim() || !draft) {
      setMessage("Enter a product ID and generate a draft first.")
      return
    }
    setApplying(true)
    setMessage("")
    try {
      const res = await fetch("/admin/ai-content/apply", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product_id: productId.trim(), draft }),
      })
      if (!res.ok) {
        throw new Error("Apply failed")
      }
      setMessage("Applied. The product keeps its current status — publish it when ready.")
    } catch {
      setMessage("Could not apply the draft. Try again.")
    } finally {
      setApplying(false)
    }
  }

  const setField = (field: keyof GeneratedContent, value: string) => {
    if (draft) {
      setDraft({ ...draft, [field]: value })
    }
  }

  return (
    <div className="p-8 max-w-4xl">
      <h1 className="text-xl font-semibold">AI Product Content</h1>
      <p className="text-sm text-gray-500 mt-1 mb-6">
        Generate shop-ready copy with DeepSeek. Every draft is reviewed here —
        nothing publishes on its own.
      </p>

      <div className="grid gap-4 mb-6">
        <label className="block">
          <span className="text-sm font-medium">Raw product title</span>
          <input
            value={rawTitle}
            onChange={(e) => setRawTitle(e.target.value)}
            className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 text-sm"
            placeholder="e.g. Amethyst crystal bracelet from supplier"
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium">Supplier description (optional)</span>
          <textarea
            value={rawDescription}
            onChange={(e) => setRawDescription(e.target.value)}
            className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 text-sm"
            rows={3}
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium">Material / stone (optional)</span>
          <input
            value={material}
            onChange={(e) => setMaterial(e.target.value)}
            className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 text-sm"
            placeholder="e.g. Amethyst"
          />
        </label>
        <div>
          <button
            onClick={generate}
            disabled={generating}
            className="rounded bg-violet-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {generating ? "Writing..." : "Generate draft"}
          </button>
        </div>
      </div>

      {draft && (
        <div className="border-t pt-6">
          <h2 className="text-lg font-semibold mb-4">Review draft</h2>
          <div className="grid gap-4">
            {(
              [
                ["title", "Title"],
                ["short_description", "Short description"],
                ["meta_title", "Meta title"],
                ["meta_description", "Meta description"],
                ["care", "Care line"],
              ] as [keyof GeneratedContent, string][]
            ).map(([field, label]) => (
              <label key={field} className="block">
                <span className="text-sm font-medium">{label}</span>
                <input
                  value={draft[field] as string}
                  onChange={(e) => setField(field, e.target.value)}
                  className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 text-sm"
                />
              </label>
            ))}
            <label className="block">
              <span className="text-sm font-medium">Description</span>
              <textarea
                value={draft.description}
                onChange={(e) => setField("description", e.target.value)}
                className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 text-sm"
                rows={6}
              />
            </label>
            <div className="text-sm">
              <span className="font-medium">Intent tags: </span>
              {draft.intents.length > 0 ? draft.intents.join(", ") : "none"}
            </div>
            <label className="block">
              <span className="text-sm font-medium">Product ID to apply to</span>
              <input
                value={productId}
                onChange={(e) => setProductId(e.target.value)}
                className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 text-sm"
                placeholder="prod_..."
              />
            </label>
            <div>
              <button
                onClick={apply}
                disabled={applying}
                className="rounded bg-green-700 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
              >
                {applying ? "Applying..." : "Apply to product"}
              </button>
            </div>
          </div>
        </div>
      )}

      {message && <p className="mt-4 text-sm text-gray-600">{message}</p>}
    </div>
  )
}

export const config = defineRouteConfig({
  label: "AI Content",
})

export default AIContentPage
