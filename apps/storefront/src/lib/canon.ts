/**
 * Canon reader for the storefront.
 * Reads the markdown guides from apps/backend/canon/ at build time.
 * Used by the /guides pages (SSG) and the llms.txt route.
 */
import { readdir, readFile } from "fs/promises"
import { join } from "path"

const CANON_DIR = join(
  process.cwd(),
  "canon"
)

export interface CanonGuide {
  slug: string
  title: string
  intents: string[]
  topics: string[]
  sources: string[]
  html: string
  excerpt: string
}

function parseFrontmatter(raw: string): {
  meta: Record<string, string>
  body: string
} {
  const meta: Record<string, string> = {}
  const match = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/)
  if (!match) {
    return { meta, body: raw }
  }
  for (const line of match[1].split("\n")) {
    const idx = line.indexOf(":")
    if (idx > 0) {
      meta[line.slice(0, idx).trim()] = line.slice(idx + 1).trim()
    }
  }
  return { meta, body: match[2] }
}

function parseList(value: string | undefined): string[] {
  if (!value) return []
  const inner = value.replace(/^\[/, "").replace(/\]$/, "")
  return inner
    .split(",")
    .map((s) => s.trim().replace(/^["']|["']$/g, ""))
    .filter(Boolean)
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
}

function inline(md: string): string {
  return escapeHtml(md)
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>")
}

/**
 * Minimal markdown renderer for the canon subset:
 * paragraphs, ##/### headings, - lists, **bold**, *italic*.
 */
export function renderMarkdown(md: string): string {
  const lines = md.split("\n")
  const out: string[] = []
  let inList = false

  const closeList = () => {
    if (inList) {
      out.push("</ul>")
      inList = false
    }
  }

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed) {
      closeList()
      continue
    }
    const h3 = trimmed.match(/^###\s+(.*)/)
    const h2 = trimmed.match(/^##\s+(.*)/)
    const li = trimmed.match(/^[-*]\s+(.*)/)
    if (h3) {
      closeList()
      out.push(`<h3>${inline(h3[1])}</h3>`)
    } else if (h2) {
      closeList()
      out.push(`<h2>${inline(h2[1])}</h2>`)
    } else if (li) {
      if (!inList) {
        out.push("<ul>")
        inList = true
      }
      out.push(`<li>${inline(li[1])}</li>`)
    } else {
      closeList()
      out.push(`<p>${inline(trimmed)}</p>`)
    }
  }
  closeList()
  return out.join("\n")
}

export async function getCanonGuides(): Promise<CanonGuide[]> {
  const files = (await readdir(CANON_DIR)).filter((f) =>
    f.endsWith(".md")
  )
  const guides: CanonGuide[] = []
  for (const file of files) {
    const raw = await readFile(join(CANON_DIR, file), "utf-8")
    const { meta, body } = parseFrontmatter(raw)
    const title = (meta.title || file.replace(/\.md$/, "")).replace(
      /^["']|["']$/g,
      ""
    )
    const excerpt = body
      .split("\n")
      .map((l) => l.trim())
      .find((l) => l && !l.startsWith("#"))?.slice(0, 200) || ""
    guides.push({
      slug: file.replace(/\.md$/, ""),
      title,
      intents: parseList(meta.intents),
      topics: parseList(meta.topics),
      sources: parseList(meta.sources),
      html: renderMarkdown(body),
      excerpt,
    })
  }
  guides.sort((a, b) => a.title.localeCompare(b.title))
  return guides
}

export async function getCanonGuide(slug: string): Promise<CanonGuide | null> {
  const guides = await getCanonGuides()
  return guides.find((g) => g.slug === slug) || null
}
