import { parseFrontmatter } from "../canon"

/**
 * Regression guard for a real bug: the frontmatter regex was anchored on "\n"
 * only, so on a Windows checkout (CRLF) it never matched — the Oracle's
 * knowledge base silently came back empty and the guides pages rendered raw
 * "--- title: …" text. Both line endings must parse identically.
 */
describe("parseFrontmatter", () => {
  const lf = "---\ntitle: \"What Is Ritual?\"\nintents: [spiritual-connection-ritual, protection]\n---\nBody text here.\n"
  const crlf = lf.replace(/\n/g, "\r\n")

  it("parses LF frontmatter", () => {
    const { title, intents, body } = parseFrontmatter(lf)
    expect(title).toBe("What Is Ritual?")
    expect(intents).toEqual(["spiritual-connection-ritual", "protection"])
    expect(body.trim()).toBe("Body text here.")
  })

  it("parses CRLF frontmatter exactly like LF", () => {
    const a = parseFrontmatter(lf)
    const b = parseFrontmatter(crlf)
    expect(b.title).toBe(a.title)
    expect(b.intents).toEqual(a.intents)
    expect(b.body.trim()).toBe(a.body.trim())
  })

  it("accepts an unquoted title", () => {
    const { title } = parseFrontmatter("---\ntitle: What Is Ritual?\nintents: []\n---\nbody")
    expect(title).toBe("What Is Ritual?")
  })

  it("falls back to the whole file when there is no frontmatter", () => {
    const { title, intents, body } = parseFrontmatter("just body, no metadata")
    expect(title).toBe("")
    expect(intents).toEqual([])
    expect(body).toContain("just body")
  })
})
