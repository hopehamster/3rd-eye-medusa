"use client"

import { useState } from "react"
import { AnimatePresence, motion, useReducedMotion } from "framer-motion"
import { HttpTypes } from "@medusajs/types"
import { Container } from "@modules/common/components/ui"
import Image from "next/image"
import CrystalViewer from "@modules/products/components/crystal-viewer"

type ImageGalleryProps = {
  images: HttpTypes.StoreProductImage[]
  title: string
  handle: string
}

type GalleryTab = "photos" | "3d"

/**
 * PDP imagery (bright apothecary redesign, issue #24; photos first,
 * issue #154).
 * Framed like specimen plates: paper surface, hairline border, small radius.
 * The real product photos lead as the first plate; the 3D stone study is
 * a second tab, kept intact but no longer first. The viewer renders only
 * when its tab is active, so its lazy three.js chunk and its photo
 * fallback are unchanged. Works with current supplier images; Agent
 * Daylight (#22) photos drop in without layout changes.
 *
 * Switching tabs crossfades (issue #200): the two views fade through
 * each other over 300ms with Framer Motion AnimatePresence, instead of
 * swapping instantly. The panel is keyed by tab, so the outgoing view
 * stays mounted only for its 300ms exit fade and then unmounts — the
 * 3D viewer still mounts fresh on each switch to 3D, exactly as before,
 * and its own motion (drei Float + auto-rotating OrbitControls) restarts
 * on its own inside the Canvas. The panels share one grid cell so they
 * overlap during the fade instead of stacking and doubling the height.
 * initial={false} keeps the first paint instant: no fade on page load.
 * Reduced motion is respected (DISCUSSION.md sitewide rule, issue #255):
 * when the visitor prefers reduced motion, the switch is instant —
 * initial={false} and a 0s transition, so no exit fade and no opacity
 * animation — instead of the 300ms crossfade.
 *
 * Main photo zoom on hover (issue #226): the main photo scales
 * to 1.04 over 300ms while hovered, inside its frame — the Container
 * already clips with overflow-hidden, so the zoom never spills out.
 * Under reduced motion there is no zoom at all (whileHover is left off).
 *
 * Thumbnail fade (issue #227): the photos view shows one main photo
 * plus a thumbnail row (built here — the gallery had no thumbnail
 * selector before, just the stacked plates). Tapping a thumbnail swaps
 * the main photo through a 300ms Framer Motion crossfade, same pattern
 * as the tab switch: the main panel is keyed by image id inside
 * AnimatePresence, the two photos share one grid cell so they overlap
 * during the fade instead of stacking. initial={false} keeps the
 * first paint instant. Under reduced motion the swap is instant
 * (0s transition, no opacity animation). The row only renders when
 * there is more than one photo. Thumbnails are plain buttons with
 * aria-pressed and aria-label; the active one carries the darker
 * border so the current photo is visible at a glance.
 *
 * The switch is two plain toggle buttons with aria-pressed, not ARIA
 * tabs: the control only switches which view is shown, so it does not
 * claim the tabs pattern (no arrow-key contract, no roving tabindex,
 * no aria-controls pointing at an unmounted panel). Native button
 * keyboard behaviour (Tab, Enter/Space) is the whole contract.
 */
const ImageGallery = ({ images, title, handle }: ImageGalleryProps) => {
  const [activeTab, setActiveTab] = useState<GalleryTab>("photos")
  const [activeIndex, setActiveIndex] = useState(0)
  const prefersReducedMotion = useReducedMotion()
  const activeImage =
    images[Math.min(activeIndex, Math.max(images.length - 1, 0))]

  return (
    <div
      className="flex items-start relative"
      data-testid="product-gallery"
    >
      <div className="flex flex-col flex-1 gap-y-4">
        <div className="flex gap-x-2 border-b border-paper-borderSoft pb-3">
          <button
            type="button"
            data-testid="gallery-tab-photos"
            aria-pressed={activeTab === "photos"}
            onClick={() => setActiveTab("photos")}
            className={
              activeTab === "photos"
                ? "rounded-full border border-paper-borderSoft bg-paper-surface px-4 py-1.5 font-humanist text-sm text-paper-text"
                : "rounded-full border border-transparent px-4 py-1.5 font-humanist text-sm text-paper-muted"
            }
          >
            Photos
          </button>
          <button
            type="button"
            data-testid="gallery-tab-3d"
            aria-pressed={activeTab === "3d"}
            onClick={() => setActiveTab("3d")}
            className={
              activeTab === "3d"
                ? "rounded-full border border-paper-borderSoft bg-paper-surface px-4 py-1.5 font-humanist text-sm text-paper-text"
                : "rounded-full border border-transparent px-4 py-1.5 font-humanist text-sm text-paper-muted"
            }
          >
            View in 3D
          </button>
        </div>
        <div className="grid">
          <AnimatePresence initial={false}>
            <motion.div
              key={activeTab}
              className="[grid-area:1/1]"
              initial={prefersReducedMotion ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{
                duration: prefersReducedMotion ? 0 : 0.3,
                ease: "easeInOut",
              }}
            >
              {activeTab === "photos" ? (
                <div className="flex flex-col gap-y-4">
                  <div className="grid">
                    <AnimatePresence initial={false}>
                      {activeImage && (
                        <motion.div
                          key={activeImage.id}
                          className="[grid-area:1/1]"
                          initial={
                            prefersReducedMotion ? false : { opacity: 0 }
                          }
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{
                            duration: prefersReducedMotion ? 0 : 0.3,
                            ease: "easeInOut",
                          }}
                        >
                          <Container
                            className="relative aspect-[29/34] w-full overflow-hidden bg-paper-surface border border-paper-borderSoft rounded-specimen"
                            id={activeImage.id}
                          >
                            {!!activeImage.url && (
                              <motion.div
                                className="absolute inset-0"
                                whileHover={
                                  prefersReducedMotion
                                    ? undefined
                                    : { scale: 1.04 }
                                }
                                transition={{
                                  duration: 0.3,
                                  ease: "easeOut",
                                }}
                              >
                                <Image
                                  src={activeImage.url}
                                  priority={true}
                                  className="absolute inset-0"
                                  alt={`Product image ${activeIndex + 1}`}
                                  fill
                                  sizes="(max-width: 576px) 280px, (max-width: 768px) 360px, (max-width: 992px) 480px, 800px"
                                  style={{
                                    objectFit: "cover",
                                  }}
                                />
                              </motion.div>
                            )}
                          </Container>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                  {images.length > 1 && (
                    <div
                      className="flex gap-x-2"
                      data-testid="gallery-thumbnails"
                    >
                      {images.map((image, index) => (
                        <button
                          key={image.id}
                          type="button"
                          data-testid={`gallery-thumbnail-${index}`}
                          aria-pressed={index === activeIndex}
                          aria-label={`View product image ${index + 1}`}
                          onClick={() => setActiveIndex(index)}
                          className={
                            index === activeIndex
                              ? "relative aspect-[29/34] w-16 overflow-hidden rounded-specimen border border-paper-text bg-paper-surface"
                              : "relative aspect-[29/34] w-16 overflow-hidden rounded-specimen border border-paper-borderSoft bg-paper-surface"
                          }
                        >
                          {!!image.url && (
                            <Image
                              src={image.url}
                              priority={false}
                              className="absolute inset-0"
                              alt=""
                              fill
                              sizes="64px"
                              style={{
                                objectFit: "cover",
                              }}
                            />
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <CrystalViewer
                    title={title}
                    handle={handle}
                    fallbackImage={images[0]}
                  />
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}

export default ImageGallery
