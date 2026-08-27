import { readFileSync } from "node:fs"

import { describe, expect, it } from "vitest"

describe("YAMI serif typography", () => {
  it("generates language-specific emphasis without changing the serif weight", () => {
    const tokens = JSON.parse(readFileSync("generated/tokens.json", "utf8"))
    const emphasis = tokens.tokens.find((token: { id: string }) => token.id === "font-weight.emphasize")
    expect(emphasis.values).toEqual(expect.arrayContaining([
      expect.objectContaining({ contextId: "root", cssValue: "500" }),
      expect.objectContaining({ contextId: "locale-en", cssValue: "500" }),
      expect.objectContaining({ contextId: "locale-zh", cssValue: "600" }),
    ]))
    const css = readFileSync("generated/tokens.css", "utf8")
    expect(css).toContain(":root:lang(zh), :where(:lang(zh)) {\n  --font-weight-emphasize: 600;")
    expect(css).toContain(":root:lang(en), :where(:lang(en)) {\n  --font-weight-emphasize: 500;")
  })

  it("keeps Latin glyphs at Medium inside Chinese emphasized text", () => {
    const fontsCss = readFileSync("styles/fonts.css", "utf8")
    expect(fontsCss).toMatch(/GT-Walsheim-Medium\.woff2[\s\S]*?font-weight: 500 600;/)
  })

  it("publishes the approved serif family and semibold weight tokens", () => {
    const tokensCss = readFileSync("generated/tokens.css", "utf8")

    expect(tokensCss).toContain("--font-family-serif: 'Source Serif 4', 'Source Han Serif SC', serif;")
    expect(tokensCss).toContain("--font-weight-semibold: 600;")
  })

  it("self-hosts Source Serif 4 at the two approved weights", () => {
    const fontsCss = readFileSync("styles/fonts.css", "utf8")

    expect(fontsCss).toContain("font-family: 'Source Serif 4';")
    expect(fontsCss).toContain("font-weight: 400;")
    expect(fontsCss).toContain("font-weight: 600;")
    expect(() => readFileSync("assets/fonts/SourceSerif4-Display-400.woff2")).not.toThrow()
    expect(() => readFileSync("assets/fonts/SourceSerif4-Subhead-600.woff2")).not.toThrow()
  })
})
