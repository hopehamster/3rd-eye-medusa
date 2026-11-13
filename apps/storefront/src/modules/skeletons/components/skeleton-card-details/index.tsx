import SkeletonShimmer from "@modules/skeletons/components/skeleton-shimmer"

const SkeletonCardDetails = () => {
  return (
    <div className="flex flex-col gap-1 my-4 transition-all duration-150 ease-in-out">
      <SkeletonShimmer className="h-4 bg-ui-bg-component-pressed rounded-md w-1/4 mb-1" />
      <SkeletonShimmer className="pt-3 pb-1 block w-full h-11 px-4 mt-0 bg-ui-bg-field border rounded-md appearance-none border-ui-border-base" />
    </div>
  )
}

export default SkeletonCardDetails
