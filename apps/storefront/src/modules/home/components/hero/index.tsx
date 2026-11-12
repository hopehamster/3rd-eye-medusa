"use client"

import Image from "next/image"
import { motion, useReducedMotion } from "framer-motion"
import { HttpTypes } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

/**
 * Homepage hero — Bright Apothecary (issue #21).
 *
 * Daylight photo of a real stone, plain headline, one specific claim.
 * No eyebrow caption, no centered cosmic type, no glow effects.
 *
 * Headline is two deliberate lines at every width (issue #144). It used to
 * run three lines at 1440 and five at 390 and push the CTA to the fold edge.
 * The cut clause — "Nothing promised but the stone itself." — opens the
 * supporting paragraph instead, so the voice still reads as a decision.
 *
 * Photo: a real product from the catalogue, chosen in
 * modules/home/data/featured.ts and captioned from its own listing (#145
 * follow-up). It used to be a hard-coded third-party URL, which meant the
 * biggest image on the site was not something the shop sells.
 *
 * Entrance (issue #198): on arrival the headline rises a few pixels and
 * fades in, then the photo, then the buttons, one after another over about
 * a second. Quiet and short — each step is half a second. No glow effects.
 *
 * Reduced motion: when the user prefers reduced motion, the entrance is
 * skipped entirely — the hero renders in its final state, no fade, no
 * rise, no stagger delays (same pattern as the store tiles, issue #203).
 */
const Hero = ({ product }: { product: HttpTypes.StoreProduct | null }) => {
  const prefersReducedMotion = useReducedMotion()
  const picture = product?.thumbnail || product?.images?.[0]?.url || null
  const caption = product?.title?.trim() || null
  const material = product?.material?.trim() || "natural stone"

  return (
    <section className="bg-paper-bg paper-grain text-paper-text">
      <div className="content-container relative z-[2] grid grid-cols-1 items-center gap-10 py-16 small:grid-cols-2 small:gap-14 small:py-24">
        <div>
          <motion.div
            initial={
              prefersReducedMotion ? false : { opacity: 0, y: 8 }
            }
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            <h1 className="font-display text-5xl font-light leading-[1.05] tracking-tight text-paper-text small:text-6xl">
              Real stones.
              <br />
              Plain talk.
            </h1>
            <p className="mt-6 max-w-md font-humanist text-lg leading-8 text-paper-muted">
              Nothing promised but the stone itself. Bracelets, sets, and small
              ritual objects in natural stone. Every piece is described the way
              it actually is — color, cut, weight, and what people have
              traditionally reached for it for.
            </p>
          </motion.div>
          <motion.div
            initial={
              prefersReducedMotion ? false : { opacity: 0, y: 8 }
            }
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.5,
              ease: "easeOut",
              delay: prefersReducedMotion ? 0 : 0.5,
            }}
            className="mt-9 flex flex-col gap-3 xsmall:flex-row xsmall:items-center"
          >
            <LocalizedClientLink
              href="/store"
              className="inline-flex items-center justify-center bg-paper-accent px-7 py-3.5 font-humanist text-sm font-semibold tracking-wide text-paper-raised transition-colors duration-200 hover:bg-paper-accentBright"
            >
              Browse the shelves
            </LocalizedClientLink>
            <LocalizedClientLink
              href="/oracle"
              className="inline-flex items-center justify-center border border-paper-border px-7 py-3.5 font-humanist text-sm font-semibold tracking-wide text-paper-text transition-colors duration-200 hover:border-paper-accent hover:text-paper-accent"
            >
              Not sure where to begin?
            </LocalizedClientLink>
          </motion.div>
        </div>

        {picture && (
          <motion.div
            initial={
              prefersReducedMotion ? false : { opacity: 0, y: 8 }
            }
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.5,
              ease: "easeOut",
              delay: prefersReducedMotion ? 0 : 0.25,
            }}
          >
            <LocalizedClientLink
              href={product?.handle ? `/products/${product.handle}` : "/store"}
              className="specimen-card block overflow-hidden"
            >
              <div className="relative aspect-[4/3] w-full">
                <Image
                  src={picture}
                  alt={caption ? `${caption}, ${material}` : "A piece from the shop"}
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover"
                />
              </div>
              <div className="specimen-label mx-5 my-4 flex items-baseline justify-between gap-4">
                <span>{caption}</span>
                <span className="font-humanist text-sm text-paper-muted">
                  {material}
                </span>
              </div>
            </LocalizedClientLink>
          </motion.div>
        )}
      </div>
    </section>
  )
}

export default Hero
