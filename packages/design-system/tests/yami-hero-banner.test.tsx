/* @vitest-environment happy-dom */

import { act, type ComponentType, type ReactNode } from "react"
import { createRoot, type Root } from "react-dom/client"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import {
  dominantColorFromPixels,
  extractImageBottomColor,
  heroBannerPalette,
} from "../components/HeroBanner/imageColor"

;(
  globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }
).IS_REACT_ACT_ENVIRONMENT = true

interface HeroBannerTestItem {
  id: string
  href: string
  image?: {
    src: string
    alt: string
  }
  title?: ReactNode
  description?: ReactNode
  backgroundColor?: string
  products?: Array<{
    src: string
    alt: string
  }>
}

interface HeroBannerTestProps {
  items: HeroBannerTestItem[]
  ariaLabel?: string
  previousLabel?: string
  nextLabel?: string
  autoAdvance?: boolean
  autoAdvanceInterval?: number
  imageLoadingStrategy?: "native" | "windowed"
}

interface HeroBannerCardTestProps {
  item: HeroBannerTestItem
}

interface HeroBannerModule {
  HeroBanner: ComponentType<HeroBannerTestProps>
  HeroBannerImageOnlyCard: ComponentType<HeroBannerCardTestProps>
  HeroBannerImageTextCard: ComponentType<HeroBannerCardTestProps>
  HeroBannerImageTextProductsCard: ComponentType<HeroBannerCardTestProps>
  HeroBannerProductsOnlyCard: ComponentType<HeroBannerCardTestProps>
}

const items: HeroBannerTestItem[] = [
  {
    id: "street-food",
    href: "/campaigns/street-food",
    image: {
      src: "/street-food.webp",
      alt: "Asian street food spread",
    },
    title: "Midnight Street Food",
    description: "Explore Asian night bites",
    backgroundColor: "#FFD4B4",
    products: [
      { src: "/tea.webp", alt: "Bottled tea" },
      { src: "/snack.webp", alt: "Spicy snack" },
      { src: "/noodles.webp", alt: "Instant noodles" },
    ],
  },
  {
    id: "summer",
    href: "/campaigns/summer",
    image: {
      src: "/summer.webp",
      alt: "Summer drinks and snacks",
    },
    title: "Trending this Summer",
    description: "Discover your new summer favorites",
    backgroundColor: "#E6E2FB",
    products: [
      { src: "/drink.webp", alt: "Summer drink" },
      { src: "/mochi.webp", alt: "Mochi" },
      { src: "/soda.webp", alt: "Fruit soda" },
      { src: "/candy.webp", alt: "Fruit candy" },
    ],
  },
  {
    id: "image-only",
    href: "/campaigns/image-only",
    image: {
      src: "/image-only.webp",
      alt: "YAMI seasonal campaign",
    },
  },
]

