import { describe, expect, it } from "vitest"
import {
  CONTENT_FORMATS,
  detectFormatByContent,
  detectFormatByExtension,
  getContentFormatInfo,
  getFormatCheatsheet,
  parseMediaWiki,
} from "../lib/mediawiki-parser"
import { buildFileRecord, getDownloadFileName } from "../hooks/useMarkdownFiles"

describe("format detection", () => {
  it("detects format from file extension", () => {
    expect(detectFormatByExtension("notes.md")).toBe("markdown")
    expect(detectFormatByExtension("article.wiki")).toBe("mediawiki")
  })

  it("falls back to content-based detection when the filename has no known extension", () => {
    expect(detectFormatByContent("== Heading ==\nBody", "draft")).toBe("mediawiki")
    expect(detectFormatByContent("Plain paragraph text", "draft")).toBe("markdown")
  })

  it("prefers markdown for common markdown headings and emphasis when extensionless", () => {
    expect(detectFormatByContent("## Title\nBody", "draft")).toBe("markdown")
    expect(detectFormatByContent("**Bold**", "draft")).toBe("markdown")
  })

  it("lets known extensions win over ambiguous content", () => {
    expect(detectFormatByContent("== Heading ==\nBody", "draft.md")).toBe("markdown")
    expect(detectFormatByContent("# Title\nBody", "draft.wiki")).toBe("mediawiki")
  })
})

describe("file loading and saving inference", () => {
  it("derives the file format from extensionless wiki content when loading", () => {
    const file = new File(["== Heading ==\nBody"], "draft", { type: "text/plain" })
    const record = buildFileRecord(file, "== Heading ==\nBody")

    expect(record.format).toBe("mediawiki")
    expect(record.name).toBe("draft")
  })

  it("keeps or adds the correct extension when saving", () => {
    expect(getDownloadFileName("draft", getContentFormatInfo("mediawiki"))).toBe("draft.wiki")
    expect(getDownloadFileName("notes.txt", getContentFormatInfo("markdown"))).toBe("notes.md")
    expect(getDownloadFileName("report.wiki", getContentFormatInfo("mediawiki"))).toBe("report.wiki")
  })
})

describe("cheatsheet data", () => {
  it("exposes format-specific titles and content", () => {
    expect(getFormatCheatsheet("markdown").title).toBe("Markdown cheatsheet")
    expect(getFormatCheatsheet("mediawiki").title).toBe("Wiki cheatsheet")
    expect(getFormatCheatsheet("markdown").sections).toHaveLength(3)
    expect(getFormatCheatsheet("mediawiki").sections).toHaveLength(3)
  })

  it("advertises the supported extensions", () => {
    expect(CONTENT_FORMATS.markdown.extensions).toEqual([".md", ".markdown"])
    expect(CONTENT_FORMATS.mediawiki.extensions).toEqual([".wiki", ".mediawiki", ".wikitext", ".wt"])
  })
})

describe("MediaWiki rendering safety and structure", () => {
  it("escapes raw HTML while preserving wiki formatting", () => {
    const html = parseMediaWiki("''italic'' and '''bold''' and '''''both'''''\n<script>alert(1)</script>")

    expect(html).toContain("<em>italic</em>")
    expect(html).toContain("<strong>bold</strong>")
    expect(html).toContain("<strong><em>both</em></strong>")
    expect(html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;')
    expect(html).not.toContain('<script>')
  })

  it("escapes external link URLs before injecting them into href attributes", () => {
    const html = parseMediaWiki('[https://example.com" onclick="alert(1) label]')

    expect(html).toContain('href="https://example.com&quot;"')
    expect(html).not.toContain('href="https://example.com" onclick="alert(1)"')
  })

  it("keeps consecutive wiki list items inside one list", () => {
    const html = parseMediaWiki('* one\n* two')

    expect((html.match(/<ul/g) || []).length).toBe(1)
    expect((html.match(/<li>/g) || []).length).toBe(2)
  })

  it("renders double-bracket external wiki links as external anchors", () => {
    const html = parseMediaWiki('[[https://example.com label]]')

    expect(html).toContain('href="https://example.com"')
    expect(html).toContain('>label</a>')
  })
})
