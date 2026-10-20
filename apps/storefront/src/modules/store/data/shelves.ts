/**
 * Intention shelves.
 *
 * Curated editorial presentations over the existing product/intent plumbing.
 * The six slugs match the homepage intention-grid taxonomy and the intent
 * values used by the store's `?intent=` refinement (INTENTS_ATTRIBUTE).
 *
 * Product selection (see filterShelfProducts):
 *  1. Products whose metadata.intents include the shelf slug win first.
 *     (Product metadata carries no intents yet; this takes over the moment
 *     the catalog gets tagged, with no code change.)
 *  2. Until then, the curated `handles` list below decides membership.
 *
 * COPY STATUS: headlines, intros and usage bullets are honest placeholders
 * (no medical claims) written by Agent Shelves. Agent Voice (#26) owns the
 * final copy — every string in a shelf definition is a slot to replace.
 */

export type ShelfDefinition = {
  /** Intent slug — matches intention-grid taxonomy */
  intent: string
  /** Shelf name, e.g. "Protection" */
  label: string
  stone: string
  headline: string
  intro: string
  heroImage: string
  heroAlt: string
  usageTitle: string
  usage: string[]
  /** Curated product handles, in display order */
  handles: string[]
}

export const SHELVES: ShelfDefinition[] = [
  {
    intent: "protection",
    label: "Protection",
    stone: "Black Tourmaline",
    headline: "A little armor for the day",
    intro:
      "Some days the world feels sharp. These are the stones people reach for when they want to feel steady: worn at the wrist, kept in a pocket, set by the front door.",
    heroImage:
      "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1600&q=80",
    heroAlt: "Dark tourmaline crystals in daylight",
    usageTitle: "How people use these",
    usage: [
      "Wear the bracelet through the day and take it off when you get home.",
      "Keep the pendant in your bag or by the front door, where you will actually see it.",
      "Hold the stone in your palm for a quiet minute when the noise gets loud.",
    ],
    handles: [
      "silver-obsidian-root-chakra-bracelet-purification-protection",
      "red-agate-root-chakra-bracelet-grounding-security",
      "tree-of-life-pendant-necklace-7-chakra-natural-gemstone-crystal-stones-healing",
    ],
  },
  {
    intent: "abundance-prosperity",
    label: "Abundance",
    stone: "Citrine",
    headline: "Room for good things",
    intro:
      "Prosperity is partly a mindset and partly just having things around you that you chose on purpose. These are the pieces customers buy when they are redecorating, goal-setting, or treating themselves deliberately.",
    heroImage:
      "https://images.unsplash.com/photo-1615114814213-a245ffc79e9a?auto=format&fit=crop&w=1600&q=80",
    heroAlt: "Golden citrine crystals in warm light",
    usageTitle: "How people use these",
    usage: [
      "Set the pyramid where you will see it every morning, not in a drawer.",
      "Wear the pendant on days when you want a confidence cue.",
      "Gift one to someone who is starting something new.",
    ],
    handles: [
      "crystal-pyramid-home-decor-ornament",
      "natural-crystal-hexagonal-cone-rose-quartz-tigers-eye-pendulum-natural",
      "natural-stone-three-dimensional-hexagonal-pendulum-necklace",
    ],
  },
  {
    intent: "calm-soothing",
    label: "Calm",
    stone: "Amethyst",
    headline: "Turn the volume down",
    intro:
      "Amethyst has been the wind-down stone for a long time. These are the pieces that live by the bed, in the car, and wherever the day runs hot.",
    heroImage:
      "https://images.unsplash.com/photo-1599707367072-cd6ada2bc375?auto=format&fit=crop&w=1600&q=80",
    heroAlt: "Amethyst crystal in soft daylight",
    usageTitle: "How people use these",
    usage: [
      "Rest the mala beads on your nightstand so the evening ends with them, not your phone.",
      "Do slow breathing with the bracelet in your hand: in for four, out for six.",
      "Leave one piece in the room where you unwind, and leave it there.",
    ],
    handles: [
      "natural-lavender-amethyst-clear-quartz-bracelet-round-beaded-chain-wisdom-energy-jewelry-for-women",
      "natural-amethyst-bracelet-108-mala-beads-clear-quartz-spacer-multi-layer-chain-u",
      "tibetan-style-six-syllable-mantra-braided-bracelet-with-s925-silver",
      "natural-aquamarine-rose-quartz-bracelet-amethyst-multi-stone-beaded-chain-water",
    ],
  },
  {
    intent: "love-self",
    label: "Love",
    stone: "Rose Quartz",
    headline: "Start with the person in the mirror",
    intro:
      "Rose quartz is the self-love classic for a reason: it is soft, pink, and hard to ignore on a dresser. These pieces are reminders as much as they are jewelry.",
    heroImage:
      "https://images.unsplash.com/photo-1567113463300-102a7eb3cb26?auto=format&fit=crop&w=1600&q=80",
    heroAlt: "Rose quartz in warm daylight",
    usageTitle: "How people use these",
    usage: [
      "Wear the bracelet daily; let it be the reminder, not the fix.",
      "Tuck the pendulum into your morning routine, next to the mirror.",
      "Gift the set to a friend who needs the nudge more than you do.",
    ],
    handles: [
      "rose-quartz-heart-chakra-bracelet-self-love-emotional-healing",
      "green-crystal-heart-chakra-bracelet-stress-release-vitality",
      "natural-aquamarine-rose-quartz-bracelet-amethyst-multi-stone-beaded-chain-water",
      "natural-crystal-hexagonal-cone-rose-quartz-tigers-eye-pendulum-natural",
    ],
  },
  {
    intent: "clarity-focus",
    label: "Clarity",
    stone: "Clear Quartz",
    headline: "Cut through your own noise",
    intro:
      "Clear quartz and amethyst are the desk stones: the ones that live next to the keyboard and the notebook. For days when your own head is the loudest thing in the room.",
    heroImage:
      "https://images.unsplash.com/photo-1617038220319-276d3cfab638?auto=format&fit=crop&w=1600&q=80",
    heroAlt: "Clear quartz point catching daylight",
    usageTitle: "How people use these",
    usage: [
      "Keep one piece on the desk where you work, in sight line.",
      "Carry the mala on a walk when you need to think something through.",
      "Set the pendant near your journal or planner so it gets used.",
    ],
    handles: [
      "bolivian-amethyst-crown-chakra-bracelet-clarity-wisdom",
      "clear-quartz-aquamarine-throat-chakra-bracelet-expression-reconciliation",
      "kunzite-crown-chakra-set-deep-awakening-spiritual-healing",
      "tarot-card-stainless-steel-pendant-necklace",
      "multi-gemstone-all-chakra-set-holistic-balance-energy-alignment",
    ],
  },
  {
    intent: "sleep-dreams",
    label: "Sleep",
    stone: "Selenite",
    headline: "Your brain needs the dark too",
    intro:
      "Moonstone is the bedtime stone in a lot of traditions. These are the pieces customers buy for the nightstand: the wind-down shelf.",
    heroImage:
      "https://images.unsplash.com/photo-1602523961358-f9f03dd557db?auto=format&fit=crop&w=1600&q=80",
    heroAlt: "Pale moonstone in evening light",
    usageTitle: "How people use these",
    usage: [
      "Keep the bracelet on the nightstand at night instead of on your wrist.",
      "Dim the lights an hour before bed and let the room do the work.",
      "Pair the ritual with a no-phone-before-bed rule for a week and see.",
    ],
    handles: [
      "gray-moonstone-throat-chakra-bracelet-anxiety-relief-sleep-aid",
      "natural-amethyst-bracelet-108-mala-beads-clear-quartz-spacer-multi-layer-chain-u",
      "crystal-pyramid-home-decor-ornament",
    ],
  },
]