describe("YAMI HeroBanner contracts", () => {
  let container: HTMLDivElement
  let root: Root
  let HeroBanner: ComponentType<HeroBannerTestProps>
  let HeroBannerImageOnlyCard: ComponentType<HeroBannerCardTestProps>
  let HeroBannerImageTextCard: ComponentType<HeroBannerCardTestProps>
  let HeroBannerImageTextProductsCard: ComponentType<HeroBannerCardTestProps>
  let HeroBannerProductsOnlyCard: ComponentType<HeroBannerCardTestProps>

  beforeEach(async () => {
    container = document.createElement("div")
    document.body.appendChild(container)
    root = createRoot(container)
    ;({
      HeroBanner,
      HeroBannerImageOnlyCard,
      HeroBannerImageTextCard,
      HeroBannerImageTextProductsCard,
      HeroBannerProductsOnlyCard,
    } = await vi.importActual<HeroBannerModule>(
      "../components/HeroBanner/index.ts",
    ))
  })

  afterEach(async () => {
    await act(async () => root.unmount())
    container.remove()
    vi.useRealTimers()
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it("renders one responsive promotion list with accessible campaign links", async () => {
    await act(async () => {
      root.render(
        <HeroBanner
          items={items}
          ariaLabel="Featured promotions"
        />,
      )
    })

    const section = container.querySelector<HTMLElement>(
      '[data-slot="hero-banner"]',
    )
    expect(section?.getAttribute("aria-label")).toBe("Featured promotions")
    expect(container.querySelector('[role="list"]')).toBeTruthy()
    expect(container.querySelectorAll('[role="listitem"]')).toHaveLength(3)

    const links = container.querySelectorAll<HTMLAnchorElement>(
      '[data-slot="hero-banner-item"]',
    )
    expect(links[0]?.href).toContain("/campaigns/street-food")
    expect(links[0]?.querySelector("img")?.alt).toBe(
      "Asian street food spread",
    )
    expect(links[2]?.getAttribute("aria-label")).toBe(
      "YAMI seasonal campaign",
    )
  })

  it("exposes an image-only campaign card", async () => {
    const imageOnlyItem = items[2]!

    await act(async () => {
      root.render(<HeroBannerImageOnlyCard item={imageOnlyItem} />)
    })

    const card = container.querySelector<HTMLElement>(
      '[data-hero-banner-content="image-only"]',
    )
    expect(card?.getAttribute("href")).toBe("/campaigns/image-only")
    expect(card?.querySelector("img")?.alt).toBe("YAMI seasonal campaign")
    expect(card?.querySelector('[data-slot="hero-banner-copy"]')).toBeNull()
    expect(card?.querySelector('[data-slot="hero-banner-products"]')).toBeNull()
  })

  it("keeps the campaign surface visible until its image is decoded", async () => {
    await act(async () => {
      root.render(
        <HeroBanner
          items={items}
          autoAdvance={false}
          imageLoadingStrategy="windowed"
        />,
      )
    })

    const image = container.querySelector<HTMLImageElement>(
      '[data-slot="hero-banner-item"] > img',
    )!
    expect(image.dataset.imageState).toBe("pending")

    await act(async () => {
      image.dispatchEvent(new Event("load", { bubbles: true }))
      await Promise.resolve()
    })

    expect(image.dataset.imageState).toBe("loaded")
  })

  it("exposes an image-and-text campaign card", async () => {
    const imageTextItem = {
      ...items[0]!,
      products: undefined,
    }

    await act(async () => {
      root.render(<HeroBannerImageTextCard item={imageTextItem} />)
    })

    const card = container.querySelector<HTMLElement>(
      '[data-hero-banner-content="image-text"]',
    )
    expect(card?.querySelector("img")?.alt).toBe(
      "Asian street food spread",
    )
    expect(card?.querySelector('[data-slot="hero-banner-copy"]')?.textContent).toContain(
      "Midnight Street Food",
    )
    expect(card?.querySelector('[data-slot="hero-banner-products"]')).toBeNull()
  })

  it("exposes an image, text, and products campaign card", async () => {
    await act(async () => {
      root.render(<HeroBannerImageTextProductsCard item={items[0]!} />)
    })

    const card = container.querySelector<HTMLElement>(
      '[data-hero-banner-content="image-text-products"]',
    )
    expect(card?.querySelector("img")?.alt).toBe(
      "Asian street food spread",
    )
    expect(card?.querySelector('[data-slot="hero-banner-copy"]')?.textContent).toContain(
      "Midnight Street Food",
    )
    expect(
      card?.querySelectorAll('[data-slot="hero-banner-product"]'),
    ).toHaveLength(3)
  })

  it("renders empty product slots without broken product images", async () => {
    const placeholderProductsItem = {
      ...items[0]!,
      products: Array.from({ length: 3 }, () => ({ src: "", alt: "" })),
    }

    await act(async () => {
      root.render(
        <HeroBannerImageTextProductsCard item={placeholderProductsItem} />,
      )
    })

    const productSlots = container.querySelectorAll(
      '[data-slot="hero-banner-product"]',
    )
    expect(productSlots).toHaveLength(3)
    expect(
      container.querySelectorAll('[data-slot="hero-banner-product"] img'),
    ).toHaveLength(0)
    expect(
      container.querySelectorAll(
        '[data-slot="hero-banner-product"][data-empty="true"]',
      ),
    ).toHaveLength(3)
  })

  it("exposes a products-only campaign card without a hero image", async () => {
    const productsOnlyItem: HeroBannerTestItem = {
      id: "products-only",
      href: "/collections/best-sellers",
      title: "Best Sellers",
      description: "Shop this week's favorites",
      backgroundColor: "#F3E6C8",
      products: items[0]!.products,
    }

    await act(async () => {
      root.render(<HeroBannerProductsOnlyCard item={productsOnlyItem} />)
    })

    const card = container.querySelector<HTMLElement>(
      '[data-hero-banner-content="products-only"]',
    )
    expect(card?.querySelector('[data-slot="hero-banner-hero-image"]')).toBeNull()
    expect(card?.querySelector('[data-slot="hero-banner-copy"]')?.textContent).toContain(
      "Best Sellers",
    )
    expect(card?.textContent).not.toContain("Shop this week's favorites")
    expect(
      card?.querySelectorAll('[data-slot="hero-banner-product"]'),
    ).toHaveLength(3)
  })

  it("selects the matching public card component for each item shape", async () => {
    const variantItems: HeroBannerTestItem[] = [
      items[2]!,
      {
        ...items[0]!,
        id: "image-text",
        products: undefined,
      },
      items[0]!,
      {
        id: "products-only",
        href: "/collections/best-sellers",
        title: "Best Sellers",
        products: items[0]!.products,
      },
    ]

    await act(async () => {
      root.render(<HeroBanner items={variantItems} autoAdvance={false} />)
    })

    expect(
      Array.from(
        container.querySelectorAll<HTMLElement>(
          '[data-hero-banner-content]',
        ),
      ).map((card) => card.dataset.heroBannerContent),
    ).toEqual([
      "image-only",
      "image-text",
      "image-text-products",
      "products-only",
    ])
  })

  it("prioritizes the first campaign image when a products-only card leads the rail", async () => {
    const productsOnlyItem: HeroBannerTestItem = {
      id: "products-only",
      href: "/collections/best-sellers",
      title: "Best Sellers",
      products: items[0]!.products,
    }

    await act(async () => {
      root.render(
        <HeroBanner items={[productsOnlyItem, items[2]!]} />,
      )
    })

    const campaignImage = container.querySelector<HTMLImageElement>(
      '[data-hero-banner-content="image-only"] img',
    )
    expect(campaignImage?.loading).toBe("eager")
    expect(campaignImage?.getAttribute("fetchpriority")).toBe("high")
  })

  it("keeps exactly one campaign eager while windowed originals and loop clones wait for activation", async () => {
    class PendingIntersectionObserver {
      constructor(_callback: IntersectionObserverCallback) {}
      observe() {}
      unobserve() {}
      disconnect() {}
      takeRecords() { return [] }
      readonly root = null
      readonly rootMargin = "0px"
      readonly thresholds = [0]
    }
    vi.stubGlobal("IntersectionObserver", PendingIntersectionObserver)

    await act(async () => {
      root.render(
        <HeroBanner items={items} imageLoadingStrategy="windowed" />,
      )
    })

    const campaignImages = Array.from(
      container.querySelectorAll<HTMLImageElement>(
        '[data-slot="hero-banner-item"] > img',
      ),
    )
    expect(campaignImages).toHaveLength(6)
    expect(campaignImages.filter((image) => image.loading === "eager")).toHaveLength(1)
    expect(
      campaignImages.filter(
        (image) => image.getAttribute("fetchpriority") === "high",
      ),
    ).toHaveLength(1)
    expect(campaignImages[0]?.getAttribute("src")).toBe("/street-food.webp")
    expect(
      campaignImages.slice(1).every((image) => !image.hasAttribute("src")),
    ).toBe(true)
  })

  it("infers the Figma product treatment from thumbnail count", async () => {
    await act(async () => {
      root.render(<HeroBanner items={items} />)
    })

    const cards = container.querySelectorAll<HTMLElement>(
      '[data-slot="hero-banner-item"]',
    )
    expect(cards[0]?.dataset.productLayout).toBe("strip")
    expect(cards[0]?.querySelectorAll('[data-slot="hero-banner-product"]')).toHaveLength(
      3,
    )
    expect(cards[1]?.dataset.productLayout).toBe("grid")
    expect(cards[1]?.querySelectorAll('[data-slot="hero-banner-product"]')).toHaveLength(
      4,
    )
    expect(cards[2]?.dataset.productLayout).toBe("none")
  })

  it("pages the desktop rail and exposes boundary state and progress", async () => {
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      value: vi.fn().mockReturnValue({ matches: false }),
    })
    const pagedItems = [
      ...items,
      ...items.map((item) => ({ ...item, id: `${item.id}-second-page` })),
    ]

    await act(async () => {
      root.render(
        <HeroBanner
          items={pagedItems}
          previousLabel="Previous promotions"
          nextLabel="Next promotions"
          autoAdvance={false}
        />,
      )
    })

    const rail = container.querySelector<HTMLElement>(
      '[data-slot="hero-banner-list"]',
    )!
    Object.defineProperties(rail, {
      clientWidth: { configurable: true, value: 300 },
      scrollWidth: { configurable: true, value: 900 },
      scrollLeft: { configurable: true, writable: true, value: 0 },
    })
    const scrollBy = vi.fn()
    Object.defineProperty(rail, "scrollBy", {
      configurable: true,
      value: scrollBy,
    })
    Object.defineProperties(rail.children[0]!, {
      offsetLeft: { configurable: true, value: 0 },
      offsetWidth: { configurable: true, value: 140 },
    })
    Object.defineProperty(rail.children[1]!, "offsetLeft", {
      configurable: true,
      value: 156,
    })

    await act(async () => {
      rail.dispatchEvent(new Event("scroll", { bubbles: true }))
    })

    const previous = container.querySelector<HTMLButtonElement>(
      'button[aria-label="Previous promotions"]',
    )!
    const next = container.querySelector<HTMLButtonElement>(
      'button[aria-label="Next promotions"]',
    )!
    const progressBar = container.querySelector<HTMLElement>(
      '[role="progressbar"]',
    )!
    expect(previous.getAttribute("aria-disabled")).toBe("true")
    expect(next.getAttribute("aria-disabled")).toBeNull()
    expect(container.querySelector('[data-slot="rail-navigation"]')).toBeTruthy()
    expect(progressBar.getAttribute("aria-valuemin")).toBe("1")
    expect(progressBar.getAttribute("aria-valuemax")).toBe("6")
    expect(progressBar.getAttribute("aria-valuenow")).toBe("1")
    expect(
      Number.parseFloat(
        progressBar.querySelector<HTMLElement>(
          '[data-slot="hero-banner-progress-fill"]',
        )?.style.width ?? "",
      ),
    ).toBeCloseTo(16.6667, 4)
    expect(container.querySelector('[data-slot="hero-banner-progress"]')?.textContent).toContain(
      "1 / 6",
    )

    await act(async () => next.click())
    expect(scrollBy).toHaveBeenCalledWith({
      left: 156,
      behavior: "smooth",
    })

    rail.scrollLeft = 600
    await act(async () => {
      rail.dispatchEvent(new Event("scroll", { bubbles: true }))
    })
    expect(previous.getAttribute("aria-disabled")).toBeNull()
    expect(next.getAttribute("aria-disabled")).toBe("true")
    expect(progressBar.getAttribute("aria-valuenow")).toBe("5")
    expect(
      Number.parseFloat(
        progressBar.querySelector<HTMLElement>(
          '[data-slot="hero-banner-progress-fill"]',
        )?.style.width ?? "",
      ),
    ).toBeCloseTo(83.3333, 4)
    expect(container.querySelector('[data-slot="hero-banner-progress"]')?.textContent).toContain(
      "5 / 6",
    )
  })

  it("pauses auto-advance outside the viewport and resumes when visible", async () => {
    vi.useFakeTimers()
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      value: vi.fn().mockReturnValue({ matches: false }),
    })

    let visibilityCallback: IntersectionObserverCallback | undefined
    const observe = vi.fn()
    const disconnect = vi.fn()
    class MockIntersectionObserver {
      constructor(callback: IntersectionObserverCallback) {
        visibilityCallback = callback
      }

      observe = observe
      disconnect = disconnect
    }
    vi.stubGlobal("IntersectionObserver", MockIntersectionObserver)

    await act(async () => {
      root.render(
        <HeroBanner
          items={items.slice(0, 2)}
          autoAdvanceInterval={0.1}
        />,
      )
    })

    const section = container.querySelector<HTMLElement>(
      '[data-slot="hero-banner"]',
    )!
    const rail = container.querySelector<HTMLElement>(
      '[data-slot="hero-banner-list"]',
    )!
    Object.defineProperties(rail, {
      clientWidth: { configurable: true, value: 300 },
      scrollWidth: { configurable: true, value: 900 },
      scrollLeft: { configurable: true, writable: true, value: 0 },
      scrollTo: { configurable: true, value: vi.fn() },
    })
    Object.defineProperties(rail.children[0]!, {
      offsetLeft: { configurable: true, value: 0 },
      offsetWidth: { configurable: true, value: 140 },
    })
    Object.defineProperty(rail.children[1]!, "offsetLeft", {
      configurable: true,
      value: 156,
    })

    expect(observe).toHaveBeenCalledWith(section)

    await act(async () => {
      visibilityCallback?.(
        [
          {
            isIntersecting: false,
            target: section,
          } as unknown as IntersectionObserverEntry,
        ],
        {} as IntersectionObserver,
      )
      await vi.advanceTimersByTimeAsync(500)
    })
    expect(rail.scrollTo).not.toHaveBeenCalled()

    await act(async () => {
      visibilityCallback?.(
        [
          {
            isIntersecting: true,
            target: section,
          } as unknown as IntersectionObserverEntry,
        ],
        {} as IntersectionObserver,
      )
      await vi.advanceTimersByTimeAsync(100)
    })
    expect(rail.scrollTo).toHaveBeenCalledTimes(1)
  })
})

