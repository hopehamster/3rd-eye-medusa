import { HttpTypes } from "@medusajs/types"
import { Heading, Text } from "@modules/common/components/ui"
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

const ProductInfo = ({ product }: ProductInfoProps) => {
  const metadata = (product.metadata ?? {}) as Record<string, unknown>
  const intents = Array.isArray(metadata.intents)
    ? (metadata.intents as string[]).filter((i) => INTENT_LABELS[i])
    : []
  const care =
    typeof metadata.care === "string" && metadata.care ? metadata.care : null

  return (
    <div id="product-info">
      <div className="flex flex-col gap-y-4 lg:max-w-[500px] mx-auto">
        {product.collection && (
          <LocalizedClientLink
            href={`/collections/${product.collection.handle}`}
            className="text-medium text-ui-fg-muted hover:text-ui-fg-subtle"
          >
            {product.collection.title}
          </LocalizedClientLink>
        )}
        <Heading
          level="h2"
          className="text-3xl leading-10 text-ui-fg-base"
          data-testid="product-title"
        >
          {product.title}
        </Heading>

        {intents.length > 0 && (
          <div className="flex flex-wrap gap-2" data-testid="product-intents">
            {intents.map((intent) => (
              <LocalizedClientLink
                key={intent}
                href={`/store?intent=${intent}`}
                className="rounded-full border border-violet-700/40 bg-violet-950/30 px-3 py-1 text-xs text-violet-200 hover:border-violet-500 hover:text-white transition"
              >
                {INTENT_LABELS[intent]}
              </LocalizedClientLink>
            ))}
          </div>
        )}

        <Text
          className="text-medium text-ui-fg-subtle whitespace-pre-line"
          data-testid="product-description"
        >
          {product.description}
        </Text>

        {care && (
          <div className="rounded-lg border border-white/10 bg-white/[0.02] p-4">
            <p className="text-xs uppercase tracking-widest text-violet-300 mb-1">
              Care
            </p>
            <p className="text-sm text-gray-300">{care}</p>
          </div>
        )}

        <LocalizedClientLink
          href={`/oracle?about=${product.handle}`}
          className="text-sm text-violet-300 hover:text-violet-200 transition"
        >
          Ask the Oracle about this piece →
        </LocalizedClientLink>
      </div>
    </div>
  )
}

export default ProductInfo
