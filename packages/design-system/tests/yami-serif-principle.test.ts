import { describe, expect, it } from "vitest"

import { noDecorativeMedia } from "../principles/validators/no-decorative-media"

describe("YAMI approved serif typography", () => {
  it("allows the registered serif family token", () => {
    const result = noDecorativeMedia.check(".title { font-family: var(--font-family-serif); }")

    expect(result.pass).toBe(true)
    expect(result.violations).toEqual([])
  })

  it("rejects component-authored serif font stacks", () => {
    const result = noDecorativeMedia.check('.title { font-family: Georgia, serif; }')

    expect(result.pass).toBe(false)
    expect(result.violations).toHaveLength(1)
  })
})
