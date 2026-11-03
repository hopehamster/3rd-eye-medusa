#!/usr/bin/env node
/**
 * Fails while any [FILL: ...] placeholder is still published, and summarises
 * them as the questions a human has to answer.
 *
 * The policy pages went live carrying these markers and nothing in the build
 * noticed: a customer reading /us/returns saw "[FILL: return window] days from
 * delivery". This turns that into a check with a non-zero exit.
 *
 * It prints two things on purpose:
 *   1. every occurrence with file:line, so any one of them can be found;
 *   2. the distinct questions, because the same fact appears in a summary and
 *      again in the body — 53 occurrences come down to a handful of answers.
 *
 * Matches span lines: JSX wraps long markers, and a line-by-line scan silently
 * under-counts them (38 vs 53 the first time this was written).
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
const byQuestion = new Map()

const normalise = (marker) =>
  marker.replace(/\s+/g, " ").replace(/\[FILL:\s*/, "").replace(/\]$/, "").trim()

for (const page of PAGES) {
  const file = join(pagesDir, page, "page.tsx")
  if (!existsSync(file)) continue
  const text = readFileSync(file, "utf8")
  const pattern = /\[FILL:[\s\S]*?\]/g
  let match
  while ((match = pattern.exec(text)) !== null) {
    total += 1
    const line = text.slice(0, match.index).split(/\r?\n/).length
    const question = normalise(match[0])
    rows.push({
      file: relative(join(here, ".."), file).split("\\").join("/"),
      line,
      question,
    })
    if (!byQuestion.has(question)) byQuestion.set(question, [])
    byQuestion.get(question).push(page)
  }
}

if (total === 0) {
  console.log("policy pages: no placeholders left")
  process.exit(0)
}

console.error("policy pages: " + total + " placeholder(s) still published to customers")
console.error("distinct answers needed: " + byQuestion.size + "\n")

let n = 1
for (const [question, where] of byQuestion) {
  console.error("  " + String(n++).padStart(2) + ". " + question + "   [" + [...new Set(where)].join(", ") + "]")
}

console.error("\nEvery occurrence (file:line):")
for (const row of rows) {
  console.error("  " + row.file + ":" + row.line + "  " + row.question)
}

console.error("\nAnswer the questions on #139, replace the markers, then this passes.")
process.exit(1)
