/* @vitest-environment happy-dom */

import { act, type ComponentType, type ReactNode } from "react"
import { createRoot, type Root } from "react-dom/client"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

;(
  globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }
).IS_REACT_ACT_ENVIRONMENT = true

interface ProductListTestItem {
  id: string
  href: string
  title: ReactNode
  priceCurrent: ReactNode
  image?: string
  imageAlt?: string
}

interface ProductListTestProps {
  title: ReactNode
  products: ProductListTestItem[]
  appearance?: "standard" | "themed" | "atmospheric"
  layout?: "rail" | "waterfall"
  mobileSurface?: "card" | "plain"
  tabs?: Array<{
    value: string
    label: ReactNode
    disabled?: boolean
  }>
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
  onAddToCart?: (productId: string) => void
  banner?: {
    src: string
    mobileSrc?: string
    alt: string
    backgroundColor?: string
    mobileBackgroundColor?: string
  }
  backgroundColor?: string
  backgroundImage?: string
  backgroundImageMobile?: string
  viewAllHref?: string
  viewAllLabel?: ReactNode
  hasMore?: boolean
  onLoadMore?: () => void
  loadMoreLabel?: ReactNode
  loading?: boolean
  loadingLabel?: string
  skeletonCount?: number
}

const products: ProductListTestItem[] = [
  {
    id: "matcha",
    href: "/product/matcha",
    title: "Uji Matcha Powder",
    priceCurrent: "$24.99",
  },
  {
    id: "ramen",
    href: "/product/ramen",
    title: "Tonkotsu Ramen",
    priceCurrent: "$8.99",
  },
]

