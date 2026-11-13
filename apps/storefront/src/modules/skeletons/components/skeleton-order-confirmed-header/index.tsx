import SkeletonShimmer from "@modules/skeletons/components/skeleton-shimmer"

const SkeletonOrderConfirmedHeader = () => {
  return (
    <SkeletonShimmer className="flex flex-col gap-y-2 pb-10">
      <div className="w-2/5 h-4 bg-gray-100"></div>
      <div className="w-3/6 h-6 bg-gray-100"></div>
      <div className="flex gap-x-4">
        <div className="w-16 h-4 bg-gray-100"></div>
        <div className="w-12 h-4 bg-gray-100"></div>
      </div>
    </SkeletonShimmer>
  )
}

export default SkeletonOrderConfirmedHeader
