/**
 * File-based canon retrieval (Phase 1).
 * Scans canon/*.md, matches frontmatter `intents` against classified intents.
 * Phase 2 replaces this with Qdrant semantic retrieval; the interface stays.
 */
import { readdir, readFile } from "fs/promises"
import { join } from "path"

export interface CanonDoc {
  file: string
  title: string
  intents: string[]
  excerpt: string
}

// Canon lives at apps/backend/canon/ (next to the module that reads it).
// Override with ORACLE_CANON_DIR if the layout ever changes.
const CANON_DIR =
  process.env.ORACLE_CANON_DIR || join(__dirname, "..", "..", "..", "canon")
const MAX_DOCS = 3
const MAX_CHARS_PER_DOC = 1500

function parseFrontmatter(raw: string): {
  title: string
  intents: string[]
  body: string
} {
  // \r?\n, not \n: the repo has no .gitattributes, so a Windows checkout
    // materialises these files with CRLF and an \n-only regex silently fails to
    // match — which emptied the Oracle's knowledge base and rendered the raw
    // frontmatter as body text on /guides pages.
    const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/)
  if (!match) {
    return { title: "", intents: [], body: raw }
  }
  const [, fm, body] = match
  const title = fm.match(/title:\s*"([^"]+)"/)?.[1] ?? ""
  const intentsRaw = fm.match(/intents:\s*\[([^\]]*)\]/)?.[1] ?? ""
  const intents = intentsRaw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
  return { title, intents, body: body.trim() }
}

let cache: CanonDoc[] | null = null

export async function loadCanon(): Promise<CanonDoc[]> {
  if (cache) {
    return cache
  }
  let files: string[] = []
  try {
    files = (await readdir(CANON_DIR)).filter((f) => f.endsWith(".md"))
  } catch {
    return []
  }
  const docs: CanonDoc[] = []
  for (const file of files) {
    try {
      const raw = await readFile(join(CANON_DIR, file), "utf-8")
      const { title, intents, body } = parseFrontmatter(raw)
      docs.push({
        file,
        title,
        intents,
        excerpt: body.slice(0, MAX_CHARS_PER_DOC),
      })
    } catch {
      // skip unreadable files — the Oracle degrades, it doesn't crash
    }
  }
  cache = docs
  return docs
}

export async function retrieveCanon(intentIds: string[]): Promise<CanonDoc[]> {
  const docs = await loadCanon()
  const scored = docs
    .map((doc) => ({
      doc,
      score: doc.intents.filter((i) => intentIds.includes(i)).length,
    }))
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_DOCS)
  return scored.map((s) => s.doc)
}

export function clearCanonCache(): void {
  cache = null
}
