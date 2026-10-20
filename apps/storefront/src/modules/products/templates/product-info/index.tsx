import { HttpTypes } from "@medusajs/types"
import { Heading } from "@modules/common/components/ui"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

type ProductInfoProps = {
  product: HttpTypes.StoreProduct
}

const INTENT_LABELS: Record<string, string> = {
  protection: "Protection",
  "cleansing-purification": "Cleansing",
  grounding: "Grounding",
  "clarity-focus": "Clarity & Focus",
  "calm-soothing": "Calm",
  "love-self": "Self-Love",
  "love-romantic": "Romance",
  "abundance-prosperity": "Abundance",
  "intuition-third-eye": "Intuition",
  "sleep-dreams": "Sleep & Dreams",
  "energy-chakra-balancing": "Energy Balancing",
  "grief-healing": "Grief Healing",
  "confidence-courage": "Courage",
  "creativity-inspiration": "Creativity",
  "spiritual-connection-ritual": "Ritual",
}

type SpecRow = { label: string; value: string }

/**
 * Specimen-label panel for the PDP (bright apothecary redesign, issue #24).
 * Set like a printed specimen card: name, intention subtitle, hairline-rule
 * spec rows, intent links. Only renders rows with actual values.
 *
 * COPY SLOTS (Agent Voice, issue #26): product.subtitle (intention subtitle),
 * metadata.story, metadata.origin, metadata.ritual, metadata.care — the
 * panel degrades gracefully while those are unpopulated. No medical claims.
 */
const ProductInfo = ({ product }: ProductInfoProps) => {
  const metadata = (product.metadata ?? {}) as Record<string, unknown>
  const str = (v: unknown): string | null =>
    typeof v === "string" && v.trim() ? v.trim() : null

  const intents = Array.isArray(metadata.intents)
    ? (metadata.intents as string[]).filter((i) => INTENT_LABELS[i])
    : []

  // Intention subtitle: writer-owned subtitle wins; otherwise derive from
  // intention tags. Plain voice — never a medical claim.
  const subtitle =
    str(product.subtitle) ??
    str(metadata.intention_subtitle) ??
    (intents.length
      ? `For ${intents.map((i) => INTENT_LABELS[i].toLowerCase()).join(", ")}`
      : null)

  const rows: SpecRow[] = []
  const material = str(product.material)
  const origin = str(product.origin_country) ?? str(metadata.origin)
  const form = product.type ? str(product.type.value) : null
  const weight = product.weight ? `${product.weight} g` : null
  const dimensions =
    product.length && product.width && product.height
      ? `${product.length}L x ${product.width}W x ${product.height}H`
      : null
  const stone = str(metadata.stone)
  const finish = str(metadata.finish)

  if (material) rows.push({ label: "Material", value: material })
  if (stone) rows.push({ label: "Stone", value: stone })
  if (form) rows.push({ label: "Form", value: form })
  if (finish) rows.push({ label: "Finish", value: finish })
  if (weight) rows.push({ label: "Weight", value: weight })
  if (dimensions) rows.push({ label: "Dimensions", value: dimensions })
  if (origin) rows.push({ label: "Origin", value: origin })

  const description = str(product.description)

  return (
    <div id="product-info" className="font-humanist">
      <div className="flex flex-col gap-y-5">
        {product.collection && (
          <LocalizedClientLink
            href={`/collections/${product.collection.handle}`}
            className="text-sm text-paper-muted underline decoration-paper-border underline-offset-4 hover:text-paper-accent transition-colors"
          >
            {product.collection.title}
          </LocalizedClientLink>
        )}

        <div>
          <Heading
            level="h1"
            className="font-display text-4xl small:text-[2.75rem] leading-[1.1] text-paper-text font-normal tracking-tight"
            data-testid="product-title"
          >
            {product.title}
          </Heading>
          {subtitle && (
            <p
              className="mt-3 font-display text-xl text-paper-muted font-normal"
              data-testid="product-subtitle"
            >
              {subtitle}
            </p>
          )}
        </div>

        {intents.length > 0 && (
          <div className="flex flex-wrap gap-2" data-testid="product-intents">
            {intents.map((intent) => (
              <LocalizedClientLink
                key={intent}
                href={`/store?intent=${intent}`}
                className="rounded-specimen border border-paper-border bg-paper-raised px-3 py-1.5 text-xs font-medium tracking-wide text-paper-text hover:border-paper-accent hover:text-paper-accent transition-colors"
              >
                {INTENT_LABELS[intent]}
              </LocalizedClientLink>
            ))}
          </div>
        )}

        {description && (
          <p
            className="text-[15px] leading-relaxed text-paper-muted whitespace-pre-line"
            data-testid="product-description"
          >
            {description}
          </p>
        )}

        {rows.length > 0 && (
          <dl className="border-b border-paper-border">
            {rows.map((row) => (
              <div
                key={row.label}
                className="flex justify-between gap-6 border-t border-paper-border py-2.5"
              >
                <dt className="text-[11px] uppercase tracking-[0.16em] text-paper-faint pt-0.5 shrink-0">
                  {row.label}
                </dt>
                <dd className="text-sm text-paper-text text-right">
                  {row.value}
                </dd>
              </div>
            ))}
          </dl>
        )}

        <LocalizedClientLink
          href={`/oracle?about=${product.handle}`}
          className="text-sm font-medium text-paper-accent hover:text-paper-accentBright transition-colors"
        >
          Ask the Oracle about this piece
          <span aria-hidden="true"> &#8594;</span>
        </LocalizedClientLink>
      </div>
    </div>
  )
}

export default ProductInfo
