/* @vitest-environment happy-dom */

import { act, useRef } from "react"
import { createRoot, type Root } from "react-dom/client"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import {
  ImageLoadingWindow,
  ResponsiveImage,
} from "../components/ResponsiveImage"

;(
  globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }
).IS_REACT_ACT_ENVIRONMENT = true

describe("YAMI responsive image loading", () => {
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
    vi.unstubAllGlobals()
  })

  it("does not assign a real source until a windowed image enters the rail window", async () => {
    let notifyHorizontalIntersection:
      | ((entries: IntersectionObserverEntry[]) => void)
      | undefined
    let notifyViewportIntersection:
      | ((entries: IntersectionObserverEntry[]) => void)
      | undefined

    class FakeIntersectionObserver {
      constructor(
        callback: IntersectionObserverCallback,
        options?: IntersectionObserverInit,
      ) {
        const notify = (entries: IntersectionObserverEntry[]) =>
          callback(entries, this as never)
        if (options?.root) {
          notifyHorizontalIntersection = notify
        } else {
          notifyViewportIntersection = notify
        }
      }

      observe() {}
      unobserve() {}
      disconnect() {}
      takeRecords() { return [] }
      readonly root = null
      readonly rootMargin = "0px"
      readonly thresholds = [0]
    }

    vi.stubGlobal("IntersectionObserver", FakeIntersectionObserver)

    function WindowedImage() {
      const railRef = useRef<HTMLDivElement>(null)
      return (
        <ImageLoadingWindow strategy="windowed" rootRef={railRef}>
          <div ref={railRef}>
            <ResponsiveImage
              source={{
                src: "/poster-240.webp",
                width: 240,
                height: 420,
                candidates: [
                  { src: "/poster-240.webp", width: 240 },
                  { src: "/poster-480.webp", width: 480 },
                ],
                sizes: "240px",
              }}
              alt="Social poster"
            />
          </div>
        </ImageLoadingWindow>
      )
    }

    await act(async () => root.render(<WindowedImage />))

    const image = container.querySelector<HTMLImageElement>("img")!
    expect(image.hasAttribute("src")).toBe(false)
    expect(image.hasAttribute("srcset")).toBe(false)
    expect(image.width).toBe(240)
    expect(image.height).toBe(420)

    await act(async () => {
      notifyHorizontalIntersection?.([
        {
          isIntersecting: true,
          target: image,
        } as unknown as IntersectionObserverEntry,
      ])
    })

    expect(image.hasAttribute("src")).toBe(false)

    await act(async () => {
      notifyViewportIntersection?.([
        {
          isIntersecting: true,
          target: image.parentElement,
        } as unknown as IntersectionObserverEntry,
      ])
    })

    expect(image.getAttribute("src")).toBe("/poster-240.webp")
    expect(image.getAttribute("srcset")).toBe(
      "/poster-240.webp 240w, /poster-480.webp 480w",
    )
  })

  it("falls back to native lazy loading when IntersectionObserver is unavailable", async () => {
    vi.stubGlobal("IntersectionObserver", undefined)

    function WindowedImage() {
      const railRef = useRef<HTMLDivElement>(null)
      return (
        <ImageLoadingWindow strategy="windowed" rootRef={railRef}>
          <div ref={railRef}>
            <ResponsiveImage
              source="/fallback.webp"
              alt="Fallback image"
              loading="lazy"
            />
          </div>
        </ImageLoadingWindow>
      )
    }

    await act(async () => root.render(<WindowedImage />))

    const image = container.querySelector<HTMLImageElement>("img")!
    expect(image.getAttribute("src")).toBe("/fallback.webp")
    expect(image.loading).toBe("lazy")
  })

  it("keeps an opted-in image pending until its decoded load is ready", async () => {
    await act(async () => {
      root.render(
        <ResponsiveImage
          source="/progressive.webp"
          alt="Progressive image"
          revealOnLoad
        />,
      )
    })

    const image = container.querySelector<HTMLImageElement>("img")!
    expect(image.dataset.imageState).toBe("pending")

    await act(async () => {
      image.dispatchEvent(new Event("load", { bubbles: true }))
      await Promise.resolve()
    })

    expect(image.dataset.imageState).toBe("loaded")
  })

  it("keeps the native default free of progressive reveal state", async () => {
    await act(async () => {
      root.render(<ResponsiveImage source="/native.webp" alt="Native image" />)
    })

    const image = container.querySelector<HTMLImageElement>("img")!
    expect(image.dataset.imageState).toBeUndefined()
  })
})