export const getShelf = (intent: string): ShelfDefinition | undefined =>
  SHELVES.find((s) => s.intent === intent)

const productIntents = (product: {
  metadata?: Record<string, unknown> | null
}): string[] => {
  const raw = product.metadata?.intents
  if (Array.isArray(raw)) {
    return raw.map((v) => String(v).trim().toLowerCase()).filter(Boolean)
  }
  if (typeof raw === "string") {
    return raw
      .split(",")
      .map((v) => v.trim().toLowerCase())
      .filter(Boolean)
  }
  return []
}

/**
 * Products belonging to a shelf. Metadata intents win; the curated handle
 * list fills membership until the catalog is tagged. Curated order is kept.
 */
export const filterShelfProducts = <
  T extends { handle?: string | null; metadata?: Record<string, unknown> | null }
>(
  products: T[],
  shelf: ShelfDefinition
): T[] => {
  const byHandle = new Map<string, T>()
  for (const p of products) {
    if (p.handle) byHandle.set(p.handle, p)
  }

  const curated: T[] = []
  const curatedSet = new Set<string>()
  for (const handle of shelf.handles) {
    const p = byHandle.get(handle)
    if (p) {
      curated.push(p)
      curatedSet.add(handle)
    }
  }

  const tagged = products.filter(
    (p) =>
      p.handle &&
      !curatedSet.has(p.handle) &&
      productIntents(p).includes(shelf.intent)
  )

  return [...curated, ...tagged]
}
