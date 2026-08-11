import type { CSSProperties, ReactNode } from "react"
import type { Meta, StoryObj } from "@storybook/react-vite"

import { Tabs, TabsContent, TabsList, TabsTrigger, type TabsVariant } from "./Tabs"

const meta = {
  title: "YAMI/Components/Navigation/Tabs",
  component: Tabs,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "YAMI Tabs from the YAMI UI UX Guidelines Figma Tabs node. Supports Primary Style A/B, Secondary, Tertiary, theme-independent inverse surfaces, skeleton lists, ARIA tab semantics, and keyboard navigation.",
      },
    },
  },
  argTypes: {
    orientation: {
      control: "select",
      options: ["horizontal", "vertical"],
    },
    activationMode: {
      control: "select",
      options: ["automatic", "manual"],
    },
  },
  args: {
    defaultValue: "tab-1",
    orientation: "horizontal",
    activationMode: "automatic",
  },
} satisfies Meta<typeof Tabs>

export default meta
type Story = StoryObj<typeof meta>

const items = [
  { value: "tab-1", label: "Tab 1" },
  { value: "tab-2", label: "Tab 2" },
  { value: "tab-3", label: "Tab 3" },
  { value: "tab-4", label: "Tab 4" },
  { value: "tab-5", label: "Tab 5" },
  { value: "tab-6", label: "Tab 6" },
  { value: "tab-7", label: "Tab 7" },
  { value: "tab-8", label: "Tab 8" },
  { value: "tab-9", label: "Tab 9" },
] as const

type TabItem = (typeof items)[number]

const primaryItems = items.slice(0, 7)
const segmentedItems = items.slice(0, 6)
const secondaryItems = items.slice(0, 7)
const tertiaryItems = items.slice(0, 7)
const scrollableItems = [
  { value: "cleanse", label: "Cleanse & Reset" },
  { value: "calm", label: "Calm & Prep" },
  { value: "brighten", label: "Brighten & Correct" },
  { value: "hydrate", label: "Hydrate & Repair" },
  { value: "protect", label: "Protect & Finish" },
] as const

const storyStackStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "var(--space-600)",
  width: "100%",
  maxWidth: 760,
  fontFamily: "var(--font-family-ios)",
}

const rowStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "var(--space-200)",
  minWidth: 0,
}

const labelStyle: CSSProperties = {
  margin: 0,
  color: "var(--text-secondary)",
  fontSize: "var(--font-size-caption-md)",
  lineHeight: "var(--line-height-caption-md)",
}

const inverseSectionStyle: CSSProperties = {
  display: "inline-flex",
  flexDirection: "column",
  alignItems: "stretch",
  gap: "var(--space-500)",
  width: "fit-content",
  maxWidth: "100%",
  boxSizing: "border-box",
  background: "var(--surface-inverse)",
  padding: "var(--space-300)",
  borderRadius: "var(--radius-surface-default)",
}

const hiddenPanelStyle: CSSProperties = {
  position: "absolute",
  width: 1,
  height: 1,
  margin: -1,
  padding: 0,
  border: 0,
  overflow: "hidden",
  clipPath: "inset(50%)",
  whiteSpace: "nowrap",
}

function Section({
  title,
  inverse = false,
  children,
}: {
  title: string
  inverse?: boolean
  children: ReactNode
}) {
  return (
    <section style={rowStyle}>
      <p style={{ ...labelStyle, color: inverse ? "var(--text-secondary-inverse)" : "var(--text-secondary)" }}>
        {title}
      </p>
      {children}
    </section>
  )
}

