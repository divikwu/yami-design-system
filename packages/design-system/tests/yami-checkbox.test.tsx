/* @vitest-environment happy-dom */

import { act, type ComponentType } from "react"
import { createRoot, type Root } from "react-dom/client"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

;(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean })
  .IS_REACT_ACT_ENVIRONMENT = true

describe("YAMI Checkbox behavior", () => {
  let container: HTMLDivElement
  let root: Root

  beforeEach(() => {
    container = document.createElement("div")
    document.body.appendChild(container)
    root = createRoot(container)
  })

  afterEach(async () => {
    await act(async () => root.unmount())
    container.remove()
  })

  it("toggles its checked state through the public control", async () => {
    const { Checkbox } = await vi.importActual<{
      Checkbox: ComponentType<{ "aria-label": string; defaultChecked?: boolean }>
    }>("../components/Checkbox/Checkbox.tsx")

    await act(async () => {
      root.render(<Checkbox aria-label="Save payment method" />)
    })

    const checkbox = container.querySelector<HTMLElement>('[role="checkbox"]')
    expect(checkbox?.getAttribute("aria-checked")).toBe("false")

    await act(async () => checkbox!.click())

    expect(checkbox?.getAttribute("aria-checked")).toBe("true")
  })

  it("does not toggle while disabled", async () => {
    const { Checkbox } = await vi.importActual<{
      Checkbox: ComponentType<{ "aria-label": string; disabled?: boolean }>
    }>("../components/Checkbox/Checkbox.tsx")

    await act(async () => {
      root.render(<Checkbox aria-label="Unavailable option" disabled />)
    })

    const checkbox = container.querySelector<HTMLElement>('[role="checkbox"]')
    await act(async () => checkbox!.click())

    expect(checkbox?.getAttribute("aria-checked")).toBe("false")
    expect(checkbox?.getAttribute("data-disabled")).not.toBeNull()
  })
})
