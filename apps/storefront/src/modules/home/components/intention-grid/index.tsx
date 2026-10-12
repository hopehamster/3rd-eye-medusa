import LocalizedClientLink from "@modules/common/components/localized-client-link"

const INTENTIONS = [
  {
    intent: "protection",
    label: "Protection",
    description: "Shield your space and energy",
  },
  {
    intent: "abundance-prosperity",
    label: "Abundance",
    description: "Open the flow of prosperity",
  },
  {
    intent: "calm-soothing",
    label: "Calm",
    description: "Quiet the mind, soften the day",
  },
  {
    intent: "love-self",
    label: "Love",
    description: "For yourself or another",
  },
  {
    intent: "clarity-focus",
    label: "Clarity",
    description: "See your path clearly",
  },
  {
    intent: "sleep-dreams",
    label: "Sleep",
    description: "Restful nights, vivid dreams",
  },
]

const IntentionGrid = () => {
  return (
    <div className="content-container py-16">
      <div className="text-center mb-10">
        <p className="text-xs uppercase tracking-widest text-cosmos-gold mb-2">
          Shop by intention
        </p>
        <h2 className="text-3xl font-light font-display text-cosmos-text">
          What are you calling in?
        </h2>
      </div>
      <div className="grid grid-cols-2 small:grid-cols-3 gap-4">
        {INTENTIONS.map((item) => (
          <LocalizedClientLink
            key={item.intent}
            href={`/store?intent=${item.intent}`}
            className="group rounded-lg border border-cosmos-borderSoft bg-white/[0.02] p-6 text-center hover:border-cosmos-gold/50 hover:bg-white/[0.04] transition"
          >
            <h3 className="font-display text-lg text-cosmos-text group-hover:text-cosmos-goldBright transition">
              {item.label}
            </h3>
            <p className="text-sm text-cosmos-muted mt-1">{item.description}</p>
          </LocalizedClientLink>
        ))}
      </div>
    </div>
  )
}

export default IntentionGrid
