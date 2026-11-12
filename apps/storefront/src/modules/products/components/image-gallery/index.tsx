"use client"

import { useState } from "react"
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
 * The switch is two plain toggle buttons with aria-pressed, not ARIA
 * tabs: the control only switches which view is shown, so it does not
 * claim the tabs pattern (no arrow-key contract, no roving tabindex,
 * no aria-controls pointing at an unmounted panel). Native button
 * keyboard behaviour (Tab, Enter/Space) is the whole contract.
 */
const ImageGallery = ({ images, title, handle }: ImageGalleryProps) => {
  const [activeTab, setActiveTab] = useState<GalleryTab>("photos")

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
        {activeTab === "photos" ? (
          <div className="flex flex-col gap-y-4">
            {images.map((image, index) => {
              return (
                <Container
                  key={image.id}
                  className="relative aspect-[29/34] w-full overflow-hidden bg-paper-surface border border-paper-borderSoft rounded-specimen"
                  id={image.id}
                >
                  {!!image.url && (
                    <Image
                      src={image.url}
                      priority={index === 0 ? true : false}
                      className="absolute inset-0"
                      alt={`Product image ${index + 1}`}
                      fill
                      sizes="(max-width: 576px) 280px, (max-width: 768px) 360px, (max-width: 992px) 480px, 800px"
                      style={{
                        objectFit: "cover",
                      }}
                    />
                  )}
                </Container>
              )
            })}
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
      </div>
    </div>
  )
}

export default ImageGallery
