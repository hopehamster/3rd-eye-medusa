import { HttpTypes } from "@medusajs/types"
import { Container } from "@modules/common/components/ui"
import Image from "next/image"
import CrystalViewer from "@modules/products/components/crystal-viewer"

type ImageGalleryProps = {
  images: HttpTypes.StoreProductImage[]
  title: string
  handle: string
}

/**
 * PDP imagery (bright apothecary redesign, issue #24).
 * Framed like specimen plates: paper surface, hairline border, small radius.
 * The 3D stone study leads as the first plate; supplier photos follow.
 * Works with current supplier images; Agent Daylight (#22) photos drop in
 * without layout changes.
 */
const ImageGallery = ({ images, title, handle }: ImageGalleryProps) => {
  return (
    <div className="flex items-start relative">
      <div className="flex flex-col flex-1 gap-y-4">
        <CrystalViewer
          title={title}
          handle={handle}
          fallbackImage={images[0]}
        />
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
                  priority={index <= 2 ? true : false}
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
    </div>
  )
}

export default ImageGallery
