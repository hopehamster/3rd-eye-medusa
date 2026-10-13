/**
 * The Oracle intent taxonomy — the join table between human needs and the catalog.
 *
 * RULES:
 * - Intents are stable and few. Products scale; intents don't. Add a new intent
 *   only when several products genuinely fit nowhere existing. (15 intents as of 2026-10-11.)
 * - Every product needs 1-3 `intent:<id>` tags before it leaves draft status.
 * - The Oracle's classifier is constrained to these ids — it may never invent one.
 */

export interface OracleIntent {
  id: string
  name: string
  description: string
  examplePhrases: string[]
  productCategories: string[]
  knowledgeTopics: string[]
  followups: string[]
}

export const ORACLE_INTENTS: OracleIntent[] = [
  {
    id: "protection",
    name: "Protection",
    description: "Feeling unsafe, heavy energy, new space, travel, psychic shielding",
    examplePhrases: [
      "I need protection for my new apartment",
      "I feel like I'm absorbing everyone's bad energy",
      "something for safe travel",
    ],
    productCategories: ["Crystals & Stones", "Jewelry & Amulets", "Candles", "Herbs & Botanicals"],
    knowledgeTopics: ["psychic shielding basics", "warding a home", "black tourmaline", "evil eye"],
    followups: ["Is this for your home, yourself, or travel?"],
  },
  {
    id: "cleansing-purification",
    name: "Cleansing & Purification",
    description: "Stale energy, reset after conflict or illness, clearing a space or object",
    examplePhrases: [
      "how do I cleanse my crystals",
      "my house feels heavy after guests leave",
      "I need an energetic reset",
    ],
    productCategories: ["Herbs & Botanicals", "Incense & Resins", "Crystals & Stones", "Bath & Body"],
    knowledgeTopics: ["smoke cleansing", "selenite cleansing", "salt cleansing", "sound cleansing"],
    followups: ["Are you cleansing a space, an object, or yourself?"],
  },
  {
    id: "grounding",
    name: "Grounding",
    description: "Scattered, anxious, overthinking, unrooted, too much head energy",
    examplePhrases: [
      "I've been feeling scattered lately",
      "I can't get out of my head",
      "I need to feel rooted",
    ],
    productCategories: ["Crystals & Stones", "Oils & Sprays", "Herbs & Botanicals"],
    knowledgeTopics: ["grounding techniques", "root chakra", "hematite", "barefoot grounding"],
    followups: [],
  },
  {
    id: "clarity-focus",
    name: "Clarity & Focus",
    description: "Brain fog, big decisions, studying, cutting through confusion",
    examplePhrases: [
      "I can't think straight lately",
      "I have a big decision to make",
      "help me focus on work",
    ],
    productCategories: ["Crystals & Stones", "Oils & Sprays", "Candles"],
    knowledgeTopics: ["fluorite", "meditation for clarity", "journaling prompts for decisions"],
    followups: ["Is this about a specific decision or general focus?"],
  },
  {
    id: "calm-soothing",
    name: "Calm & Soothing",
    description: "Stress, racing thoughts, trouble unwinding, nervous tension",
    examplePhrases: [
      "I'm so stressed I can't relax",
      "my mind won't stop racing at night",
      "I need to unwind",
    ],
    productCategories: ["Crystals & Stones", "Herbs & Botanicals", "Bath & Body", "Candles"],
    knowledgeTopics: ["amethyst", "lavender", "evening wind-down ritual", "breathwork basics"],
    followups: [],
  },
  {
    id: "love-self",
    name: "Self-Love",
    description: "Self-worth, heartbreak recovery, softness toward oneself",
    examplePhrases: [
      "I'm too hard on myself",
      "getting over a breakup",
      "I want to love myself more",
    ],
    productCategories: ["Crystals & Stones", "Ritual Kits", "Oils & Sprays", "Books & Journals"],
    knowledgeTopics: ["rose quartz", "self-love ritual", "heart chakra healing"],
    followups: [],
  },
  {
    id: "love-romantic",
    name: "Romantic Love",
    description: "Attraction, partnership, calling love in, deepening connection",
    examplePhrases: [
      "I want to attract love",
      "something to deepen my relationship",
      "love drawing work",
    ],
    productCategories: ["Crystals & Stones", "Candles", "Herbs & Botanicals"],
    knowledgeTopics: ["rhodonite", "love drawing ethics (no targeting specific people)", "venus work"],
    followups: [],
  },
  {
    id: "abundance-prosperity",
    name: "Abundance & Prosperity",
    description: "Money goals, new ventures, luck, opportunity",
    examplePhrases: [
      "I need luck with money",
      "starting a new business",
      "abundance ritual",
    ],
    productCategories: ["Crystals & Stones", "Candles", "Oils & Sprays"],
    knowledgeTopics: ["citrine", "pyrite", "money bowl", "abundance mindset vs spellwork"],
    followups: [],
  },
  {
    id: "intuition-third-eye",
    name: "Intuition & Third-Eye Work",
    description: "Psychic development, dreamwork, meditation depth, inner sight",
    examplePhrases: [
      "I want to develop my intuition",
      "how do I open my third eye safely",
      "my dreams feel meaningful",
    ],
    productCategories: ["Crystals & Stones", "Herbs & Botanicals", "Oils & Sprays", "Tarot & Oracle Decks"],
    knowledgeTopics: ["third eye chakra", "mugwort", "dream journaling", "grounding before psychic work"],
    followups: [],
  },
  {
    id: "sleep-dreams",
    name: "Sleep & Dreams",
    description: "Insomnia, vivid dreams, nightmares, dream recall",
    examplePhrases: [
      "I can't fall asleep",
      "I keep having nightmares",
      "I want to remember my dreams",
    ],
    productCategories: ["Crystals & Stones", "Herbs & Botanicals", "Bath & Body", "Books & Journals"],
    knowledgeTopics: ["moonstone", "dream pillows", "sleep hygiene ritual", "nightmare protection"],
    followups: ["Trouble falling asleep, staying asleep, or the dreams themselves?"],
  },
  {
    id: "energy-chakra-balancing",
    name: "Energy & Chakra Balancing",
    description: "Feeling blocked, sluggish, out of alignment, general tune-up",
    examplePhrases: [
      "I feel blocked energetically",
      "I need a full chakra tune-up",
      "my energy feels off",
    ],
    productCategories: ["Crystals & Stones", "Candles", "Oils & Sprays", "Ritual Kits"],
    knowledgeTopics: ["seven chakras overview", "chakra scanning basics", "balancing vs clearing"],
    followups: [],
  },
  {
    id: "grief-healing",
    name: "Grief & Emotional Healing",
    description: "Loss, heartbreak, heavy heart, emotional recovery",
    examplePhrases: [
      "I'm grieving",
      "my heart feels heavy",
      "healing after loss",
    ],
    productCategories: ["Crystals & Stones", "Herbs & Botanicals", "Candles"],
    knowledgeTopics: ["apache tear", "grief rituals across traditions", "when to seek support"],
    followups: [],
  },
  {
    id: "confidence-courage",
    name: "Confidence & Courage",
    description: "Interviews, difficult conversations, visibility, new steps",
    examplePhrases: [
      "I have a big interview",
      "I need courage for a hard conversation",
      "I want to feel more confident",
    ],
    productCategories: ["Crystals & Stones", "Oils & Sprays", "Candles"],
    knowledgeTopics: ["tiger's eye", "solar plexus chakra", "courage ritual"],
    followups: [],
  },
  {
    id: "creativity-inspiration",
    name: "Creativity & Inspiration",
    description: "Creative blocks, new projects, artistic spark",
    examplePhrases: [
      "I'm creatively blocked",
      "I need inspiration for a project",
      "spark my imagination",
    ],
    productCategories: ["Crystals & Stones", "Candles", "Tarot & Oracle Decks"],
    knowledgeTopics: ["carnelian", "sacral chakra", "unblocking ritual"],
    followups: [],
  },
  {
    id: "spiritual-connection-ritual",
    name: "Spiritual Connection & Ritual",
    description: "Altars, moon work, ancestor veneration, Sabbats, devotional practice",
    examplePhrases: [
      "I want to set up my first altar",
      "what do I do for the full moon",
      "I want to honor my ancestors",
    ],
    productCategories: ["Altar Tools", "Candles", "Ritual Kits", "Herbs & Botanicals"],
    knowledgeTopics: ["altar setup basics", "moon phase workings", "ancestor veneration", "sabbat wheel"],
    followups: ["Are you working with moon phases, ancestors, or a deity?"],
  },
]

export const ORACLE_INTENT_IDS = ORACLE_INTENTS.map((i) => i.id)

export function getIntent(id: string): OracleIntent | undefined {
  return ORACLE_INTENTS.find((i) => i.id === id)
}

/** Tag value used on Medusa products, e.g. `intent:protection`. */
export function intentTag(id: string): string {
  return `intent:${id}`
}
