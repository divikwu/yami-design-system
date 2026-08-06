/* @vitest-environment happy-dom */

import { act, type ComponentType, type CSSProperties, type ReactNode } from "react"
import { createRoot, type Root } from "react-dom/client"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

;(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean })
  .IS_REACT_ACT_ENVIRONMENT = true

interface AspectRatioTestProps {
  ratio: number
  children?: ReactNode
  className?: string
  style?: CSSProperties
}

describe("YAMI AspectRatio contracts", () => {
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

  it("exposes the requested ratio through its layout custom property", async () => {
    const { AspectRatio } = await vi.importActual<{
      AspectRatio: ComponentType<AspectRatioTestProps>
    }>("../components/AspectRatio/AspectRatio.tsx")

    await act(async () => {
      root.render(
        <AspectRatio ratio={16 / 9} className="media-frame" aria-label="Preview">
          <span>Media</span>
        </AspectRatio>,
      )
    })

    const frame = container.querySelector<HTMLElement>('[data-slot="aspect-ratio"]')

    expect(frame).toBeTruthy()
    expect(frame!.style.getPropertyValue("--aspect-ratio")).toBe(String(16 / 9))
    expect(frame!.classList.contains("media-frame")).toBe(true)
    expect(frame!.getAttribute("aria-label")).toBe("Preview")
    expect(frame!.textContent).toBe("Media")
  })
})
