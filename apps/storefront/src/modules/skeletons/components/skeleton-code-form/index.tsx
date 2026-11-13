import SkeletonShimmer from "@modules/skeletons/components/skeleton-shimmer"

const SkeletonCodeForm = () => {
  return (
    <div className="w-full flex flex-col">
      <SkeletonShimmer className="bg-gray-100 h-7 w-24 mb-4" />
      <div className="grid grid-cols-[1fr_80px] gap-x-2">
        <SkeletonShimmer className="bg-gray-100 h-12" />
        <SkeletonShimmer className="bg-gray-100 h-12" />
      </div>
    </div>
  )
}

export default SkeletonCodeForm
