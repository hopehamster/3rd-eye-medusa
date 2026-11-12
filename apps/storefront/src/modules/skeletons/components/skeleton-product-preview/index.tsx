import { Container } from "@modules/common/components/ui"
import SkeletonShimmer from "@modules/skeletons/components/skeleton-shimmer"

const SkeletonProductPreview = () => {
  return (
    <SkeletonShimmer>
      <Container className="aspect-[9/16] w-full bg-gray-100 bg-ui-bg-subtle" />
      <div className="flex justify-between text-base-regular mt-2">
        <div className="w-2/5 h-6 bg-gray-100"></div>
        <div className="w-1/5 h-6 bg-gray-100"></div>
      </div>
    </SkeletonShimmer>
  )
}

export default SkeletonProductPreview
