"use client"

import Image from "next/image"
import type { Hit as HitType } from "instantsearch.js"
import { motion, useReducedMotion } from "framer-motion"

import LocalizedClientLink from "@modules/common/components/localized-client-link"
import PlaceholderImage from "@modules/common/icons/placeholder-image"
import { Text } from "@modules/common/components/ui"

export type ProductHit = HitType<{
  title: string | null
  handle: string | null
  thumbnail: string | null
}>

type SearchHitProps = {
  hit: ProductHit
  /* Row position in the results list, for the stagger delay. Optional:
     callers that render hits without a list position (the semantic
     fallback) get delay 0 and fade in together. */
  index?: number
  onNavigate?: () => void
}

const SearchHit = ({ hit, index = 0, onNavigate }: SearchHitProps) => {
  const prefersReducedMotion = useReducedMotion()

  if (!hit.handle) {
    return null
  }

  return (
    <motion.li
      /* Search rows fade in one after another down the list when
        results arrive (issue #243). Same quiet pattern as the store
        tiles (#203): opacity + a small rise, easeOut, under half a
        second each; the stagger delay is capped so a full page never
        feels like waiting. With reduced motion preferred, no entrance
        at all: the rows render immediately, no fade, no rise, no
        stagger delay. */
      initial={prefersReducedMotion ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.35,
        ease: "easeOut",
        delay: prefersReducedMotion ? 0 : Math.min(index * 0.03, 0.3),
      }}
    >
      <LocalizedClientLink
        href={`/products/${hit.handle}`}
        onClick={onNavigate}
        className="flex items-center gap-x-4 px-4 py-3 hover:bg-ui-bg-base-hover"
        data-testid="search-hit-link"
      >
        <div className="relative h-16 w-14 shrink-0 overflow-hidden rounded-rounded bg-ui-bg-subtle">
          {hit.thumbnail ? (
            <Image
              src={hit.thumbnail}
              alt=""
              fill
              sizes="56px"
              className="object-cover object-center"
              draggable={false}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-ui-fg-muted">
              <PlaceholderImage size={20} />
            </div>
          )}
        </div>
        <Text className="txt-medium text-ui-fg-base line-clamp-2">
          {hit.title}
        </Text>
      </LocalizedClientLink>
    </motion.li>
  )
}

export default SearchHit
