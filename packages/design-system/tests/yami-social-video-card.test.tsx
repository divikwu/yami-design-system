/* @vitest-environment happy-dom */

import { act } from "react"
import { createRoot, type Root } from "react-dom/client"
import { afterEach, beforeEach, describe, expect, it } from "vitest"

import { ImageLoadingWindow } from "../components/ResponsiveImage"
import { SocialVideoCard } from "../components/SocialMediaGallery/SocialVideoCard"

;(
  globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }
).IS_REACT_ACT_ENVIRONMENT = true

describe("YAMI social video image placeholders", () => {
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

  it("keeps poster and product media pending until their images load", async () => {
    await act(async () => {
      root.render(
        <ImageLoadingWindow strategy="windowed">
          <SocialVideoCard
            id="social-card"
            posterSrc="/poster.webp"
            posterAlt="Social poster"
            username="@yami"
            platformIconSrc="/platform.svg"
            caption="Featured products"
            products={[
              {
                id: "product",
                imageSrc: "/product.webp",
                imageAlt: "Featured product",
              },
            ]}
          />
        </ImageLoadingWindow>,
      )
    })

    const poster = container.querySelector<HTMLImageElement>(
      '[data-slot="social-video-card-media"] > img',
    )!
    const product = container.querySelector<HTMLImageElement>(
      '[data-slot="social-video-card-products"] img',
    )!

    expect(poster.dataset.imageState).toBe("pending")
    expect(product.dataset.imageState).toBe("pending")
  })
})
