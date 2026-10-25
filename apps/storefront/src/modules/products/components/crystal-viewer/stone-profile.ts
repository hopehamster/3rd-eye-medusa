/**
 * Stone profiles for the 3D crystal viewer.
 *
 * The viewer renders the STONE in 3D (not the bracelet) — a stone study the
 * shopper can turn in their hand. Each profile tunes the transmission
 * material and crystal habit from the product's title/handle keywords.
 * Anything unmatched falls back to a clear-quartz point.
 */

export type CrystalHabit = "point" | "tumbled" | "cluster"

export interface StoneProfile {
  /** Display name used in the viewer caption. */
  name: string
  /** Base tint of the transmission material. */
  color: string
  roughness: number
  transmission: number
  thickness: number
  ior: number
  habit: CrystalHabit
  /** Accent color for the rim/fill lights. */
  glow: string
}

const CLEAR_QUARTZ: StoneProfile = {
  name: "Clear quartz",
  color: "#eef3f2",
  roughness: 0.06,
  transmission: 1,
  thickness: 0.6,
  ior: 1.54,
  habit: "point",
  glow: "#cfe3e8",
}

const PROFILES: Array<[RegExp, StoneProfile]> = [
  [
    /moonstone/,
    {
      name: "Moonstone",
      color: "#e6edf4",
      roughness: 0.34,
      transmission: 0.85,
      thickness: 1.4,
      ior: 1.52,
      habit: "tumbled",
      glow: "#bcd4e8",
    },
  ],
  [
    /rose quartz|rosequartz/,
    {
      name: "Rose quartz",
      color: "#f3c6d3",
      roughness: 0.22,
      transmission: 0.9,
      thickness: 1.1,
      ior: 1.54,
      habit: "tumbled",
      glow: "#f0a8bd",
    },
  ],
  [
    /smoky/,
    {
      name: "Smoky quartz",
      color: "#6b5d54",
      roughness: 0.14,
      transmission: 0.9,
      thickness: 1.0,
      ior: 1.54,
      habit: "point",
      glow: "#a08b76",
    },
  ],
  [
    /obsidian/,
    {
      name: "Obsidian",
      color: "#1b1b22",
      roughness: 0.12,
      transmission: 0.3,
      thickness: 2.6,
      ior: 1.5,
      habit: "tumbled",
      glow: "#6a6a80",
    },
  ],
  [
    /amethyst/,
    {
      name: "Amethyst",
      color: "#8f6fc0",
      roughness: 0.15,
      transmission: 0.92,
      thickness: 1.0,
      ior: 1.54,
      habit: "point",
      glow: "#b49ae0",
    },
  ],
  [
    /citrine/,
    {
      name: "Citrine",
      color: "#e0a83e",
      roughness: 0.15,
      transmission: 0.92,
      thickness: 1.0,
      ior: 1.54,
      habit: "point",
      glow: "#f2c66d",
    },
  ],
  [
    /aquamarine/,
    {
      name: "Aquamarine",
      color: "#9fd4d8",
      roughness: 0.12,
      transmission: 0.95,
      thickness: 0.9,
      ior: 1.58,
      habit: "tumbled",
      glow: "#c4e8ea",
    },
  ],
  [
    /aventurine|jade/,
    {
      name: "Green aventurine",
      color: "#6fae7f",
      roughness: 0.28,
      transmission: 0.8,
      thickness: 1.3,
      ior: 1.54,
      habit: "tumbled",
      glow: "#9fd0a8",
    },
  ],
  [
    /red agate|carnelian/,
    {
      name: "Red agate",
      color: "#b64a32",
      roughness: 0.25,
      transmission: 0.85,
      thickness: 1.2,
      ior: 1.54,
      habit: "tumbled",
      glow: "#d98a68",
    },
  ],
  [
    /tiger/,
    {
      name: "Tiger's eye",
      color: "#8a5a28",
      roughness: 0.3,
      transmission: 0.55,
      thickness: 1.6,
      ior: 1.54,
      habit: "tumbled",
      glow: "#c99a55",
    },
  ],
  [
    /lapis/,
    {
      name: "Lapis lazuli",
      color: "#2a3f8f",
      roughness: 0.35,
      transmission: 0.4,
      thickness: 1.8,
      ior: 1.5,
      habit: "tumbled",
      glow: "#5a74c9",
    },
  ],
  [
    /selenite/,
    {
      name: "Selenite",
      color: "#f2efe8",
      roughness: 0.42,
      transmission: 0.7,
      thickness: 1.5,
      ior: 1.52,
      habit: "point",
      glow: "#e8e2d2",
    },
  ],
  [
    /kunzite/,
    {
      name: "Kunzite",
      color: "#e3b8d4",
      roughness: 0.18,
      transmission: 0.92,
      thickness: 1.0,
      ior: 1.56,
      habit: "tumbled",
      glow: "#f0cfe4",
    },
  ],
  [
    /garnet/,
    {
      name: "Garnet",
      color: "#7a1f2b",
      roughness: 0.15,
      transmission: 0.85,
      thickness: 1.1,
      ior: 1.72,
      habit: "tumbled",
      glow: "#b0505e",
    },
  ],
  [
    /opal/,
    {
      name: "Opal",
      color: "#ece7db",
      roughness: 0.3,
      transmission: 0.75,
      thickness: 1.4,
      ior: 1.45,
      habit: "tumbled",
      glow: "#d8ecf0",
    },
  ],
  [
    /chakra|seven.stone/,
    {
      name: "Chakra set",
      color: "#8f6fc0",
      roughness: 0.15,
      transmission: 0.92,
      thickness: 1.0,
      ior: 1.54,
      habit: "cluster",
      glow: "#c9b8e8",
    },
  ],
  [
    /quartz/,
    { ...CLEAR_QUARTZ },
  ],
]

/** Tints for the mini points in a cluster habit. */
export const CLUSTER_TINTS = [
  "#8f6fc0",
  "#e0a83e",
  "#9fd4d8",
  "#f3c6d3",
  "#6fae7f",
  "#eef3f2",
  "#b64a32",
]

export function getStoneProfile(title = "", handle = ""): StoneProfile {
  const s = `${title} ${handle}`.toLowerCase()
  for (const [re, profile] of PROFILES) {
    if (re.test(s)) return profile
  }
  return { ...CLEAR_QUARTZ, name: title.trim() || "Clear quartz" }
}
