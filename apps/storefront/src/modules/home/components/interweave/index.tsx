"use client"

import Image from "next/image"
import Reveal from "@modules/common/components/reveal"

/**
 * Interweave section — text flows THROUGH inline images.
 * The image is a word in the sentence, not a block beside text.
 * AI layouts never do this; it breaks every template's content model.
 */

const InlineImage = ({ src, alt }: { src: string; alt: string }) => (
  <span className="mx-2 inline-block h-[1.4em] w-[2.2em] overflow-hidden rounded-sm align-[-0.25em]">
    <Image
      src={src}
      alt={alt}
      width={120}
      height={80}
      loading="lazy"
      className="h-full w-full object-cover"
    />
  </span>
)

const Interweave = () => {
  return (
    <div className="border-y border-cosmos-borderSoft bg-[#0a0908]">
      <div className="content-container py-24 small:py-32">
        <Reveal>
          <p className="text-[11px] uppercase tracking-[0.35em] text-cosmos-gold mb-10">
            Chapter II — How we work
          </p>
        </Reveal>
        <Reveal delay={0.15}>
          <p className="font-display max-w-5xl text-3xl small:text-5xl font-light leading-[1.35] text-cosmos-text">
            Each stone is
            <InlineImage
              src="https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=200&q=70"
              alt="Amethyst cluster"
            />
            chosen by hand,
            <InlineImage
              src="https://images.unsplash.com/photo-1615114814213-a245ffc79e9a?auto=format&fit=crop&w=200&q=70"
              alt="Citrine crystal"
            />
            photographed in our studio,
            <InlineImage
              src="https://images.unsplash.com/photo-1587652990090-67c742c382ce?auto=format&fit=crop&w=200&q=70"
              alt="Clear quartz"
            />
            and shipped from Las Vegas.
            <span className="text-cosmos-goldBright"> No warehouses. No dropshippers. No mystery.</span>
          </p>
        </Reveal>
        <Reveal delay={0.3}>
          <p className="mt-12 font-display max-w-4xl text-2xl small:text-3xl font-light leading-[1.4] text-cosmos-muted">
            Fragile <span className="text-cosmos-faint">/</span>{" "}
            <span className="text-cosmos-text">unbreakable.</span>
            <br />
            Silent <span className="text-cosmos-faint">/</span>{" "}
            <span className="text-cosmos-text">speaking.</span>
          </p>
        </Reveal>
      </div>
    </div>
  )
}

export default Interweave
