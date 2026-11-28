"use client"

import Image from "next/image"
import { motion, useReducedMotion } from "framer-motion"
import { HttpTypes } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

/**
 * Homepage hero — Bright Apothecary (issue #21).
 *
 * Daylight photo of a real stone, plain headline, one specific claim.
 * No centered cosmic type, no glow effects.
 *
 * Positioning (2026-11-28): the eyebrow carries the store's claim —
 * the first and only AI-powered metaphysical wellness store — above
 * the unchanged headline. The Oracles are the primary button now;
 * the shelves are the second door.
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
 *
 * Slow drift (issue #209): the photo breathes almost imperceptibly,
 * growing from 100% to 103% and back over about 20 seconds. The scale
 * runs on the photo wrapper inside the overflow-hidden card, so the
 * edges crop slightly as it grows. No glow effects. With reduced
 * motion the drift is off — the photo stays at 100%.
 *
 * Fountain (issue #331): the zen fountain video runs behind the whole
 * homepage (modules/home/components/fountain-background).
 *
 * Platter & Aperture (issue #335): the paper gradient scrim the hero
 * used to lay over the water is gone. The copy column now sits on a
 * solid paper plaque, so the headline stays crisp, and the right
 * side of the hero is open water around the product card. The
 * headline, copy, buttons, and product card are unchanged.
 */
const Hero = ({ product }: { product: HttpTypes.StoreProduct | null }) => {
  const prefersReducedMotion = useReducedMotion()
  const picture = product?.thumbnail || product?.images?.[0]?.url || null
  const caption = product?.title?.trim() || null
  const material = product?.material?.trim() || "natural stone"

  return (
    <section className="relative border-b border-paper-border paper-grain text-paper-text">
      <div className="content-container relative z-[2] grid grid-cols-1 items-center gap-10 py-20 small:grid-cols-2 small:gap-14 sm:py-28">
        <div className="rounded-specimen border border-paper-border bg-paper-bg/95 p-8 sm:p-12">
          <motion.div
            initial={
              prefersReducedMotion ? false : { opacity: 0, y: 8 }
            }
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            <p className="mb-5 font-humanist text-[12px] font-semibold uppercase tracking-[0.18em] text-paper-accent">
              The first and only AI-powered metaphysical wellness store.
            </p>
            <h1 className="font-display text-[48px] font-normal leading-[1.05] tracking-tight text-paper-text sm:text-[64px]">
              Real stones.
              <br />
              Plain talk.
            </h1>
            <p className="mt-6 max-w-md font-humanist text-[16px] leading-relaxed text-paper-muted sm:text-[18px]">
              Nothing promised but the stone itself. And something no other
              crystal shop has: a counter staffed by AI guides who know
              every stone on our shelves. Tell them what is going on in
              your own words — they will point you at the right stone, and
              tell you which ones to skip. Bracelets, sets, and small ritual
              objects in natural stone, every piece described the way it
              actually is — color, cut, weight, and what people have
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
            className="mt-9 flex flex-wrap items-center gap-4"
          >
            <LocalizedClientLink
              href="/oracle"
              className="inline-flex h-12 items-center justify-center rounded-specimen bg-paper-accent px-8 font-humanist text-[12px] font-semibold uppercase tracking-wider text-paper-raised transition-colors duration-200 hover:bg-[#24422D]"
            >
              Ask the Oracles
            </LocalizedClientLink>
            <LocalizedClientLink
              href="/store"
              className="font-humanist text-[13px] font-semibold text-paper-accent underline decoration-paper-border underline-offset-4 hover:decoration-paper-accent"
            >
              Browse the shelves
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
              <motion.div
                className="relative aspect-[4/3] w-full"
                animate={
                  prefersReducedMotion
                    ? { scale: 1 }
                    : { scale: [1, 1.03, 1] }
                }
                transition={
                  prefersReducedMotion
                    ? { duration: 0 }
                    : { duration: 20, repeat: Infinity, ease: "easeInOut" }
                }
              >
                <Image
                  src={picture}
                  alt={caption ? `${caption}, ${material}` : "A piece from the shop"}
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover"
                />
              </motion.div>
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