function SampleTabs({
  variant,
  styleVariant = "a",
  inverse = false,
  fullWidth = false,
  sampleItems = items,
  compactPanel = false,
}: {
  variant: TabsVariant
  styleVariant?: "a" | "b"
  inverse?: boolean
  fullWidth?: boolean
  sampleItems?: ReadonlyArray<TabItem>
  compactPanel?: boolean
}) {
  const defaultValue = sampleItems[0]?.value ?? "tab-1"

  return (
    <Tabs defaultValue={defaultValue}>
      <TabsList
        variant={variant}
        styleVariant={styleVariant}
        inverse={inverse}
        fullWidth={fullWidth}
      >
        {sampleItems.map((item) => (
          <TabsTrigger key={item.value} value={item.value}>
            {item.label}
          </TabsTrigger>
        ))}
      </TabsList>
      {sampleItems.map((item) => (
        <TabsContent key={item.value} value={item.value} style={compactPanel ? hiddenPanelStyle : undefined}>
          {item.label} tab content
        </TabsContent>
      ))}
    </Tabs>
  )
}

function parseComputedColor(rgb: string) {
  const channels = rgb.match(/[\d.]+/g)?.map(Number)
  if (!channels || channels.length < 3) throw new Error(`Unable to parse computed color: ${rgb}`)
  return { red: channels[0]!, green: channels[1]!, blue: channels[2]!, alpha: channels[3] ?? 1 }
}

