/* @vitest-environment happy-dom */

import { act, type ComponentType, type MouseEventHandler, type ReactNode } from "react"
import { createRoot, type Root } from "react-dom/client"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

;(
  globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }
).IS_REACT_ACT_ENVIRONMENT = true

interface ProductCardTestProps {
  href: string
  title: ReactNode
  priceCurrent: ReactNode
  image?:
    | string
    | {
        src: string
        width: number
        height: number
        candidates: Array<{ src: string; width: number }>
        sizes: string
      }
  imageAlt?: string
  imageLoading?: "eager" | "lazy"
  imageFetchPriority?: "high" | "low" | "auto"
  brand?: ReactNode
  brandHref?: string
  ranking?: ReactNode
  rating?: number
  ratingCount?: ReactNode
  soldCount?: ReactNode
  unitPrice?: ReactNode
  promotions?: Array<{
    badge: ReactNode
    label?: ReactNode
    value: ReactNode
    tone?: "default" | "emphasis"
  }>
  countdown?: ReactNode
  badges?: Array<{ label: ReactNode; type: string }>
  onAddToCart?: MouseEventHandler<HTMLButtonElement>
  presentation?: "rich" | "minimal" | "compact"
}

interface ProductCardAddButtonTestProps {
  "aria-label"?: string
  disabled?: boolean
  onClick?: MouseEventHandler<HTMLButtonElement>
}

