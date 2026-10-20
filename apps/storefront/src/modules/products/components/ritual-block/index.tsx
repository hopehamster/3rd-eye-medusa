import { HttpTypes } from "@medusajs/types"

type RitualBlockProps = {
  product: HttpTypes.StoreProduct
}

/**
 * Below-the-fold story + ritual sections for the PDP (issue #24).
 * Above the fold stays: what it is, why want it, how to get it.
 * Down here: where it comes from, and how to use it.
 *
 * COPY SLOTS (Agent Voice, issue #26): metadata.story (origin/mineralogy
 * story in human voice) and metadata.ritual (per-stone use text) replace the
 * fallbacks below when populated. Fallback ritual copy is deliberately plain
 * and free of medical claims.
 */
const RitualBlock = ({ product }: RitualBlockProps) => {
  const metadata = (product.metadata ?? {}) as Record<string, unknown>
  const str = (v: unknown): string | null =>
    typeof v === "string" && v.trim() ? v.trim() : null

  const story = str(metadata.story)
  const ritual = str(metadata.ritual)
  const care = str(metadata.care)

  const RITUAL_FALLBACK =
    "Start simple. Hold the piece for a moment and set your intention in plain words: what you want more of, or less of. Then keep it where you will see it every day — worn, on your desk, or by your bed. The ritual is the attention."

  const showStory = !!story
  const showRitual = true // always rendered; falls back until Voice fills the slot

  if (!showStory && !showRitual && !care) {
    return null
  }

  return (
    <section
      className="mt-14 small:mt-20 border-t border-paper-border pt-10 small:pt-14 font-humanist"
      data-testid="ritual-block"
    >
      <div className="grid grid-cols-1 small:grid-cols-2 gap-10 small:gap-16">
        {showStory && (
          <div>
            <h2 className="font-display text-2xl text-paper-text font-normal tracking-tight">
              The story
            </h2>
            <p className="mt-4 text-[15px] leading-relaxed text-paper-muted whitespace-pre-line">
              {story}
            </p>
          </div>
        )}
        {showRitual && (
          <div>
            <h2 className="font-display text-2xl text-paper-text font-normal tracking-tight">
              How to use it
            </h2>
            <p className="mt-4 text-[15px] leading-relaxed text-paper-muted whitespace-pre-line">
              {ritual ?? RITUAL_FALLBACK}
            </p>
          </div>
        )}
      </div>

      {care && (
        <div className="mt-10 border border-paper-border bg-paper-surface rounded-specimen p-5 max-w-2xl">
          <p className="text-[11px] uppercase tracking-[0.16em] text-paper-faint">
            Care
          </p>
          <p className="mt-2 text-sm leading-relaxed text-paper-text">{care}</p>
        </div>
      )}
    </section>
  )
}

export default RitualBlock
