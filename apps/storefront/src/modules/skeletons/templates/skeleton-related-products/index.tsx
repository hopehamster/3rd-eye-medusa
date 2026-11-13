import repeat from "@lib/util/repeat"
import SkeletonProductPreview from "@modules/skeletons/components/skeleton-product-preview"
import SkeletonShimmer from "@modules/skeletons/components/skeleton-shimmer"

const SkeletonRelatedProducts = () => {
  return (
    <div className="product-page-constraint">
      <div className="flex flex-col gap-8 items-center text-center mb-8">
        <SkeletonShimmer className="w-20 h-6 bg-gray-100" />
        <div className="flex flex-col gap-4 items-center text-center mb-16">
          <SkeletonShimmer className="w-96 h-10 bg-gray-100" />
          <SkeletonShimmer className="w-48 h-10 bg-gray-100" />
        </div>
      </div>
      <ul className="grid grid-cols-2 small:grid-cols-3 medium:grid-cols-4 gap-x-6 gap-y-8 flex-1">
        {repeat(3).map((index) => (
          <li key={index}>
            <SkeletonProductPreview />
          </li>
        ))}
      </ul>
    </div>
  )
}

export default SkeletonRelatedProducts
