/* @vitest-environment happy-dom */

import { act, type ComponentType, type InputHTMLAttributes, type ReactNode } from "react"
import { createRoot, type Root } from "react-dom/client"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

;(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean })
  .IS_REACT_ACT_ENVIRONMENT = true

describe("YAMI Input keyboard contracts", () => {
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

  it("keeps the clear action mounted when keyboard focus moves to it", async () => {
    const { Input } = await vi.importActual<{
      Input: ComponentType<
        InputHTMLAttributes<HTMLInputElement> & { label?: ReactNode; clearable?: boolean }
      >
    }>("../components/Input/Input.tsx")

    await act(async () => {
      root.render(<Input label="Search" defaultValue="Matcha" clearable />)
    })

    const input = container.querySelector("input")
    expect(input).toBeTruthy()

    await act(async () => input!.focus())
    const clearButton = container.querySelector<HTMLButtonElement>(
      'button[aria-label="Clear input"]',
    )
    expect(clearButton).toBeTruthy()

    await act(async () => clearButton!.focus())

    expect(clearButton!.isConnected).toBe(true)
    expect(document.activeElement).toBe(clearButton)
  })
})
