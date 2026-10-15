"use client"

import Image from "next/image"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import SpotlightCard from "@modules/common/components/spotlight-card"
import Reveal from "@modules/common/components/reveal"

// Six unique crystal photographs — no duplication
const INTENTIONS = [
  {
    intent: "protection",
    label: "Protection",
    description: "For when the world feels sharp",
    image: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=600&q=80",
    crystal: "Black Tourmaline",
  },
  {
    intent: "abundance-prosperity",
    label: "Abundance",
    description: "Money likes attention. Give it some.",
    image: "https://images.unsplash.com/photo-1615114814213-a245ffc79e9a?auto=format&fit=crop&w=600&q=80",
    crystal: "Citrine",
  },
  {
    intent: "calm-soothing",
    label: "Calm",
    description: "Your nervous system will thank you",
    image: "https://images.unsplash.com/photo-1599707367072-cd6ada2bc375?auto=format&fit=crop&w=600&q=80",
    crystal: "Amethyst",
  },
  {
    intent: "love-self",
    label: "Love",
    description: "Start with the person in the mirror",
    image: "https://images.unsplash.com/photo-1567113463300-102a7eb3cb26?auto=format&fit=crop&w=600&q=80",
    crystal: "Rose Quartz",
  },
  {
    intent: "clarity-focus",
    label: "Clarity",
    description: "Cut through your own noise",
    image: "https://images.unsplash.com/photo-1617038220319-276d3cfab638?auto=format&fit=crop&w=600&q=80",
    crystal: "Clear Quartz",
  },
  {
    intent: "sleep-dreams",
    label: "Sleep",
    description: "Your brain needs the dark too",
    image: "https://images.unsplash.com/photo-1602523961358-f9f03dd557db?auto=format&fit=crop&w=600&q=80",
    crystal: "Selenite",
  },
]

const IntentionGrid = () => {
  return (
    <div className="content-container py-20">
      <Reveal className="mb-12">
        <p className="text-[11px] uppercase tracking-[0.35em] text-cosmos-gold mb-4">
          Chapter I — The Stones
        </p>
        <h2 className="font-display text-4xl small:text-5xl font-light text-cosmos-text tracking-tight">
          What are you trying to <span className="italic text-cosmos-goldBright">fix?</span>
        </h2>
        <p className="mt-4 text-cosmos-muted max-w-lg">
          Pick the problem. We&apos;ll point at the stone.
        </p>
      </Reveal>
      <div className="grid grid-cols-2 small:grid-cols-3 gap-5">
        {INTENTIONS.map((item, i) => (
          <Reveal key={item.intent} delay={(i % 3) * 0.1}>
            <LocalizedClientLink href={`/store?intent=${item.intent}`}>
              <SpotlightCard className="rounded-xl border border-cosmos-borderSoft bg-cosmos-surface transition-all duration-500 hover:border-cosmos-gold/60 hover:-translate-y-1">
                <div className="relative overflow-hidden">
                  <Image
                    src={item.image}
                    alt={`${item.crystal} crystal`}
                    width={600}
                    height={400}
                    loading="lazy"
                    sizes="(max-width: 640px) 50vw, 33vw"
                    className="h-40 small:h-48 w-full object-cover opacity-60 transition-all duration-700 group-hover/spot:opacity-80 group-hover/spot:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0a0908] via-[#0a0908]/40 to-transparent" />
                </div>
                <div className="relative p-6 text-center">
                  <p className="text-[10px] uppercase tracking-[0.25em] text-cosmos-gold/80 mb-2">
                    {item.crystal}
                  </p>
                  <h3 className="font-display text-2xl text-cosmos-text">
                    {item.label}
                  </h3>
                  <p className="text-sm text-cosmos-muted mt-2 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </SpotlightCard>
            </LocalizedClientLink>
          </Reveal>
        ))}
      </div>
    </div>
  )
}

export default IntentionGrid
