/* @vitest-environment happy-dom */

import { act } from "react"
import { createRoot, type Root } from "react-dom/client"
import { afterEach, beforeEach, describe, expect, it } from "vitest"

import { BrandProductRail } from "../components/BrandProductRail/BrandProductRail"
import { createBrandProductRailProps } from "../components/BrandProductRail/fixtures"

;(
  globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }
).IS_REACT_ACT_ENVIRONMENT = true

describe("YAMI BrandProductRail contracts", () => {
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

  it("uses the campaign heading as brand context without repeating product brands", async () => {
    const props = createBrandProductRailProps("en", "/brands")
    const [firstCampaign, ...remainingCampaigns] = props.campaigns
    const [firstProduct, ...remainingProducts] = firstCampaign!.products
    const campaigns = [{
      ...firstCampaign!,
      products: [{
        ...firstProduct!,
        brand: firstCampaign!.title,
        brandHref: firstCampaign!.href ?? "/brands",
      }, ...remainingProducts],
    }, ...remainingCampaigns]

    await act(async () => {
      root.render(<BrandProductRail {...props} campaigns={campaigns} />)
    })

    expect(container.textContent).toContain(props.campaigns[0]!.title)
    expect(container.querySelectorAll('[data-slot="product-card"]')).not.toHaveLength(0)
    expect(container.querySelectorAll('[data-slot="product-card-brand"]')).toHaveLength(0)
    expect(container.querySelectorAll('[data-slot="product-card-add-button"]')).not.toHaveLength(0)
  })
})
