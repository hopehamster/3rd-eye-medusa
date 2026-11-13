import Spinner from "@modules/common/icons/spinner"

export default function Loading() {
  return (
    <div className="w-full text-ui-fg-base">
      {/*
        Spinner is fixed to the centre of the content area, not centred in
        its box: below `small` the AccountNav stacks above this cell and its
        height differs by route (full list on /account, one back link on
        sub-pages), so no in-flow box height can centre the spinner on both.
        Vertical centre is 50dvh on every route. Horizontal centre is the
        content cell's centre: the viewport centre below `small` (single
        column), and 120px right of it at/above `small` — half the 240px
        sidebar column (account-layout.tsx:24).
      */}
      <div className="fixed left-1/2 top-[50dvh] -translate-x-1/2 -translate-y-1/2 small:left-[calc(50%_+_120px)]">
        <Spinner size={36} />
      </div>
    </div>
  )
}
