/* @vitest-environment happy-dom */

import { act, type ComponentType, type ReactNode } from "react"
import { createRoot, type Root } from "react-dom/client"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

;(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean })
  .IS_REACT_ACT_ENVIRONMENT = true

describe("YAMI RadioGroup behavior", () => {
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

  it("keeps exactly one option selected", async () => {
    const { RadioGroup, RadioGroupItem } = await vi.importActual<{
      RadioGroup: ComponentType<{ defaultValue?: string; children?: ReactNode }>
      RadioGroupItem: ComponentType<{ value: string; "aria-label": string }>
    }>("../components/RadioGroup/RadioGroup.tsx")

    await act(async () => {
      root.render(
        <RadioGroup defaultValue="card">
          <RadioGroupItem value="card" aria-label="Card" />
          <RadioGroupItem value="apple-pay" aria-label="Apple Pay" />
        </RadioGroup>,
      )
    })

    const radios = Array.from(container.querySelectorAll<HTMLElement>('[role="radio"]'))
    expect(radios.map((radio) => radio.getAttribute("aria-checked"))).toEqual(["true", "false"])

    await act(async () => radios[1]!.click())

    expect(radios.map((radio) => radio.getAttribute("aria-checked"))).toEqual(["false", "true"])
  })

  it("moves selection with arrow keys", async () => {
    const { RadioGroup, RadioGroupItem } = await vi.importActual<{
      RadioGroup: ComponentType<{ defaultValue?: string; children?: ReactNode }>
      RadioGroupItem: ComponentType<{ value: string; "aria-label": string }>
    }>("../components/RadioGroup/RadioGroup.tsx")

    await act(async () => {
      root.render(
        <RadioGroup defaultValue="card">
          <RadioGroupItem value="card" aria-label="Card" />
          <RadioGroupItem value="apple-pay" aria-label="Apple Pay" />
        </RadioGroup>,
      )
    })

    const radios = Array.from(container.querySelectorAll<HTMLElement>('[role="radio"]'))
    await act(async () => {
      radios[0]!.focus()
      radios[0]!.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }))
    })

    expect(radios.map((radio) => radio.getAttribute("aria-checked"))).toEqual(["false", "true"])
    expect(document.activeElement).toBe(radios[1])
  })
})
