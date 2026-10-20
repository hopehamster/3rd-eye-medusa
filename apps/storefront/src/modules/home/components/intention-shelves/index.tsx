import Image from "next/image"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Reveal from "@modules/common/components/reveal"

/**
 * Intention shelves (issue #21) — curated shelves with editorial names,
 * replacing the bare product grid as the way in. Slugs match the
 * existing intention taxonomy in product metadata.
 *
 * LINK CONTRACT: cards link to the dedicated shelf pages built by
 * Agent Shelves (issue #23): /store/shelf/<intent>.
 *
 * Photography is the current Unsplash set; Agent Daylight (issue #22)
 * owns the replacement daylight photography pass.
 * Shelf names/descriptions are placeholders for Agent Voice (issue #26).
 */
const SHELVES = [
  {
    intent: "protection",
    shelf: "Guard & Ground",
    label: "Protection",
    description: "Stones for the door, the car, and the travel bag.",
    image:
      "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=600&q=80",
    crystal: "Black Tourmaline",
  },
  {
    intent: "abundance-prosperity",
    shelf: "The Full Cup",
    label: "Abundance",
    description: "Stones for work, money, and momentum.",
    image:
      "https://images.unsplash.com/photo-1615114814213-a245ffc79e9a?auto=format&fit=crop&w=600&q=80",
    crystal: "Citrine",
  },
  {
    intent: "calm-soothing",
    shelf: "Quiet Hours",
    label: "Calm",
    description: "Stones for loud weeks and busy rooms.",
    image:
      "https://images.unsplash.com/photo-1599707367072-cd6ada2bc375?auto=format&fit=crop&w=600&q=80",
    crystal: "Amethyst",
  },
  {
    intent: "love-self",
    shelf: "Open Heart",
    label: "Love",
    description: "Stones for the person in the mirror.",
    image:
      "https://images.unsplash.com/photo-1567113463300-102a7eb3cb26?auto=format&fit=crop&w=600&q=80",
    crystal: "Rose Quartz",
  },
  {
    intent: "clarity-focus",
    shelf: "Clear Water",
    label: "Clarity",
    description: "Stones for foggy mornings and big decisions.",
    image:
      "https://images.unsplash.com/photo-1617038220319-276d3cfab638?auto=format&fit=crop&w=600&q=80",
    crystal: "Clear Quartz",
  },
  {
    intent: "sleep-dreams",
    shelf: "The Night Table",
    label: "Sleep",
    description: "Stones for the bedside and the dark.",
    image:
      "https://images.unsplash.com/photo-1602523961358-f9f03dd557db?auto=format&fit=crop&w=600&q=80",
    crystal: "Selenite",
  },
]

const IntentionShelves = () => {
  return (
    <section className="bg-paper-bg paper-grain text-paper-text">
      <div className="content-container relative z-[2] py-16 small:py-24">
        <div className="mb-10 max-w-2xl">
          <h2 className="font-display text-4xl font-light tracking-tight text-paper-text small:text-5xl">
            Start with the problem. We will point at the stone.
          </h2>
          <p className="mt-4 font-humanist text-base leading-7 text-paper-muted">
            The shelves are organized the way people actually ask for help —
            by what they are dealing with, not by mineral names.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 xsmall:grid-cols-2 small:grid-cols-3">
          {SHELVES.map((item, i) => (
            <Reveal key={item.intent} delay={(i % 3) * 0.08}>
              <LocalizedClientLink
                href={`/store/shelf/${item.intent}`}
                className="group block"
              >
                <article className="specimen-card overflow-hidden transition-colors duration-200 group-hover:border-paper-accent">
                  <div className="relative aspect-[3/2] w-full overflow-hidden">
                    <Image
                      src={item.image}
                      alt={`${item.crystal} crystal`}
                      fill
                      loading="lazy"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      className="object-cover"
                    />
                  </div>
                  <div className="px-5 pb-5 pt-4">
                    <div className="specimen-label flex items-baseline justify-between gap-3">
                      <span>{item.shelf}</span>
                      <span className="font-humanist text-sm text-paper-faint">
                        {item.label}
                      </span>
                    </div>
                    <p className="specimen-meta mt-3">{item.description}</p>
                    <p className="mt-3 font-humanist text-sm font-semibold text-paper-accent">
                      Shop the shelf
                    </p>
                  </div>
                </article>
              </LocalizedClientLink>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

export default IntentionShelves