describe("YAMI ProductList contracts", () => {
  let container: HTMLDivElement
  let root: Root
  let ProductList: ComponentType<ProductListTestProps>

  beforeEach(async () => {
    container = document.createElement("div")
    document.body.appendChild(container)
    root = createRoot(container)
    ;({ ProductList } = await vi.importActual<{
      ProductList: ComponentType<ProductListTestProps>
    }>("../components/ProductList/ProductList.tsx"))
  })

  afterEach(async () => {
    await act(async () => root.unmount())
    container.remove()
    vi.restoreAllMocks()
  })

  it.each([
    ["rail", "rich"],
    ["waterfall", "rich"],
  ] as const)(
    "maps %s to the consistent %s ProductCard presentation",
    async (layout, presentation) => {
      await act(async () => {
        root.render(<ProductList title="Featured" products={products} layout={layout} />)
      })

      const cards = container.querySelectorAll<HTMLElement>('[data-slot="product-card"]')
      expect(cards).toHaveLength(products.length)
      expect(Array.from(cards).every((card) => card.dataset.presentation === presentation)).toBe(
        true,
      )
      expect(container.querySelector('[role="list"]')).toBeTruthy()
      expect(container.querySelectorAll('[role="listitem"]')).toHaveLength(2)
    },
  )

  it("exposes the mobile surface contract without changing the card default", async () => {
    await act(async () => {
      root.render(
        <>
          <ProductList title="Card" products={products} />
          <ProductList title="Plain" products={products} mobileSurface="plain" />
        </>,
      )
    })

    const lists = container.querySelectorAll<HTMLElement>(
      '[data-slot="product-list"]',
    )
    expect(lists[0]?.dataset.mobileSurface).toBe("card")
    expect(lists[1]?.dataset.mobileSurface).toBe("plain")
  })

  it("supports uncontrolled tabs and ignores disabled tabs", async () => {
    const onValueChange = vi.fn()

    await act(async () => {
      root.render(
        <ProductList
          title="Featured"
          products={products}
          tabs={[
            { value: "all", label: "All" },
            { value: "beauty", label: "Beauty" },
            { value: "disabled", label: "Disabled", disabled: true },
          ]}
          onValueChange={onValueChange}
        />,
      )
    })

    const tabs = container.querySelectorAll<HTMLButtonElement>('[role="tab"]')
    expect(tabs[0]?.getAttribute("aria-selected")).toBe("true")
    expect(tabs[2]?.getAttribute("aria-disabled")).toBe("true")

    await act(async () => tabs[1]!.click())
    expect(onValueChange).toHaveBeenCalledWith("beauty")
    expect(tabs[1]?.getAttribute("aria-selected")).toBe("true")

    await act(async () => tabs[2]!.click())
    expect(onValueChange).toHaveBeenCalledTimes(1)
  })

  it("supports controlled tabs without changing selection internally", async () => {
    const onValueChange = vi.fn()

    await act(async () => {
      root.render(
        <ProductList
          title="Featured"
          products={products}
          tabs={[
            { value: "all", label: "All" },
            { value: "beauty", label: "Beauty" },
          ]}
          value="all"
          onValueChange={onValueChange}
        />,
      )
    })

    const tabs = container.querySelectorAll<HTMLButtonElement>('[role="tab"]')
    await act(async () => tabs[1]!.click())
    expect(onValueChange).toHaveBeenCalledWith("beauty")
    expect(tabs[0]?.getAttribute("aria-selected")).toBe("true")
  })

  it("reports the correct product id from the independent quick-add action", async () => {
    const onAddToCart = vi.fn()

    await act(async () => {
      root.render(<ProductList title="Featured" products={products} onAddToCart={onAddToCart} />)
    })

    const secondItem = container.querySelectorAll('[role="listitem"]')[1]!
    const addButton = secondItem.querySelector<HTMLButtonElement>(
      '[data-slot="product-card-add-button"]',
    )!
    expect(addButton.closest("a")).toBeNull()

    await act(async () => addButton.click())
    expect(onAddToCart).toHaveBeenCalledOnce()
    expect(onAddToCart).toHaveBeenCalledWith("ramen")
  })

  it("renders responsive view-all links with the YAMI chevron-right icon", async () => {
    await act(async () => {
      root.render(
        <ProductList
          title="Featured"
          products={products}
          viewAllHref="/collections/featured"
          viewAllLabel="See all products"
        />,
      )
    })

    const desktopLink = container.querySelector<HTMLAnchorElement>(
      '[data-slot="product-list-view-all"]',
    )
    const mobileLink = container.querySelector<HTMLAnchorElement>(
      '[data-slot="product-list-view-all-mobile"]',
    )

    expect(desktopLink?.href).toContain("/collections/featured")
    expect(desktopLink?.textContent).toBe("See all products")
    expect(mobileLink?.href).toContain("/collections/featured")
    expect(mobileLink?.textContent).toBe("See all products")
    expect(
      mobileLink?.querySelector('[data-icon="chevron-right"]'),
    ).toBeTruthy()
  })

  it("scrolls a rail and updates arrow boundary states", async () => {
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      value: vi.fn().mockReturnValue({ matches: false }),
    })

    await act(async () => {
      root.render(<ProductList title="Featured" products={products} />)
    })

    const rail = container.querySelector<HTMLElement>('[data-slot="product-list-items"]')!
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
    const items = rail.children
    Object.defineProperties(items[0]!, {
      offsetLeft: { configurable: true, value: 0 },
      offsetWidth: { configurable: true, value: 100 },
    })
    Object.defineProperty(items[1]!, "offsetLeft", {
      configurable: true,
      value: 124,
    })

    await act(async () => rail.dispatchEvent(new Event("scroll", { bubbles: true })))

    const previous = container.querySelector<HTMLButtonElement>(
      'button[aria-label="Previous products"]',
    )!
    const next = container.querySelector<HTMLButtonElement>('button[aria-label="Next products"]')!
    expect(previous.getAttribute("aria-disabled")).toBe("true")
    expect(next.getAttribute("aria-disabled")).toBeNull()
    expect(container.querySelector('[data-slot="rail-navigation"]')).toBeTruthy()
    expect(next.querySelector("svg")?.getAttribute("width")).toBe("16")
    expect(next.querySelector("svg")?.getAttribute("height")).toBe("16")

    await act(async () => next.click())
    expect(scrollBy).toHaveBeenCalledWith({
      left: 248,
      behavior: "smooth",
    })

    rail.scrollLeft = 600
    await act(async () => rail.dispatchEvent(new Event("scroll", { bubbles: true })))
    expect(previous.getAttribute("aria-disabled")).toBeNull()
    expect(next.getAttribute("aria-disabled")).toBe("true")
  })

  it("renders themed banner semantics and atmospheric decoration", async () => {
    await act(async () => {
      root.render(
        <>
          <ProductList
            title="Themed"
            products={products}
            appearance="themed"
            banner={{
              src: "/themed.webp",
              mobileSrc: "/themed-mobile.webp",
              alt: "Summer beauty event",
              backgroundColor: "#E4E5F0",
              mobileBackgroundColor: "#F9EAF3",
            }}
          />
          <ProductList
            title="Atmospheric"
            products={products}
            appearance="atmospheric"
            backgroundColor="#FBD9CF"
            backgroundImage="/atmosphere.webp"
            backgroundImageMobile="/atmosphere-mobile.webp"
          />
        </>,
      )
    })

    const banner = container.querySelector<HTMLImageElement>(
      '[data-slot="product-list-banner"] img',
    )
    expect(banner?.alt).toBe("Summer beauty event")
    const mobileBanner = container.querySelector<HTMLSourceElement>(
      '[data-slot="product-list-banner"] source',
    )
    expect(mobileBanner?.media).toBe("(max-width: 1023px)")
    expect(mobileBanner?.srcset).toBe("/themed-mobile.webp")
    const themed = container.querySelector<HTMLElement>('[data-appearance="themed"]')
    expect(themed?.style.getPropertyValue("--product-list-theme-color")).toBe("#E4E5F0")
    expect(themed?.style.getPropertyValue("--product-list-theme-color-mobile")).toBe(
      "#F9EAF3",
    )
    const atmospheric = container.querySelector<HTMLElement>('[data-appearance="atmospheric"]')
    expect(atmospheric?.style.getPropertyValue("--product-list-background-color")).toBe(
      "#FBD9CF",
    )
    expect(atmospheric?.style.getPropertyValue("--product-list-background-image")).toContain(
      "/atmosphere.webp",
    )
    expect(
      atmospheric?.style.getPropertyValue("--product-list-background-image-mobile"),
    ).toContain("/atmosphere-mobile.webp")
    expect(atmospheric?.querySelector("img")).toBeNull()
  })

  it.each([
    ["rail", 4],
    ["waterfall", 5],
  ] as const)(
    "renders %s skeletons while hiding products and announcing loading",
    async (layout, skeletonCount) => {
      await act(async () => {
        root.render(
          <ProductList
            title="Featured"
            products={products}
            layout={layout}
            loading
            loadingLabel="Products are loading"
            skeletonCount={skeletonCount}
          />,
        )
      })

      const section = container.querySelector<HTMLElement>('[data-slot="product-list"]')
      expect(section?.getAttribute("aria-busy")).toBe("true")
      expect(section?.textContent).toContain("Products are loading")
      expect(container.querySelector('[data-slot="product-card"]')).toBeNull()
      expect(container.querySelectorAll('[data-slot="product-list-skeleton-item"]')).toHaveLength(
        skeletonCount,
      )
    },
  )

  it("exposes the waterfall load-more action", async () => {
    const onLoadMore = vi.fn()

    await act(async () => {
      root.render(
        <ProductList
          title="More discoveries"
          products={products}
          layout="waterfall"
          hasMore
          onLoadMore={onLoadMore}
          loadMoreLabel="View more products"
        />,
      )
    })

    const button = Array.from(container.querySelectorAll("button")).find(
      (candidate) => candidate.textContent === "View more products",
    )!
    await act(async () => button.click())
    expect(onLoadMore).toHaveBeenCalledOnce()
  })
})
