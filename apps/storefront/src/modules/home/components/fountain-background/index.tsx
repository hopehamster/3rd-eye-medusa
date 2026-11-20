"use client"

import { useEffect, useState } from "react"
import { useReducedMotion } from "framer-motion"

/**
 * Full-page fountain background (issue #331, Michael's call).
 *
 * A generated video of a zen stone fountain — running water, ripples —
 * sits behind the whole homepage, fixed in place while the page
 * scrolls over it. The camera in the clip never moves and the end is
 * blended into the start, so the loop has no visible seam. The clip
 * was upscaled to 4K (3840x2160) with Topaz on fal; large screens get
 * the 4K file, everything else the 1080p file.
 *
 * Readability: a paper wash sits over the video everywhere, and every
 * homepage section band is translucent paper over that wash, so no
 * text ever sits raw on moving water. Cards keep their solid raised
 * surfaces. With reduced motion the video never plays — its still
 * poster frame stands as the background instead.
 *
 * Stacking: this layer is fixed at z-0. The homepage sections ride in
 * a relative z-[5] wrapper, and the layout blocks that share the
 * viewport with it (footer, consent band, cart-mismatch banner)
 * carry relative z-[5] too, so they paint above the water while the
 * free-shipping popup (z-10) and the nav (z-40) stay above them.
 *
 * The files live in the repo under public/videos/.
 */
const VIDEO_1080 = "/videos/zen-fountain-hero-loop-1080.mp4"
const VIDEO_4K = "/videos/zen-fountain-hero-loop-4k.mp4"
const POSTER = "/videos/zen-fountain-poster-1920.jpg"

const FountainBackground = () => {
  const prefersReducedMotion = useReducedMotion()
  const [src, setSrc] = useState(VIDEO_1080)

  useEffect(() => {
    if (window.innerWidth >= 1600) {
      setSrc(VIDEO_4K)
    }
  }, [])

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
    >
      {prefersReducedMotion ? (
        <img
          src={POSTER}
          alt=""
          className="h-full w-full object-cover object-[35%_50%]"
        />
      ) : (
        <video
          key={src}
          src={src}
          poster={POSTER}
          className="h-full w-full object-cover object-[35%_50%]"
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
        />
      )}
      <div className="absolute inset-0 bg-paper-bg/45" />
      <div className="absolute inset-0 bg-gradient-to-b from-paper-bg/60 via-transparent to-paper-bg/40" />
    </div>
  )
}

export default FountainBackground
