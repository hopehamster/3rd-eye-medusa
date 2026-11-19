import { clx } from "@modules/common/components/ui"

type SearchFormProps = {
  countryCode: string
  defaultValue?: string
  className?: string
}

/** Plain GET form so search works without JavaScript and for browser agents. */
const SearchForm = ({ countryCode, defaultValue, className }: SearchFormProps) => (
  <form
    role="search"
    method="get"
    action={`/${countryCode}/search`}
    className={clx("flex gap-2", className)}
    {...{
      toolname: "search_products",
      tooldescription: "Search the store's products by keyword",
    }}
  >
    <label htmlFor="search-q" className="sr-only">
      Search products
    </label>
    <input
      id="search-q"
      type="search"
      name="q"
      defaultValue={defaultValue}
      placeholder="Search products"
      className="flex-1 h-11 px-4 border rounded-specimen border-paper-border bg-paper-raised text-paper-text placeholder:text-paper-faint txt-compact-medium"
    />
    <button
      type="submit"
      className="h-11 px-6 rounded-specimen bg-paper-accent text-paper-raised border border-[#24422D] text-[13px] font-semibold uppercase tracking-[0.08em] hover:bg-[#24422D] hover:shadow-[0_2px_6px_rgba(46,83,57,0.25)] active:translate-y-[1px] transition-all"
    >
      Search
    </button>
  </form>
)

export default SearchForm
