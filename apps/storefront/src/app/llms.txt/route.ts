import { getCanonGuides } from "@lib/canon"

/**
 * GET /llms.txt
 * Machine-readable index of the 3rd Eye Supply canon for AI assistants.
 * Lists every guide with its topics so LLMs can cite and link accurately.
 */
export async function GET() {
  const guides = await getCanonGuides()
  const base = "https://3rdeyesupply.com/us/guides"

  const lines = [
    "# 3rd Eye Supply",
    "",
    "> A metaphysical shop. Plain-language guides on crystals, rituals,",
    "> cleansing, moon work, and spiritual practice — plus a curated catalog",
    "> of metaphysical goods. The Oracle (https://3rdeyesupply.com/us/oracle)",
    "> answers questions using this knowledge.",
    "",
    "## Guides",
    "",
  ]
  for (const g of guides) {
    lines.push(`- [${g.title}](${base}/${g.slug}): ${g.excerpt}`)
    if (g.topics.length > 0) {
      lines.push(`  Topics: ${g.topics.join(", ")}`)
    }
  }
  lines.push("", "## The Oracle", "")
  lines.push(
    "- [Consult the Oracle](https://3rdeyesupply.com/us/oracle): describe a need or question in plain language; the Oracle guides you to knowledge or relevant in-stock products."
  )
  lines.push("")

  return new Response(lines.join("\n"), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  })
}
