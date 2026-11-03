#!/usr/bin/env node
/**
 * Fails while any [FILL: ...] placeholder is still published.
 *
 * The policy pages went live carrying these markers and nothing in the build
 * noticed: a customer reading /us/returns saw "[FILL: return window] days from
 * delivery". This turns that into a check with a non-zero exit and a file:line
 * list, so the same mistake cannot ship quietly again.
 *
 * Matches span lines on purpose - JSX wraps long markers, and a line-by-line
 * scan silently under-counts them (38 vs 43 the first time this was written).
 *
 * Run: pnpm --filter @dtc/storefront run check:policy
 */
import { readFileSync, existsSync } from "node:fs"
import { dirname, join, relative } from "node:path"
import { fileURLToPath } from "node:url"

const here = dirname(fileURLToPath(import.meta.url))
const pagesDir = join(here, "..", "src", "app", "[countryCode]", "(main)")
const PAGES = ["terms", "privacy", "shipping", "returns", "contact"]

let total = 0
const rows = []

for (const page of PAGES) {
  const file = join(pagesDir, page, "page.tsx")
  if (!existsSync(file)) continue
  const text = readFileSync(file, "utf8")
  const pattern = /\[FILL:[\s\S]*?\]/g
  let match
  while ((match = pattern.exec(text)) !== null) {
    total += 1
    const line = text.slice(0, match.index).split(/\r?\n/).length
    rows.push({
      file: relative(join(here, ".."), file).split("\\").join("/"),
      line,
      marker: match[0].replace(/\s+/g, " ").slice(0, 60),
    })
  }
}

if (total === 0) {
  console.log("policy pages: no placeholders left")
  process.exit(0)
}

console.error("policy pages: " + total + " placeholder(s) still published to customers\n")
for (const row of rows) {
  console.error("  " + row.file + ":" + row.line + "  " + row.marker)
}
console.error("\nAnswer the owner facts on #139, replace the markers, then this passes.")
process.exit(1)