describe("YAMI ProductCard interaction contracts", () => {
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

  it("keeps the quick-add button outside the product link", async () => {
    const { ProductCard } = await vi.importActual<{
      ProductCard: ComponentType<ProductCardTestProps>
    }>("../components/ProductCard/ProductCard.tsx")

    await act(async () => {
      root.render(
        <ProductCard
          href="/product/matcha"
          title="Uji Matcha Powder"
          priceCurrent="$24.99"
          onAddToCart={() => {}}
        />,
      )
    })

    const productLink = container.querySelector<HTMLAnchorElement>('a[href="/product/matcha"]')
    const addButton = container.querySelector<HTMLButtonElement>('button[aria-label="Add to cart"]')

    expect(productLink).toBeTruthy()
    expect(addButton).toBeTruthy()
    expect(productLink!.querySelector("button")).toBeNull()
    expect(addButton!.closest('[data-slot="product-card-media"]')).toBeTruthy()
  })

  it("uses the product destination for the image and title across presentations", async () => {
    const { ProductCard } = await vi.importActual<{
      ProductCard: ComponentType<ProductCardTestProps>
    }>("../components/ProductCard/ProductCard.tsx")

    await act(async () => {
      root.render(
        <>
          <ProductCard
            href="/product/rich"
            title="Rich product"
            priceCurrent="$24.99"
          />
          <ProductCard
            href="/product/minimal"
            title="Minimal product"
            priceCurrent="$18.99"
            presentation="minimal"
          />
          <ProductCard
            href="/product/compact"
            title="Compact product"
            priceCurrent="$12.99"
            presentation="compact"
          />
        </>,
      )
    })

    const cards = container.querySelectorAll<HTMLElement>(
      '[data-slot="product-card"]',
    )

    cards.forEach((card, index) => {
      const href = ["/product/rich", "/product/minimal", "/product/compact"][
        index
      ]
      expect(
        card.querySelector<HTMLAnchorElement>(
          '[data-slot="product-card-media-link"]',
        )?.getAttribute("href"),
      ).toBe(href)
    })

    expect(
      cards[0]?.querySelector<HTMLAnchorElement>(
        '[data-slot="product-card-summary"] a[href="/product/rich"]',
      ),
    ).toBeTruthy()
    expect(
      cards[2]?.querySelector<HTMLAnchorElement>(
        '[data-slot="product-card-summary"] a[href="/product/compact"]',
      ),
    ).toBeTruthy()
  })

  it("composes media, summary, and offer anatomy from the Figma card", async () => {
    const { ProductCard } = await vi.importActual<{
      ProductCard: ComponentType<ProductCardTestProps>
    }>("../components/ProductCard/ProductCard.tsx")

    await act(async () => {
      root.render(
        <ProductCard
          href="/product/torriden-mask"
          brand="Torriden"
          brandHref="/brands/torriden"
          title="Dive In Low Molecule Hyaluronic Acid Mask 27ml 10pcs"
          priceCurrent="$19.99"
          ranking="#1 Most in Cart Masks"
          rating={4.9}
          ratingCount="1,888"
          soldCount="100+ Sold"
          unitPrice="$5.19/ea · 3 pk"
          promotions={[
            { badge: "VVIP", label: "Price:", value: "$17.99" },
            { badge: "11.11", value: "Amazing Deals!", tone: "emphasis" },
          ]}
          countdown="Ends in 2d 16:28:09"
        />,
      )
    })

    expect(container.querySelector('[data-slot="product-card-media"]')).toBeTruthy()
    expect(container.querySelector('[data-slot="product-card-summary"]')).toBeTruthy()
    expect(container.querySelector('[data-slot="product-card-offer"]')).toBeTruthy()
    const brandLink = container.querySelector<HTMLAnchorElement>('a[href="/brands/torriden"]')
    expect(brandLink).toBeTruthy()
    expect(brandLink!.querySelector('svg[aria-hidden="true"]')).toBeTruthy()
    expect(container.querySelector('[data-slot="product-card-ranking"]')?.textContent).toContain(
      "#1 Most in Cart Masks",
    )
    expect(container.querySelector('[data-slot="product-card-sold"]')?.textContent).toContain(
      "100+ Sold",
    )
    expect(container.querySelector('[data-slot="product-card-unit-price"]')?.textContent).toContain(
      "$5.19/ea · 3 pk",
    )
    expect(container.querySelectorAll('[data-slot="product-card-promotion"]')).toHaveLength(2)
    expect(container.querySelector('[data-slot="product-card-countdown"]')?.textContent).toContain(
      "Ends in 2d 16:28:09",
    )
  })

  it("keeps rich as the default and exposes minimal and compact presentations", async () => {
    const { ProductCard } = await vi.importActual<{
      ProductCard: ComponentType<ProductCardTestProps>
    }>("../components/ProductCard/ProductCard.tsx")

    await act(async () => {
      root.render(
        <>
          <ProductCard
            href="/product/rich"
            title="Rich product"
            priceCurrent="$24.99"
          />
          <ProductCard
            href="/product/minimal"
            title="Minimal product"
            priceCurrent="$18.99"
            presentation="minimal"
          />
          <ProductCard
            href="/product/compact"
            title="Compact product"
            priceCurrent="$12.99"
            presentation="compact"
          />
        </>,
      )
    })

    const cards = container.querySelectorAll<HTMLElement>(
      '[data-slot="product-card"]',
    )
    expect(cards[0]?.dataset.presentation).toBe("rich")
    expect(
      cards[0]?.querySelector('[data-slot="product-card-summary"]'),
    ).toBeTruthy()
    expect(cards[1]?.dataset.presentation).toBe("minimal")
    expect(
      cards[1]?.querySelector('[data-slot="product-card-summary"]'),
    ).toBeNull()
    expect(
      cards[1]?.querySelector('[data-slot="product-card-price-badge"]')
        ?.textContent,
    ).toContain("$18.99")
    expect(
      cards[1]?.querySelector<HTMLAnchorElement>('a[href="/product/minimal"]')
        ?.textContent,
    ).toContain("Minimal product")
    expect(cards[2]?.dataset.presentation).toBe("compact")
    expect(
      cards[2]?.querySelector('[data-slot="product-card-summary"]'),
    ).toBeTruthy()
  })

  it("renders a non-verbal placeholder when the product image is missing", async () => {
    const { ProductCard } = await vi.importActual<{
      ProductCard: ComponentType<ProductCardTestProps>
    }>("../components/ProductCard/ProductCard.tsx")

    await act(async () => {
      root.render(
        <ProductCard href="/product/matcha" title="Uji Matcha Powder" priceCurrent="$24.99" />,
      )
    })

    const placeholder = container.querySelector('[data-slot="product-card-image-placeholder"]')

    expect(placeholder).toBeTruthy()
    expect(placeholder!.getAttribute("aria-hidden")).toBe("true")
    expect(
      placeholder!.querySelector('[data-slot="product-card-placeholder-pattern"]'),
    ).toBeTruthy()
    expect(placeholder!.querySelector('[data-slot="product-card-placeholder-pack"]')).toBeNull()
    expect(
      placeholder!
        .closest<HTMLElement>('[data-slot="product-card-image"]')
        ?.style.getPropertyValue("--aspect-ratio"),
    ).toBe("1")
  })

  it("only renders supported product-image badge types", async () => {
    const { ProductCard } = await vi.importActual<{
      ProductCard: ComponentType<ProductCardTestProps>
    }>("../components/ProductCard/ProductCard.tsx")

    await act(async () => {
      root.render(
        <ProductCard
          href="/product/matcha"
          title="Uji Matcha Powder"
          priceCurrent="$24.99"
          badges={[
            { label: "Best Sellers", type: "best-sellers" },
            { label: "Sale", type: "sale" },
            { label: "Choice", type: "choice" },
          ]}
        />,
      )
    })

    const badgeStack = container.querySelector('[data-slot="product-card-badges"]')
    expect(badgeStack?.textContent).toContain("Sale")
    expect(badgeStack?.textContent).toContain("Choice")
    expect(badgeStack?.textContent).not.toContain("Best Sellers")
    expect(badgeStack?.querySelectorAll('[data-slot="badge"]')).toHaveLength(2)
  })

  it("provides intrinsic image dimensions and explicit loading controls", async () => {
    const { ProductCard } = await vi.importActual<{
      ProductCard: ComponentType<ProductCardTestProps>
    }>("../components/ProductCard/ProductCard.tsx")

    await act(async () => {
      root.render(
        <ProductCard
          href="/product/matcha"
          image="/matcha.jpg"
          imageAlt="Uji matcha powder pouch"
          imageLoading="eager"
          imageFetchPriority="high"
          title="Uji Matcha Powder"
          priceCurrent="$24.99"
        />,
      )
    })

    const image = container.querySelector<HTMLImageElement>("img")
    expect(image?.alt).toBe("Uji matcha powder pouch")
    expect(image?.width).toBe(1)
    expect(image?.height).toBe(1)
    expect(image?.loading).toBe("eager")
    expect(image?.decoding).toBe("async")
    expect(image?.getAttribute("fetchpriority")).toBe("high")
  })

  it("renders structured responsive image sources with sorted unique candidates", async () => {
    const { ProductCard } = await vi.importActual<{
      ProductCard: ComponentType<ProductCardTestProps>
    }>("../components/ProductCard/ProductCard.tsx")

    await act(async () => {
      root.render(
        <ProductCard
          href="/product/matcha"
          image={{
            src: "/matcha-300.webp",
            width: 600,
            height: 600,
            candidates: [
              { src: "/matcha-600.webp", width: 600 },
              { src: "/matcha-300.webp", width: 300 },
              { src: "/matcha-300-duplicate.webp", width: 300 },
            ],
            sizes: "(min-width: 1024px) 20vw, 50vw",
          }}
          imageAlt="Uji matcha powder pouch"
          title="Uji Matcha Powder"
          priceCurrent="$24.99"
        />,
      )
    })

    const image = container.querySelector<HTMLImageElement>("img")
    expect(image?.getAttribute("src")).toBe("/matcha-300.webp")
    expect(image?.getAttribute("srcset")).toBe(
      "/matcha-300.webp 300w, /matcha-600.webp 600w",
    )
    expect(image?.getAttribute("sizes")).toBe(
      "(min-width: 1024px) 20vw, 50vw",
    )
    expect(image?.width).toBe(600)
    expect(image?.height).toBe(600)
    expect(image?.decoding).toBe("async")
  })

  it("exposes the dedicated add-to-cart child component", async () => {
    const { ProductCardAddButton } = await vi.importActual<{
      ProductCardAddButton: ComponentType<ProductCardAddButtonTestProps>
    }>("../components/ProductCard/ProductCardAddButton.tsx")
    const onClick = vi.fn()

    await act(async () => {
      root.render(<ProductCardAddButton onClick={onClick} />)
    })

    const addButton = container.querySelector<HTMLButtonElement>(
      'button[data-slot="product-card-add-button"]',
    )

    expect(addButton).toBeTruthy()
    expect(addButton!.type).toBe("button")
    expect(addButton!.getAttribute("aria-label")).toBe("Add to cart")
    expect(addButton!.querySelector('svg[aria-hidden="true"]')).toBeTruthy()

    await act(async () => addButton!.click())
    expect(onClick).toHaveBeenCalledOnce()
  })

  it("preserves the native disabled state on the add-to-cart child", async () => {
    const { ProductCardAddButton } = await vi.importActual<{
      ProductCardAddButton: ComponentType<ProductCardAddButtonTestProps>
    }>("../components/ProductCard/ProductCardAddButton.tsx")
    const onClick = vi.fn()

    await act(async () => {
      root.render(<ProductCardAddButton disabled onClick={onClick} />)
    })

    const addButton = container.querySelector<HTMLButtonElement>(
      'button[data-slot="product-card-add-button"]',
    )
    expect(addButton?.disabled).toBe(true)

    await act(async () => addButton!.click())
    expect(onClick).not.toHaveBeenCalled()
  })
})
