import LocalizedClientLink from "@modules/common/components/localized-client-link"

const INTENTIONS = [
  {
    intent: "protection",
    label: "Protection",
    description: "Shield your space and energy",
    image: "https://images.unsplash.com/photo-1566907722747-d16ed41b52bc?auto=format&fit=crop&w=600&q=80",
    crystal: "Black Tourmaline",
  },
  {
    intent: "abundance-prosperity",
    label: "Abundance",
    description: "Open the flow of prosperity",
    image: "https://images.unsplash.com/photo-1615114814213-a245ffc79e9a?auto=format&fit=crop&w=600&q=80",
    crystal: "Citrine",
  },
  {
    intent: "calm-soothing",
    label: "Calm",
    description: "Quiet the mind, soften the day",
    image: "https://images.unsplash.com/photo-1566907722747-d16ed41b52bc?auto=format&fit=crop&w=600&q=80",
    crystal: "Amethyst",
  },
  {
    intent: "love-self",
    label: "Love",
    description: "For yourself or another",
    image: "https://images.unsplash.com/photo-1587652990090-67c742c382ce?auto=format&fit=crop&w=600&q=80",
    crystal: "Rose Quartz",
  },
  {
    intent: "clarity-focus",
    label: "Clarity",
    description: "See your path clearly",
    image: "https://images.unsplash.com/photo-1587652990090-67c742c382ce?auto=format&fit=crop&w=600&q=80",
    crystal: "Clear Quartz",
  },
  {
    intent: "sleep-dreams",
    label: "Sleep",
    description: "Restful nights, vivid dreams",
    image: "https://images.unsplash.com/photo-1566907722747-d16ed41b52bc?auto=format&fit=crop&w=600&q=80",
    crystal: "Amethyst",
  },
]

const IntentionGrid = () => {
  return (
    <div className="content-container py-20">
      <div className="text-center mb-12">
        <p className="text-[11px] uppercase tracking-[0.35em] text-cosmos-gold mb-4">
          Shop by intention
        </p>
        <h2 className="font-display text-4xl small:text-5xl font-light text-cosmos-text tracking-tight">
          What are you <span className="italic text-cosmos-goldBright">calling in?</span>
        </h2>
        <p className="mt-4 text-cosmos-muted max-w-lg mx-auto">
          Every stone carries a frequency. Choose the energy you need, and let the right crystal find you.
        </p>
      </div>
      <div className="grid grid-cols-2 small:grid-cols-3 gap-5">
        {INTENTIONS.map((item) => (
          <LocalizedClientLink
            key={item.intent}
            href={`/store?intent=${item.intent}`}
            className="group relative overflow-hidden rounded-xl border border-cosmos-borderSoft bg-cosmos-surface transition-all duration-500 hover:border-cosmos-gold/60 hover:shadow-[0_0_40px_rgba(190,140,50,0.15)] hover:-translate-y-1"
          >
            {/* Background image */}
            <div className="absolute inset-0 overflow-hidden">
              <img
                src={item.image}
                alt={`${item.crystal} crystal`}
                loading="lazy"
                className="h-full w-full object-cover opacity-30 transition-all duration-700 group-hover:opacity-50 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0a0908] via-[#0a0908]/60 to-[#0a0908]/20" />
            </div>

            {/* Content */}
            <div className="relative z-10 p-6 small:p-8 text-center min-h-[200px] flex flex-col items-center justify-center">
              <p className="text-[10px] uppercase tracking-[0.25em] text-cosmos-gold/80 mb-2">
                {item.crystal}
              </p>
              <h3 className="font-display text-2xl small:text-2xl text-cosmos-text group-hover:text-cosmos-goldBright transition-colors duration-300">
                {item.label}
              </h3>
              <p className="text-sm text-cosmos-muted mt-2 leading-relaxed">
                {item.description}
              </p>
              <span className="mt-4 inline-block text-xs uppercase tracking-widest text-cosmos-gold opacity-0 -translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
                Explore →
              </span>
            </div>
          </LocalizedClientLink>
        ))}
      </div>
    </div>
  )
}

export default IntentionGrid
