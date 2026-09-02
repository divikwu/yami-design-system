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

    expect(tokensCss).toContain("--font-family-serif: 'Source Serif 4 Variable', 'Noto Serif SC', serif;")
    expect(tokensCss).toContain("--font-weight-semibold: 600;")
  })

  it("self-hosts optical Source Serif 4 and Noto Serif SC", () => {
    const fontsCss = readFileSync("styles/fonts.css", "utf8")

    expect(fontsCss).toContain('@import "@fontsource-variable/source-serif-4/opsz.css";')
    expect(fontsCss).toContain('@import "@fontsource/noto-serif-sc/400.css";')
    expect(fontsCss).toContain('@import "@fontsource/noto-serif-sc/600.css";')

    const packageJson = JSON.parse(readFileSync("package.json", "utf8"))
    expect(packageJson.dependencies).toMatchObject({
      "@fontsource-variable/source-serif-4": "5.3.0",
      "@fontsource/noto-serif-sc": "5.3.0",
    })
    expect(packageJson.dependencies).not.toHaveProperty("@fontsource/noto-serif")
  })
})
