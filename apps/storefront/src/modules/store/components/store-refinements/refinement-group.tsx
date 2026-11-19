"use client"

import clsx from "clsx"
import { useRefinementList } from "react-instantsearch"

import { facetDisplayName } from "./attributes"

type RefinementGroupProps = {
  attribute: string
  title: string
}

const RefinementGroup = ({ attribute, title }: RefinementGroupProps) => {
  const { items, refine } = useRefinementList({
    attribute,
    limit: 20,
    sortBy: ["count:desc", "name:asc"],
  })

  // Facet values with a count of 0 match nothing in the current result set;
  // rendering them advertises empty shelves, so they do not render. A group
  // whose values are all zero-count does not render either.
  const visibleItems = items.filter((item) => item.count > 0)

  if (!visibleItems.length) {
    return null
  }

  return (
    <div className="flex flex-col gap-y-3">
      <span className="text-sm font-medium font-humanist text-paper-muted">
        {title}
      </span>
      <ul className="flex flex-col gap-y-2 pr-6">
        {visibleItems.map((item) => (
          <li key={item.value}>
            <label className="flex cursor-pointer items-start gap-x-2">
              <input
                type="checkbox"
                checked={item.isRefined}
                onChange={() => refine(item.value)}
                className="mt-1 shrink-0 accent-paper-accent"
                data-testid={`refinement-${attribute}`}
              />
              <span
                className={clsx("text-base min-w-0 break-words", {
                  "text-paper-text": item.isRefined,
                  "text-paper-muted": !item.isRefined,
                })}
              >
                {facetDisplayName(item.label)}
              </span>
              <span className="text-sm shrink-0 text-paper-faint">
                ({item.count})
              </span>
            </label>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default RefinementGroup
