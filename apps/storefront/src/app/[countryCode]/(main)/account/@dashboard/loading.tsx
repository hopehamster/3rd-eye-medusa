import Spinner from "@modules/common/icons/spinner"

export default function Loading() {
  return (
    <div className="flex items-center justify-center w-full h-full min-h-[calc(100dvh-7rem)] small:min-h-[calc(100dvh-10rem)] text-ui-fg-base">
      <Spinner size={36} />
    </div>
  )
}
