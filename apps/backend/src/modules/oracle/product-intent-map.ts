/**
 * Intent tag mapping for the launch catalog (imported 2026-10-11, 11 products).
 *
 * Source: workspace/catalog/medusa-products.json
 * Usage: the CJ/catalog import workflow applies these as `intent:<id>` product
 * tags. New products must get 1-3 intent tags before leaving draft (see taxonomy.ts).
 *
 * Keyed by exact product title.
 */
export const PRODUCT_INTENT_MAP: Record<string, string[]> = {
  "Handcrafted Wood Ring": [
    "grounding",
    "confidence-courage",
    "spiritual-connection-ritual",
  ],
  "Orgone Angel": [
    "spiritual-connection-ritual",
    "protection",
    "calm-soothing",
  ],
  "Crystal Tree — Green Aventurine": [
    "abundance-prosperity",
    "calm-soothing",
    "spiritual-connection-ritual",
  ],
  "Crystal Stud Earrings": [
    "confidence-courage",
    "energy-chakra-balancing",
    "love-self",
  ],
  "3rd Eye Leggings": [
    "intuition-third-eye",
    "confidence-courage",
    "grounding",
  ],
  "Crystal Ring": [
    "energy-chakra-balancing",
    "love-self",
    "protection",
  ],
  "Orgone Pyramid": [
    "protection",
    "energy-chakra-balancing",
    "cleansing-purification",
  ],
  "Orgone Buddha": [
    "calm-soothing",
    "spiritual-connection-ritual",
    "grounding",
  ],
  "Orgone Starfish": [
    "creativity-inspiration",
    "calm-soothing",
  ],
  "Stone Protection Pouch": [
    "protection",
    "grounding",
  ],
}