function relativeLuminance({ red, green, blue }: ReturnType<typeof parseComputedColor>) {
  const [linearRed, linearGreen, linearBlue] = [red, green, blue].map((value) => {
    const normalized = value / 255
    return normalized <= 0.04045 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * linearRed + 0.7152 * linearGreen + 0.0722 * linearBlue
}

function contrastRatio(foreground: string, background: string) {
  const foregroundColor = parseComputedColor(foreground)
  const backgroundColor = parseComputedColor(background)
  const compositeForeground = {
    red: foregroundColor.red * foregroundColor.alpha + backgroundColor.red * (1 - foregroundColor.alpha),
    green: foregroundColor.green * foregroundColor.alpha + backgroundColor.green * (1 - foregroundColor.alpha),
    blue: foregroundColor.blue * foregroundColor.alpha + backgroundColor.blue * (1 - foregroundColor.alpha),
    alpha: 1,
  }
  const foregroundLuminance = relativeLuminance(compositeForeground)
  const backgroundLuminance = relativeLuminance(backgroundColor)
  return (Math.max(foregroundLuminance, backgroundLuminance) + 0.05) /
    (Math.min(foregroundLuminance, backgroundLuminance) + 0.05)
}

export const Showcase: Story = {
  render: () => (
    <div data-tabs-showcase-stack style={storyStackStyle}>
      <Section title="Primary - Style A">
        <SampleTabs variant="primary" styleVariant="a" sampleItems={primaryItems} compactPanel />
      </Section>

      <Section title="Primary - Style B">
        <SampleTabs variant="primary" styleVariant="b" sampleItems={segmentedItems} compactPanel />
      </Section>

      <Section title="Secondary">
        <SampleTabs variant="secondary" sampleItems={secondaryItems} compactPanel />
      </Section>

      <Section title="Tertiary">
        <SampleTabs variant="tertiary" sampleItems={tertiaryItems} compactPanel />
      </Section>

      <div data-tabs-inverse-showcase style={inverseSectionStyle}>
        <Section title="Inverse" inverse>
          <SampleTabs variant="primary" styleVariant="a" inverse sampleItems={primaryItems} compactPanel />
          <SampleTabs variant="primary" styleVariant="b" inverse sampleItems={segmentedItems} compactPanel />
          <SampleTabs variant="secondary" inverse sampleItems={secondaryItems} compactPanel />
          <SampleTabs variant="tertiary" inverse sampleItems={tertiaryItems} compactPanel />
        </Section>
      </div>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const primaryStyleALists = canvasElement.querySelectorAll<HTMLElement>(
      '[role="tablist"][data-variant="primary"][data-style="a"]',
    )
    if (primaryStyleALists.length !== 2) {
      throw new Error("Primary Style A must render on default and inverse surfaces")
    }
    for (const list of primaryStyleALists) {
      const tabsRoot = list.closest<HTMLElement>('[data-slot="tabs"]')
      const tabsRootStyle = tabsRoot ? getComputedStyle(tabsRoot) : null
      const listStyle = getComputedStyle(list)
      const activeTrigger = list.querySelector<HTMLElement>(
        '[role="tab"][data-state="active"]',
      )
      const inactiveTrigger = list.querySelector<HTMLElement>(
        '[role="tab"][data-state="inactive"]',
      )
      if (!activeTrigger || !inactiveTrigger) {
        throw new Error("Primary Style A tab states did not render")
      }
      const activeUnderline = getComputedStyle(activeTrigger, "::after")
      const inactiveUnderline = getComputedStyle(inactiveTrigger, "::after")
      const activeLabel = activeTrigger.querySelector<HTMLElement>("span")
      const underlineTop =
        activeTrigger.getBoundingClientRect().bottom -
        Number.parseFloat(activeUnderline.bottom) -
        Number.parseFloat(activeUnderline.height)
      const labelToUnderlineGap = activeLabel
        ? underlineTop - activeLabel.getBoundingClientRect().bottom
        : Number.NaN
      if (
        !tabsRootStyle ||
        tabsRootStyle.paddingLeft !== "0px" ||
        tabsRootStyle.paddingRight !== "0px" ||
        listStyle.paddingLeft !== "0px" ||
        listStyle.paddingRight !== "0px" ||
        listStyle.columnGap !== "24px" ||
        getComputedStyle(activeTrigger).fontSize !== "16px" ||
        activeUnderline.opacity !== "1" ||
        activeUnderline.height !== "2px" ||
        Math.abs(labelToUnderlineGap - 4) > 0.5 ||
        inactiveUnderline.opacity !== "0"
      ) {
        throw new Error(
          "Primary Style A must use 16px text and 24px gaps without inline padding, with a 2px underline 4px below the active label only",
        )
      }
    }

    const activeTab = canvasElement.querySelector<HTMLElement>(
      '[role="tablist"][data-inverse="true"][data-variant="primary"][data-style="b"] [role="tab"][data-state="active"]',
    )
    if (!activeTab) throw new Error("Inverse Primary Style B active tab did not render")

    const root = document.documentElement
    const initialDark = root.classList.contains("dark")
    try {
      for (const dark of [false, true]) {
        root.classList.toggle("dark", dark)
        await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
        const foreground = getComputedStyle(activeTab).color
        const background = getComputedStyle(activeTab, "::before").backgroundColor
        const ratio = contrastRatio(foreground, background)
        if (ratio < 4.5) {
          throw new Error(
            `${dark ? "Dark" : "Light"} inverse Primary Style B contrast ${ratio.toFixed(2)} is below WCAG AA`,
          )
        }
      }
    } finally {
      root.classList.toggle("dark", initialDark)
    }

    const showcaseStack = canvasElement.querySelector<HTMLElement>("[data-tabs-showcase-stack]")
    const inverseShowcase = canvasElement.querySelector<HTMLElement>("[data-tabs-inverse-showcase]")
    if (!showcaseStack || !inverseShowcase) throw new Error("Tabs responsive showcase did not render")

    if (window.innerWidth >= 768) {
      const filledLists = canvasElement.querySelectorAll<HTMLElement>(
        '[role="tablist"][data-variant="primary"][data-style="b"], [role="tablist"][data-variant="tertiary"]',
      )
      for (const list of filledLists) {
        const activeTrigger = list.querySelector<HTMLElement>(
          '[role="tab"][data-state="active"]',
        )
        if (!activeTrigger) throw new Error("Filled desktop Tab did not render")
        const backgroundStyle = getComputedStyle(activeTrigger, "::before")
        const backgroundHeight =
          activeTrigger.getBoundingClientRect().height -
          Number.parseFloat(backgroundStyle.top) -
          Number.parseFloat(backgroundStyle.bottom)
        if (backgroundHeight !== 36) {
          throw new Error("Filled desktop Tab backgrounds must use a 36px height")
        }
        if (
          list.dataset.variant === "tertiary" &&
          activeTrigger.getBoundingClientRect().width < 48
        ) {
          throw new Error("Desktop Tertiary Tabs must use a 48px minimum width")
        }
      }
    }

    const initialWidth = showcaseStack.style.width
    const initialMaxWidth = showcaseStack.style.maxWidth
    try {
      showcaseStack.style.width = "370px"
      showcaseStack.style.maxWidth = "370px"
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
      if (
        inverseShowcase.getBoundingClientRect().right > showcaseStack.getBoundingClientRect().right + 0.5 ||
        inverseShowcase.scrollWidth > inverseShowcase.clientWidth
      ) {
        throw new Error(`Tabs inverse showcase overflows a 370px mobile content width: outer ${showcaseStack.getBoundingClientRect().width}px, inverse ${inverseShowcase.getBoundingClientRect().width}px, scroll ${inverseShowcase.scrollWidth}/${inverseShowcase.clientWidth}`)
      }
    } finally {
      showcaseStack.style.width = initialWidth
      showcaseStack.style.maxWidth = initialMaxWidth
    }

    const inactiveTertiary = canvasElement.querySelector<HTMLElement>(
      '[role="tablist"][data-variant="tertiary"]:not([data-inverse="true"]) [role="tab"][data-state="inactive"]',
    )
    if (!inactiveTertiary) throw new Error("Inactive Tertiary tab did not render")
    const tertiaryList = inactiveTertiary.closest<HTMLElement>('[role="tablist"]')
    if (!tertiaryList || getComputedStyle(tertiaryList).columnGap !== "4px") {
      throw new Error("Tertiary Tabs must use the shared 4px item gap")
    }
    const hoverProbe = document.createElement("span")
    hoverProbe.style.background = "var(--button-secondary)"
    inactiveTertiary.append(hoverProbe)
    const hoverBackgroundColor = getComputedStyle(hoverProbe).backgroundColor
    const hoverBackground = parseComputedColor(hoverBackgroundColor)
    hoverProbe.remove()
    if (hoverBackground.alpha <= 0 || hoverBackground.alpha >= 1) {
      throw new Error(
        `Inactive Tertiary tab hover must render a translucent gray surface; received ${hoverBackgroundColor}`,
      )
    }

    canvasElement.dataset.tabsContrastContract = "passed"
    canvasElement.dataset.tabsResponsiveContract = "passed"
    canvasElement.dataset.tabsHoverContract = "passed"
  },
}

export const Playground: Story = {
  render: (args) => (
    <Tabs {...args}>
      <TabsList variant="primary">
        {items.map((item) => (
          <TabsTrigger key={item.value} value={item.value}>
            {item.label}
          </TabsTrigger>
        ))}
      </TabsList>
      {items.map((item) => (
        <TabsContent key={item.value} value={item.value}>
          {item.label} content
        </TabsContent>
      ))}
    </Tabs>
  ),
}

export const ScrollableSelection: Story = {
  render: () => (
    <div style={{ width: 240 }}>
      <Tabs defaultValue="cleanse">
        <TabsList variant="tertiary" aria-label="Skincare routine">
          {scrollableItems.map((item) => (
            <TabsTrigger key={item.value} value={item.value}>
              {item.label}
            </TabsTrigger>
          ))}
        </TabsList>
        {scrollableItems.map((item) => (
          <TabsContent key={item.value} value={item.value}>
            {item.label} content
          </TabsContent>
        ))}
      </Tabs>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const list = canvasElement.querySelector<HTMLElement>('[role="tablist"]')
    const middleTab = canvasElement.querySelector<HTMLButtonElement>(
      '[role="tab"][aria-controls$="-panel-brighten"]',
    )
    const lastTab = canvasElement.querySelector<HTMLButtonElement>(
      '[role="tab"][data-state="inactive"]:last-of-type',
    )
    if (!list || !middleTab || !lastTab) {
      throw new Error("Scrollable Tabs test fixture did not render")
    }

    const initialListRect = list.getBoundingClientRect()
    if (lastTab.getBoundingClientRect().right <= initialListRect.right) {
      throw new Error("Scrollable Tabs test fixture must begin clipped")
    }

    const initialPageScrollY = window.scrollY
    const initialScrollLeft = list.scrollLeft
    middleTab.click()
    let movingProgressively = false
    let remainingDistance = Number.POSITIVE_INFINITY
    for (let frame = 0; frame < 10; frame += 1) {
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
      const movingRect = middleTab.getBoundingClientRect()
      const movingListRect = list.getBoundingClientRect()
      remainingDistance = Math.abs(
        movingRect.left + movingRect.width / 2 -
          (movingListRect.left + movingListRect.width / 2),
      )
      if (list.scrollLeft > initialScrollLeft && remainingDistance > 0.5) {
        movingProgressively = true
        break
      }
      if (remainingDistance <= 0.5) break
    }
    if (
      !window.matchMedia("(prefers-reduced-motion: reduce)").matches &&
      !movingProgressively
    ) {
      throw new Error(
        `Selecting a middle Tab must move progressively: scrollLeft=${initialScrollLeft}->${list.scrollLeft}, remainingDistance=${remainingDistance.toFixed(1)}`,
      )
    }

    for (let frame = 0; frame < 60; frame += 1) {
      const tabRect = middleTab.getBoundingClientRect()
      const listRect = list.getBoundingClientRect()
      const tabCenter = tabRect.left + tabRect.width / 2
      const listCenter = listRect.left + listRect.width / 2
      if (Math.abs(tabCenter - listCenter) <= 0.5) break
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
    }

    const middleRect = middleTab.getBoundingClientRect()
    const centeredListRect = list.getBoundingClientRect()
    const middleCenter = middleRect.left + middleRect.width / 2
    const listCenter = centeredListRect.left + centeredListRect.width / 2
    if (
      middleTab.getAttribute("aria-selected") !== "true" ||
      Math.abs(middleCenter - listCenter) > 0.5 ||
      window.scrollY !== initialPageScrollY
    ) {
      throw new Error(
        `Selecting a middle Tab must center it without moving the page: selected=${middleTab.getAttribute("aria-selected")}, tabCenter=${middleCenter.toFixed(1)}, listCenter=${listCenter.toFixed(1)}, scrollLeft=${list.scrollLeft}, pageY=${initialPageScrollY}->${window.scrollY}`,
      )
    }

    lastTab.click()
    for (let frame = 0; frame < 60; frame += 1) {
      const maxScrollLeft = list.scrollWidth - list.clientWidth
      if (Math.abs(list.scrollLeft - maxScrollLeft) <= 0.5) break
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
    }

    const selectedRect = lastTab.getBoundingClientRect()
    const listRect = list.getBoundingClientRect()
    const maxScrollLeft = list.scrollWidth - list.clientWidth
    if (
      lastTab.getAttribute("aria-selected") !== "true" ||
      selectedRect.left < listRect.left - 0.5 ||
      selectedRect.right > listRect.right + 0.5 ||
      Math.abs(list.scrollLeft - maxScrollLeft) > 0.5 ||
      window.scrollY !== initialPageScrollY
    ) {
      throw new Error(
        `Selecting the last Tab must clamp it to the end without moving the page: selected=${lastTab.getAttribute("aria-selected")}, tab=${selectedRect.left.toFixed(1)}..${selectedRect.right.toFixed(1)}, list=${listRect.left.toFixed(1)}..${listRect.right.toFixed(1)}, scrollLeft=${list.scrollLeft}/${maxScrollLeft}, pageY=${initialPageScrollY}->${window.scrollY}`,
      )
    }
  },
}

export const PrimaryStyleA: Story = {
  render: () => <SampleTabs variant="primary" styleVariant="a" fullWidth />,
}

export const PrimaryStyleB: Story = {
  render: () => <SampleTabs variant="primary" styleVariant="b" />,
}

export const Secondary: Story = {
  render: () => <SampleTabs variant="secondary" />,
}

export const Tertiary: Story = {
  render: () => <SampleTabs variant="tertiary" />,
}

export const States: Story = {
  render: () => (
    <Tabs defaultValue="active">
      <TabsList variant="primary" styleVariant="b">
        <TabsTrigger value="active">Active</TabsTrigger>
        <TabsTrigger value="default">Default</TabsTrigger>
        <TabsTrigger value="disabled" disabled>
          Disabled
        </TabsTrigger>
      </TabsList>
      <TabsContent value="active">Active tab content</TabsContent>
      <TabsContent value="default">Default tab content</TabsContent>
      <TabsContent value="disabled">Disabled tab content</TabsContent>
    </Tabs>
  ),
}

export const Skeleton: Story = {
  render: () => (
    <div style={storyStackStyle}>
      <Tabs defaultValue="loading">
        <TabsList variant="primary" styleVariant="a" skeleton aria-label="Loading primary tabs" />
      </Tabs>
      <Tabs defaultValue="loading">
        <TabsList variant="primary" styleVariant="b" skeleton aria-label="Loading segmented tabs" />
      </Tabs>
      <div style={inverseSectionStyle}>
        <Tabs defaultValue="loading">
          <TabsList variant="tertiary" inverse skeleton aria-label="Loading tertiary tabs" />
        </Tabs>
      </div>
    </div>
  ),
}

export const WithIcons: Story = {
  render: () => (
    <Tabs defaultValue="search">
      <TabsList variant="secondary">
        <TabsTrigger value="search" leftIcon={<SearchIcon />}>
          Search
        </TabsTrigger>
        <TabsTrigger value="next" rightIcon={<ArrowRightIcon />}>
          Next
        </TabsTrigger>
      </TabsList>
      <TabsContent value="search">Search tab content</TabsContent>
      <TabsContent value="next">Next tab content</TabsContent>
    </Tabs>
  ),
}

export const Vertical: Story = {
  render: () => (
    <Tabs defaultValue="snacks" orientation="vertical" style={{ minHeight: 160 }}>
      <TabsList variant="primary" styleVariant="a">
        {items.map((item) => (
          <TabsTrigger key={item.value} value={item.value}>
            {item.label}
          </TabsTrigger>
        ))}
      </TabsList>
      {items.map((item) => (
        <TabsContent key={item.value} value={item.value}>
          {item.label} content
        </TabsContent>
      ))}
    </Tabs>
  ),
}

function SearchIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path
        d="M10.5001 3C14.6422 3 18.0001 6.35786 18.0001 10.5C18.0001 12.3009 17.3637 13.9522 16.3058 15.2451L21.088 20.0273L20.0274 21.0879L15.2452 16.3057C13.9523 17.3636 12.301 18 10.5001 18C6.35796 18 3.0001 14.6421 3.0001 10.5C3.0001 6.35786 6.35796 3 10.5001 3ZM10.5001 4.60742C7.24556 4.60742 4.60752 7.24546 4.60752 10.5C4.60752 13.7545 7.24556 16.3926 10.5001 16.3926C13.7546 16.3926 16.3927 13.7545 16.3927 10.5C16.3927 7.24546 13.7546 4.60742 10.5001 4.60742Z"
        fill="currentColor"
      />
    </svg>
  )
}

function ArrowRightIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path
        d="M20.46 11.3994C20.7915 11.7313 20.7918 12.2697 20.46 12.6015L13.5303 19.5302L12.4697 18.4697L18.1895 12.7499H3V11.2499H18.1895L12.4697 5.53021L13.5303 4.46967L20.46 11.3994Z"
        fill="currentColor"
      />
    </svg>
  )
}