describe("YAMI HeroBanner campaign palette", () => {
  it("uses fixed black copy on bright sampled surfaces", () => {
    expect(heroBannerPalette("rgb(247, 225, 226)")).toEqual({
      foreground: "dark",
      surfaceColor: "rgb(247, 225, 226)",
    })
  })

  it("uses fixed white copy and darkens a medium-dark sample to AA contrast", () => {
    const palette = heroBannerPalette("rgb(176, 116, 79)")

    expect(palette.foreground).toBe("light")
    expect(palette.surfaceColor).toMatch(/^rgb\(/)

    const channels = palette.surfaceColor?.match(/\d+/g)?.map(Number)
    expect(channels).toHaveLength(3)
    const [red = 0, green = 0, blue = 0] = channels ?? []
    const linearize = (channel: number) => {
      const normalized = channel / 255
      return normalized <= 0.04045
        ? normalized / 12.92
        : ((normalized + 0.055) / 1.055) ** 2.4
    }
    const luminance =
      0.2126 * linearize(red) +
      0.7152 * linearize(green) +
      0.0722 * linearize(blue)
    expect(1.05 / (luminance + 0.05)).toBeGreaterThanOrEqual(4.5)
  })
})

describe("YAMI HeroBanner image color extraction", () => {
  it("selects the dominant quantized color instead of averaging unrelated pixels", () => {
    const pixels = new Uint8ClampedArray([
      106, 180, 110, 255,
      102, 176, 108, 255,
      110, 184, 112, 255,
      220, 80, 60, 255,
    ])

    expect(dominantColorFromPixels(pixels)).toBe("rgb(106, 180, 110)")
  })

  it("shares one image load and canvas sample for repeated URLs", async () => {
    let imageCount = 0
    class FakeImage {
      crossOrigin = ""
      decoding = "auto"
      naturalWidth = 100
      naturalHeight = 100
      onload: (() => void) | null = null
      onerror: (() => void) | null = null

      constructor() {
        imageCount += 1
      }

      set src(_value: string) {
        queueMicrotask(() => this.onload?.())
      }
    }
    vi.stubGlobal("Image", FakeImage)
    vi.stubGlobal("createImageBitmap", vi.fn().mockResolvedValue({
      width: 100,
      height: 100,
      close: vi.fn(),
    }))

    const originalCreateElement = document.createElement.bind(document)
    vi.spyOn(document, "createElement").mockImplementation((tagName: string) => {
      if (tagName !== "canvas") return originalCreateElement(tagName)
      return {
        width: 0,
        height: 0,
        getContext: () => ({
          drawImage: () => {},
          getImageData: () => ({
            data: new Uint8ClampedArray([106, 180, 110, 255]),
          }),
        }),
      } as unknown as HTMLCanvasElement
    })

    const [first, second] = await Promise.all([
      extractImageBottomColor("/shared-campaign-cache-test.webp"),
      extractImageBottomColor("/shared-campaign-cache-test.webp"),
    ])

    expect(first).toBe("rgb(106, 180, 110)")
    expect(second).toBe(first)
    expect(imageCount).toBe(1)
  })
})
