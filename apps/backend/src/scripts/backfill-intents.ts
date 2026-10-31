/**
 * One-off backfill: give published products their metadata.intents.
 *
 * Every published product was untagged, so the Oracle had zero intent-matched
 * products and could only ever fall back to vector search. The mapping below is
 * derived from each product's handle/title (chakra, stone and function words)
 * and is deliberately conservative — 2 intents per product, all from the
 * taxonomy in modules/oracle/taxonomy.ts.
 *
 * It goes through updateProductsWorkflow (not raw SQL) so the product events
 * fire and the search index picks the change up. Existing metadata is merged,
 * never replaced.
 *
 *   npx medusa exec ./src/scripts/backfill-intents.ts
 */
import { updateProductsWorkflow } from "@medusajs/medusa/core-flows"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import type { ExecArgs } from "@medusajs/framework/types"

const INTENTS_BY_HANDLE: Record<string, string[]> = {
  "clear-quartz-aquamarine-throat-chakra-bracelet-expression-reconciliation": [
    "clarity-focus",
    "confidence-courage"
  ],
  "kunzite-crown-chakra-set-deep-awakening-spiritual-healing": [
    "spiritual-connection-ritual",
    "intuition-third-eye"
  ],
  "natural-stone-three-dimensional-hexagonal-pendulum-necklace": [
    "intuition-third-eye",
    "spiritual-connection-ritual"
  ],
  "tree-of-life-pendant-necklace-7-chakra-natural-gemstone-crystal-stones-healing": [
    "energy-chakra-balancing",
    "grounding"
  ],
  "rose-quartz-heart-chakra-bracelet-self-love-emotional-healing": [
    "love-self",
    "grief-healing"
  ],
  "gray-moonstone-throat-chakra-bracelet-anxiety-relief-sleep-aid": [
    "calm-soothing",
    "sleep-dreams"
  ],
  "multi-gemstone-all-chakra-set-holistic-balance-energy-alignment": [
    "energy-chakra-balancing",
    "grounding"
  ],
  "natural-lavender-amethyst-clear-quartz-bracelet-round-beaded-chain-wisdom-energy-jewelry-for-women": [
    "clarity-focus",
    "intuition-third-eye"
  ],
  "green-crystal-heart-chakra-bracelet-stress-release-vitality": [
    "calm-soothing",
    "energy-chakra-balancing"
  ],
  "natural-aquamarine-rose-quartz-bracelet-amethyst-multi-stone-beaded-chain-water": [
    "calm-soothing",
    "love-self"
  ],
  "natural-crystal-hexagonal-cone-rose-quartz-tigers-eye-pendulum-natural": [
    "intuition-third-eye",
    "protection"
  ],
  "tibetan-style-six-syllable-mantra-braided-bracelet-with-s925-silver": [
    "spiritual-connection-ritual",
    "protection"
  ],
  "natural-amethyst-bracelet-108-mala-beads-clear-quartz-spacer-multi-layer-chain-u": [
    "spiritual-connection-ritual",
    "calm-soothing"
  ],
  "bolivian-amethyst-crown-chakra-bracelet-clarity-wisdom": [
    "clarity-focus",
    "intuition-third-eye"
  ],
  "red-agate-root-chakra-bracelet-grounding-security": [
    "grounding",
    "protection"
  ],
  "silver-obsidian-root-chakra-bracelet-purification-protection": [
    "protection",
    "cleansing-purification"
  ],
  "tarot-card-stainless-steel-pendant-necklace": [
    "intuition-third-eye",
    "spiritual-connection-ritual"
  ],
  "crystal-pyramid-home-decor-ornament": [
    "protection",
    "cleansing-purification"
  ],
  // Added after the 25 drafts went live: these were published without intents, so
  // the Oracle could never shelf them.
  "3rd-eye-leggings": ["confidence-courage", "energy-chakra-balancing"],
  "crystal-ring": ["energy-chakra-balancing", "clarity-focus"],
  "crystal-rings": ["energy-chakra-balancing", "clarity-focus"],
  "crystal-stud-earrings": ["energy-chakra-balancing", "confidence-courage"],
  "mens-stainless-steel-cryptographic-cuban-chain-bracelet": [
    "abundance-prosperity",
    "confidence-courage"
  ],
  "natural-marble-round-spherical-incense-burner-4384ph": [
    "cleansing-purification",
    "spiritual-connection-ritual"
  ],
  "new-womens-open-style-bracelet-fashionable-woven-design": [
    "confidence-courage",
    "love-self"
  ],
  "nine-fold-vajra-knot-red-string-bracelet": [
    "protection",
    "spiritual-connection-ritual"
  ],
  "orgone-angel": ["protection", "spiritual-connection-ritual"],
  "orgone-angels": ["protection", "spiritual-connection-ritual"],
  "orgone-buddha": ["spiritual-connection-ritual", "calm-soothing"],
  "orgone-mayan-pyramid": ["spiritual-connection-ritual", "energy-chakra-balancing"],
  "orgone-pyramids": ["spiritual-connection-ritual", "energy-chakra-balancing"],
  "orgone-starfish": ["spiritual-connection-ritual", "love-self"],
  "protection-pouches": ["protection", "grounding"],
  "stone-protection-pouch": ["protection", "grounding"],
  "wood-ring": ["grounding", "spiritual-connection-ritual"],
  "zen-incense-burner-with-ash-catching-design-256cfy": [
    "cleansing-purification",
    "calm-soothing"
  ],
  "crystal-tree-green-aventurine": ["abundance-prosperity", "calm-soothing"],
};

type Row = { id: string; handle?: string | null; metadata?: Record<string, unknown> | null }

export default async function backfillIntents({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)

  const { data } = (await query.graph({
    entity: "product",
    fields: ["id", "handle", "metadata"],
  })) as { data: Row[] }

  const updates = (data ?? [])
    .filter((p) => p.handle && INTENTS_BY_HANDLE[p.handle] && !Array.isArray(p.metadata?.intents))
    .map((p) => ({
      id: p.id,
      metadata: { ...(p.metadata ?? {}), intents: INTENTS_BY_HANDLE[p.handle as string] },
    }))

  if (updates.length === 0) {
    logger.info("backfill-intents: nothing to do")
    return
  }

  logger.info(`backfill-intents: tagging ${updates.length} products`)

  for (const update of updates) {
    await updateProductsWorkflow(container).run({ input: { products: [update] } })
    logger.info(`  tagged ${update.metadata.intents.join(", ")}`)
  }

  logger.info("backfill-intents: done — the search index updates on the product events")
}
