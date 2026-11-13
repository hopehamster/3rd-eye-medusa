import { Table } from "@modules/common/components/ui"
import SkeletonShimmer from "@modules/skeletons/components/skeleton-shimmer"

const SkeletonCartItem = () => {
  return (
    <Table.Row className="w-full m-4">
      <Table.Cell className="!pl-0 p-4 w-24">
        <SkeletonShimmer className="flex w-24 h-24 p-4 bg-gray-200 rounded-large" />
      </Table.Cell>
      <Table.Cell className="text-left">
        <div className="flex flex-col gap-y-2">
          <SkeletonShimmer className="w-32 h-4 bg-gray-200" />
          <SkeletonShimmer className="w-24 h-4 bg-gray-200" />
        </div>
      </Table.Cell>
      <Table.Cell>
        <div className="flex gap-2 items-center">
          <SkeletonShimmer className="w-6 h-8 bg-gray-200" />
          <SkeletonShimmer className="w-14 h-10 bg-gray-200" />
        </div>
      </Table.Cell>
      <Table.Cell>
        <div className="flex gap-2">
          <SkeletonShimmer className="w-12 h-6 bg-gray-200" />
        </div>
      </Table.Cell>
      <Table.Cell className="!pr-0 text-right">
        <div className="flex gap-2 justify-end">
          <SkeletonShimmer className="w-12 h-6 bg-gray-200" />
        </div>
      </Table.Cell>
    </Table.Row>
  )
}

export default SkeletonCartItem
