"use client"

import { MagnifyingGlass, XMarkMini } from "@medusajs/icons"
import { useCallback, useEffect, useRef, useState } from "react"
import { useSearchBox } from "react-instantsearch"

const DEBOUNCE_MS = 250

/**
 * Free-text search over the listing, refining the same InstantSearch state the
 * sidebar filters do. The input is held locally so typing stays responsive
 * while the query itself is debounced.
 */
const StoreSearchBox = () => {
  const timer = useRef<number | undefined>(undefined)

  const queryHook = useCallback(
    (nextQuery: string, search: (value: string) => void) => {
      window.clearTimeout(timer.current)
      timer.current = window.setTimeout(() => search(nextQuery), DEBOUNCE_MS)
    },
    []
  )

  const { query, refine } = useSearchBox({ queryHook })
  const [inputValue, setInputValue] = useState(query)

  useEffect(() => () => window.clearTimeout(timer.current), [])

  // Follow the query when it changes elsewhere — cleared with the filters, or
  // arriving from the URL on load, which `routing` restores after mount.
  useEffect(() => {
    setInputValue(query)
  }, [query])

  const clear = () => {
    window.clearTimeout(timer.current)
    setInputValue("")
    refine("")
  }

  /* Search glow (issue #244): clicking in warms the hairline to the
     botanical accent and fades in a soft ring; both fade out on blur.
     Pure CSS focus-within — a two-property state change needs no JS.
     300ms, under the half-second house rule; reduced-motion visitors
     get the same state instantly via motion-reduce. */
  return (
    <div className="mb-6 flex items-center gap-x-3 border-b border-ui-border-base transition-[border-color,box-shadow] duration-300 ease-out focus-within:border-paper-accent focus-within:ring focus-within:ring-paper-accent/15 motion-reduce:transition-none">
      <MagnifyingGlass className="shrink-0 text-ui-fg-muted" />
      <input
        type="search"
        value={inputValue}
        onChange={(event) => {
          setInputValue(event.target.value)
          refine(event.target.value)
        }}
        placeholder="Search products"
        aria-label="Search products"
        className="text-base w-full bg-transparent py-3 text-ui-fg-base outline-none placeholder:text-ui-fg-muted [&::-webkit-search-cancel-button]:hidden"
        data-testid="store-search-input"
      />
      {inputValue && (
        <button
          type="button"
          onClick={clear}
          aria-label="Clear search"
          className="shrink-0 text-ui-fg-muted hover:text-ui-fg-base"
          data-testid="store-search-clear"
        >
          <XMarkMini />
        </button>
      )}
    </div>
  )
}

export default StoreSearchBox