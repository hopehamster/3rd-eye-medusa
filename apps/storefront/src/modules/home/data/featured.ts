/**
 * The piece the homepage hero shows.
 *
 * This is an editorial slot: the hero displays a real product from the
 * catalogue, captioned from that product's own listing, so the first thing a
 * visitor sees is something they can actually buy. Point it at whichever piece
 * deserves the window; the first handle that exists and carries a photo wins,
 * and if none of them resolve the hero renders without a picture rather than
 * with a borrowed one.
 *
 * It replaced a hard-coded i.imgur.com URL, which was the largest image on the
 * site and had nothing to do with the catalogue.
 */
export const FEATURED_HERO_HANDLES = [
  "gray-moonstone-throat-chakra-bracelet-anxiety-relief-sleep-aid",
  "rose-quartz-heart-chakra-bracelet-self-love-emotional-healing",
  "silver-obsidian-root-chakra-bracelet-purification-protection",
] as const
