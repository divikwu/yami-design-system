import { readFileSync } from "node:fs"

import { describe, expect, it } from "vitest"

describe("YAMI serif typography", () => {
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
