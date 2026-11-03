/**
 * What counts as an on-brand product for 3rd Eye Supply: wellness and
 * metaphysical goods. Kept in one place so import and audit agree.
 */
export const STRONG_TERMS = [
  "chakra", "reiki", "tarot", "oracle card", "pendulum", "mala", "buddha",
  "zen", "meditation", "spiritual", "orgone", "incense", "smudge", "sage",
  "singing bowl", "tibetan", "feng shui", "astrolog", "zodiac", "affirmation",
  "manifest", "altar", "evil eye", "amulet", "healing", "aura", "ritual",
  "lotus", "crystal healing", "energy jewelry", "yoga", "aromatherapy",
  "essential oil", "gua sha", "jade roller",
]

export const MATERIAL_TERMS = [
  "crystal", "quartz", "amethyst", "obsidian", "moonstone", "citrine",
  "selenite", "tourmaline", "agate", "geode", "jade", "tiger eye",
  "labradorite", "fluorite", "garnet", "onyx", "aventurine", "rhodonite",
]

export const RITUAL_CONTEXT = [
  "bracelet", "necklace", "pendant", "ring", "earring", "bead", "anklet",
  "pyramid", "tree", "sphere", "point", "wand", "tumble", "stone", "chip",
  "bowl", "candle", "charm", "talisman", "cairn", "cluster", "skull",
]

export const BLOCK_TERMS = [
  "christmas", "halloween", "easter", "valentine", "beanie", "hat",
  "headband", "tumbler", "whiskey", "wine glass", "phone", "case for",
  "nail", "makeup", "lipstick", "lip liner", "mascara", "dress", "shirt",
  "shoes", "boot", "handbag", "wallet", "watch band", "tent", "blanket",
  "pillow", "tablecloth", "curtain", "tableware", "eye black", "disposable",
  "underwear", "bra ", "thong", "socks", "pants", "hoodie", "jacket",
]

/** True when a product name reads as wellness / metaphysical. */
export const qualifiesBrand = (name: string): boolean => {
  const n = name.toLowerCase()
  if (BLOCK_TERMS.some((t) => n.includes(t))) return false
  if (STRONG_TERMS.some((t) => n.includes(t))) return true
  const material = MATERIAL_TERMS.some((t) => n.includes(t))
  return material && RITUAL_CONTEXT.some((t) => n.includes(t))
}
