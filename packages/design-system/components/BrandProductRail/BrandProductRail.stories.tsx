import type { Meta, StoryObj } from "@storybook/react-vite";

import { BrandProductRail } from "./BrandProductRail";
import storyStyles from "./BrandProductRail.stories.module.css";
import type { BrandProductRailProps } from "./BrandProductRail.types";
import {
  createBrandProductRailProps,
  type BrandProductRailLocale,
} from "./fixtures";

function globalFromStorybookManager(name: string): string | undefined {
  if (typeof window === "undefined") return undefined;

  try {
    const managerUrl = window.top?.location.href;
    if (!managerUrl) return undefined;

    const globals = new URL(managerUrl).searchParams.get("globals");
    const prefix = `${name}:`;
    return globals
      ?.split(";")
      .find((entry) => entry.startsWith(prefix))
      ?.slice(prefix.length);
  } catch {
    return undefined;
  }
}

function localeFromGlobals(value: unknown): BrandProductRailLocale {
  const managerLocale = globalFromStorybookManager("locale");
  if (managerLocale === "en" || managerLocale === "zh") {
    return managerLocale;
  }
  return value === "en" ? "en" : "zh";
}

function themeFromGlobals(value: unknown): "light" | "dark" {
  const managerTheme = globalFromStorybookManager("theme");
  if (managerTheme === "light" || managerTheme === "dark") {
    return managerTheme;
  }
  return value === "dark" ? "dark" : "light";
}

function getProps(locale: BrandProductRailLocale): BrandProductRailProps {
  return createBrandProductRailProps(locale, "#all-beauty-trends");
}

const meta = {
  title: "YAMI/Components/Commerce/Brand Product Rail",
  component: BrandProductRail,
  decorators: [
    (Story, context) => {
      if (typeof document !== "undefined") {
        document.documentElement.classList.toggle(
          "dark",
          themeFromGlobals(context.globals.theme) === "dark",
        );
      }

      return (
        <div
          className={storyStyles.pageCanvas}
          data-slot="brand-product-rail-story-canvas"
        >
          <Story />
        </div>
      );
    },
  ],
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Brand-led commerce rail modeled on the YAMI homepage. It composes ProductList, compact ProductCard, and shared rail navigation controls.",
      },
      story: {
        inline: false,
        height: "640px",
      },
    },
  },
  argTypes: {
    mobileSurface: {
      options: ["card", "plain"],
      control: { type: "radio" },
      description:
        "Mobile section surface. Plain is square, full-bleed, and uses 16px content padding.",
    },
    dividerPosition: {
      options: ["top", "bottom", "none"],
      control: { type: "radio" },
      description:
        "Section divider edge. Card mobile ignores it; plain mobile preserves it.",
    },
    dividerVariant: {
      options: ["gray", "black"],
      control: { type: "radio" },
      description: "Gray renders at 1px; black emphasis renders at 2px.",
    },
  },
  args: {
    ...getProps("zh"),
    mobileSurface: "card",
    dividerPosition: "top",
    dividerVariant: "gray",
  },
} satisfies Meta<typeof BrandProductRail>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Showcase: Story = {
  render: (args, { globals }) => {
    const locale = localeFromGlobals(globals.locale);
    return (
      <BrandProductRail
        {...getProps(locale)}
        mobileSurface={args.mobileSurface}
        dividerPosition={args.dividerPosition}
        dividerVariant={args.dividerVariant}
      />
    );
  },
  play: async ({ canvasElement }) => {
    const rail = canvasElement.querySelector<HTMLElement>(
      '[data-slot="brand-product-rail-list"]',
    );
    if (!rail) throw new Error("Brand product rail did not render");

    const campaigns = canvasElement.querySelectorAll(
      '[data-slot="brand-product-rail-campaign"]',
    );
    if (campaigns.length !== 6) {
      throw new Error(`Expected 6 brand campaigns, got ${campaigns.length}`);
    }

    const lists = canvasElement.querySelectorAll(
      '[data-slot="brand-product-rail-campaign"] [data-slot="product-list"]',
    );
    const cards = canvasElement.querySelectorAll(
      '[data-slot="brand-product-rail-campaign"] [data-slot="product-card"]',
    );
    if (lists.length !== 6 || cards.length !== 18) {
      throw new Error(
        `Expected 6 ProductLists and 18 ProductCards, got ${lists.length} and ${cards.length}`,
      );
    }

    if (
      Array.from(cards).some(
        (card) => card.getAttribute("data-presentation") !== "compact",
      )
    ) {
      throw new Error("Brand product rail must use compact ProductCards");
    }
    if (
      Array.from(cards).some((card) =>
        card.querySelector('[data-slot="product-card-brand"]'),
      )
    ) {
      throw new Error(
        "Brand product rail ProductCards must not repeat the campaign brand name",
      );
    }

    const firstBanner = canvasElement.querySelector<HTMLElement>(
      '[data-slot="product-list-banner"]',
    );
    const firstMedia = canvasElement.querySelector<HTMLElement>(
      '[data-slot="product-card-media"]',
    );
    if (!firstBanner || !firstMedia) {
      throw new Error("Brand campaign banner or ProductCard media missing");
    }

    if (getComputedStyle(firstBanner).height !== "160px") {
      throw new Error(
        `Brand banner must be 160px, got ${getComputedStyle(firstBanner).height}`,
      );
    }
    if (getComputedStyle(firstMedia).width !== "108px") {
      throw new Error(
        `Compact ProductCard media must be 108px, got ${getComputedStyle(firstMedia).width}`,
      );
    }

    const firstCard = cards.item(0);
    const mediaQuickAdd = firstCard.querySelector(
      '[data-slot="product-card-media"] [data-slot="product-card-quick-add"]',
    );
    const offerQuickAdd = firstCard.querySelector(
      '[data-slot="product-card-offer"] [data-slot="product-card-quick-add"]',
    );
    if (mediaQuickAdd || !offerQuickAdd) {
      throw new Error(
        "Compact ProductCard quick add must render beside the price",
      );
    }
    const firstPriceActionRow = offerQuickAdd.parentElement;
    const firstPriceActionStyle = firstPriceActionRow
      ? getComputedStyle(firstPriceActionRow)
      : null;
    if (
      !firstPriceActionStyle ||
      firstPriceActionStyle.paddingTop !== "0px" ||
      firstPriceActionStyle.paddingRight !== "4px"
    ) {
      throw new Error(
        "Desktop compact ProductCard price rows require 0px top and 4px right padding",
      );
    }

    // One flat scrim over the whole banner, identical on PC and mobile. It was
    // a bottom-half gradient on PC only, which left the top-right badge with no
    // ground on pale brand artwork.
    const bannerOverlay = getComputedStyle(firstBanner, "::after");
    if (
      bannerOverlay.display === "none" ||
      bannerOverlay.height !== getComputedStyle(firstBanner).height ||
      bannerOverlay.backgroundColor === "rgba(0, 0, 0, 0)"
    ) {
      throw new Error(
        "Brand banner must render a token-backed scrim across its full height",
      );
    }

    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    const nextButton = canvasElement.querySelector<HTMLButtonElement>(
      '[data-slot="rail-navigation"] button:last-child',
    );
    if (!nextButton || nextButton.disabled) {
      throw new Error("Overflowing brand rail requires an enabled next button");
    }
  },
};

/* Divider position and variant are Controls on every story, so these two exist
 * only to assert the computed borders. `!dev` keeps them out of the sidebar and
 * the docs page — a config flag does not deserve a component-level entry — while
 * `test` keeps them in the index for a runner. */
export const BlackBottomDivider: Story = {
  tags: ["!dev", "!autodocs"],
  args: {
    dividerPosition: "bottom",
    dividerVariant: "black",
  },
  render: (args, { globals }) => {
    const locale = localeFromGlobals(globals.locale);
    return (
      <BrandProductRail
        {...getProps(locale)}
        mobileSurface={args.mobileSurface}
        dividerPosition={args.dividerPosition}
        dividerVariant={args.dividerVariant}
      />
    );
  },
  play: async ({ canvasElement }) => {
    const root = canvasElement.querySelector<HTMLElement>(
      '[data-slot="brand-product-rail"]',
    );
    if (!root) throw new Error("Brand Product Rail did not render");
    const style = getComputedStyle(root);
    if (style.borderBottomWidth !== "2px" || style.borderTopWidth !== "0px") {
      throw new Error("Brand Product Rail black divider must render 2px on the bottom only");
    }
  },
};

export const MobileDividerDisabled: Story = {
  tags: ["!dev", "!autodocs"],
  globals: {
    viewport: { value: "yamiMobile", isRotated: false },
  },
  args: {
    dividerPosition: "bottom",
    dividerVariant: "black",
  },
  render: BlackBottomDivider.render,
  play: async ({ canvasElement }) => {
    const root = canvasElement.querySelector<HTMLElement>(
      '[data-slot="brand-product-rail"]',
    );
    if (!root) throw new Error("Brand Product Rail did not render");
    const style = getComputedStyle(root);
    if (style.borderBottomWidth !== "0px" || style.borderTopWidth !== "0px") {
      throw new Error("Brand Product Rail must not render dividers below 1024px");
    }
  },
};

async function verifyMobileLayout({
  canvasElement,
}: {
  canvasElement: HTMLElement;
}) {
  const pageCanvas = canvasElement.querySelector<HTMLElement>(
    '[data-slot="brand-product-rail-story-canvas"]',
  );
  const tabs = canvasElement.querySelectorAll(
    '[data-slot="brand-product-rail"] [role="tab"]',
  );
  const panel = canvasElement.querySelector<HTMLElement>(
    '[data-slot="brand-product-rail-campaign"]',
  );
  const banner = canvasElement.querySelector<HTMLElement>(
    '[data-slot="product-list-banner"]',
  );
  const media = canvasElement.querySelector<HTMLElement>(
    '[data-slot="product-card-media"]',
  );
  const image = canvasElement.querySelector<HTMLElement>(
    '[data-slot="product-card-image"]',
  );
  const addButton = canvasElement.querySelector<HTMLElement>(
    '[data-slot="product-card-add-button"]',
  );
  const card = canvasElement.querySelector<HTMLElement>(
    '[data-slot="product-card"]',
  );
  const content = card?.querySelector<HTMLElement>(
    '[data-slot="product-card-content"]',
  );

  if (
    !pageCanvas ||
    !panel ||
    !banner ||
    !media ||
    !image ||
    !addButton ||
    !card ||
    !content
  ) {
    throw new Error("Mobile brand campaign anatomy did not render");
  }
  if (getComputedStyle(pageCanvas).backgroundColor === "rgba(0, 0, 0, 0)") {
    throw new Error(
      "Mobile brand campaign page must use the gray page background",
    );
  }
  if (pageCanvas.scrollWidth > pageCanvas.clientWidth + 1) {
    throw new Error(
      `Mobile page must not overflow horizontally: ${pageCanvas.scrollWidth}px > ${pageCanvas.clientWidth}px`,
    );
  }
  if (tabs.length !== 9) {
    throw new Error(`Expected 9 mobile category tabs, got ${tabs.length}`);
  }
  if (getComputedStyle(panel).width !== "312px") {
    throw new Error(
      `Mobile brand campaign must be 312px, got ${getComputedStyle(panel).width}`,
    );
  }
  if (getComputedStyle(banner).height !== "160px") {
    throw new Error(
      `Mobile brand banner must be 160px, got ${getComputedStyle(banner).height}`,
    );
  }
  if (getComputedStyle(media).width !== "96px") {
    throw new Error(
      `Mobile compact ProductCard media must be 96px, got ${getComputedStyle(media).width}`,
    );
  }
  if (
    Math.abs(
      content.getBoundingClientRect().height - card.getBoundingClientRect().height,
    ) > 1
  ) {
    throw new Error(
      "Mobile compact ProductCard content must stretch to the full card height",
    );
  }
  const tokenProbe = document.createElement("span");
  tokenProbe.style.backgroundColor = "var(--fill-tertiary)";
  document.body.append(tokenProbe);
  const mobileImageSurface = getComputedStyle(tokenProbe).backgroundColor;
  tokenProbe.remove();
  if (getComputedStyle(image).backgroundColor !== mobileImageSurface) {
    throw new Error("Mobile compact ProductCard images require the gray fill");
  }
  if (
    getComputedStyle(addButton).width !== "40px" ||
    getComputedStyle(addButton).height !== "40px"
  ) {
    throw new Error("Mobile quick add must remain 40px square");
  }
}

function renderResponsiveStory(
  args: BrandProductRailProps,
  { globals }: { globals: Record<string, unknown> },
) {
  const locale = localeFromGlobals(globals.locale);
  return (
    <BrandProductRail
      {...getProps(locale)}
      mobileSurface={args.mobileSurface}
      dividerPosition={args.dividerPosition}
      dividerVariant={args.dividerVariant}
    />
  );
}

async function verifyDesktopLayout({
  canvasElement,
}: {
  canvasElement: HTMLElement;
}) {
  const railContainer = canvasElement.querySelector<HTMLElement>(
    '[data-slot="brand-product-rail-container"]',
  );
  const list = canvasElement.querySelector<HTMLElement>(
    '[data-slot="brand-product-rail-list"]',
  );
  const panel = canvasElement.querySelector<HTMLElement>(
    '[data-slot="brand-product-rail-campaign"]',
  );
  const productList = panel?.querySelector<HTMLElement>(
    '[data-slot="product-list"]',
  );
  const productListContainer = panel?.querySelector<HTMLElement>(
    '[data-slot="product-list-container"]',
  );
  const firstItem = panel?.querySelector<HTMLElement>(
    '[data-slot="product-list-item"]:first-child',
  );
  const secondItem = panel?.querySelector<HTMLElement>(
    '[data-slot="product-list-item"]:nth-child(2)',
  );
  const firstCard = firstItem?.querySelector<HTMLElement>(
    '[data-slot="product-card"]',
  );
  const firstPriceActionRow = firstCard?.querySelector<HTMLElement>(
    '[data-slot="product-card-price-action-row"]',
  );
  const imageSurfaces = panel?.querySelectorAll<HTMLElement>(
    '[data-slot="product-card-image"]',
  );
  const brandTitle = panel?.querySelector<HTMLElement>(
    '[data-slot="product-list-title"]',
  );
  if (
    !railContainer ||
    !list ||
    !panel ||
    !productList ||
    !productListContainer ||
    !firstItem ||
    !secondItem ||
    !firstCard ||
    !firstPriceActionRow ||
    !brandTitle ||
    !imageSurfaces?.length
  ) {
    throw new Error("Desktop brand rail anatomy did not render");
  }

  const gap = Number.parseFloat(getComputedStyle(list).columnGap);
  const panelWidth = panel.getBoundingClientRect().width;
  const visibleColumns = Math.round(
    (list.clientWidth + gap) / (panelWidth + gap),
  );
  const railContainerStyle = getComputedStyle(railContainer);
  const contentWidth =
    railContainer.clientWidth -
    Number.parseFloat(railContainerStyle.paddingLeft) -
    Number.parseFloat(railContainerStyle.paddingRight);
  const expectedColumns =
    contentWidth <= 1280 ? 2 : contentWidth <= 1440 ? 3 : 4;
  if (visibleColumns !== expectedColumns) {
    throw new Error(
      `Expected ${expectedColumns} desktop columns at ${contentWidth}px content width, got ${visibleColumns}`,
    );
  }

  const containerStyle = getComputedStyle(productListContainer);
  if (
    containerStyle.paddingTop !== "0px" ||
    containerStyle.paddingRight !== "0px" ||
    containerStyle.paddingBottom !== "0px" ||
    containerStyle.paddingLeft !== "0px"
  ) {
    throw new Error("Desktop brand product containers require zero padding");
  }
  if (
    getComputedStyle(panel).borderRadius !== "12px" ||
    getComputedStyle(productList).borderRadius !== "12px"
  ) {
    throw new Error("Desktop brand panels require the 12px surface radius");
  }

  const panelBounds = panel.getBoundingClientRect();
  const itemBounds = firstItem.getBoundingClientRect();
  if (
    Math.abs(itemBounds.left - panelBounds.left) > 2 ||
    Math.abs(itemBounds.right - panelBounds.right) > 2
  ) {
    throw new Error("Desktop product rows must span the full brand panel");
  }
  if (getComputedStyle(firstItem).borderTopWidth !== "0px") {
    throw new Error("The first desktop product row must not render a divider");
  }
  if (getComputedStyle(secondItem).borderTopWidth === "0px") {
    throw new Error("Following desktop product rows require full-width dividers");
  }
  const secondDividerStyle = getComputedStyle(secondItem, "::before");
  if (
    secondDividerStyle.content === "none" ||
    secondDividerStyle.left !== "0px" ||
    secondDividerStyle.right !== "0px" ||
    secondDividerStyle.height !== "1px"
  ) {
    throw new Error("Desktop product dividers must paint edge to edge");
  }

  const cardStyle = getComputedStyle(firstCard);
  if (
    cardStyle.paddingTop !== "8px" ||
    cardStyle.paddingRight !== "8px" ||
    cardStyle.paddingBottom !== "8px" ||
    cardStyle.paddingLeft !== "8px"
  ) {
    throw new Error("Desktop compact product rows require 8px padding");
  }

  const priceActionStyle = getComputedStyle(firstPriceActionRow);
  if (
    priceActionStyle.paddingTop !== "0px" ||
    priceActionStyle.paddingRight !== "4px"
  ) {
    throw new Error(
      "Desktop compact product price rows require 0px top and 4px right padding",
    );
  }

  const imageSurfaceColors = new Set(
    Array.from(imageSurfaces, (surface) =>
      getComputedStyle(surface).backgroundColor,
    ),
  );
  if (imageSurfaceColors.size !== 1) {
    throw new Error(
      "Desktop compact product images require one consistent surface color",
    );
  }
  if (getComputedStyle(brandTitle).color !== "rgb(255, 255, 255)") {
    throw new Error("Brand banner text must stay white across color themes");
  }

  const desktopItems = list.querySelectorAll<HTMLElement>(
    '[data-slot="brand-product-rail-campaign"] [data-slot="product-list-item"]',
  );
  for (const item of desktopItems) {
    const ownerList = item.closest<HTMLElement>('[data-slot="product-list"]');
    if (
      !ownerList ||
      Math.abs(item.getBoundingClientRect().width - ownerList.clientWidth) > 1
    ) {
      throw new Error("Desktop compact product rows must stretch to full width");
    }
  }
}

async function verifyDesktopResponsiveLayout(context: {
  canvasElement: HTMLElement;
}) {
  const storyCanvas = context.canvasElement.querySelector<HTMLElement>(
    '[data-slot="brand-product-rail-story-canvas"]',
  );
  if (!storyCanvas) throw new Error("Brand product rail story canvas missing");

  const originalWidth = storyCanvas.style.width;
  try {
    for (const viewportWidth of [1280, 1440, 1920]) {
      storyCanvas.style.width = `${viewportWidth}px`;
      await new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      );
      await verifyDesktopLayout(context);
    }
  } finally {
    storyCanvas.style.width = originalWidth;
  }
}

export const Mobile: Story = {
  name: "Mobile",
  render: renderResponsiveStory,
};

export const MobileCardCoverage: Story = {
  tags: ["!dev", "!autodocs"],
  globals: {
    viewport: { value: "yamiMobile", isRotated: false },
  },
  render: renderResponsiveStory,
  play: verifyMobileLayout,
};

export const MobileMinimumViewportCoverage: Story = {
  tags: ["!dev", "!autodocs"],
  globals: {
    viewport: { value: "yamiMobileSm", isRotated: false },
  },
  render: renderResponsiveStory,
  play: verifyMobileLayout,
};

export const TabletCoverage: Story = {
  tags: ["!dev", "!autodocs"],
  globals: {
    viewport: { value: "yamiTablet", isRotated: false },
  },
  render: renderResponsiveStory,
  play: verifyMobileLayout,
};

export const MobilePlainCoverage: Story = {
  tags: ["!dev", "!autodocs"],
  globals: {
    viewport: { value: "yamiMobile", isRotated: false },
  },
  args: {
    mobileSurface: "plain",
    dividerPosition: "top",
    dividerVariant: "gray",
  },
  render: renderResponsiveStory,
  play: async (context) => {
    await verifyMobileLayout(context);

    const root = context.canvasElement.querySelector<HTMLElement>(
      '[data-slot="brand-product-rail"]',
    );
    const container = root?.querySelector<HTMLElement>(
      '[data-slot="brand-product-rail-container"]',
    );
    const list = root?.querySelector<HTMLElement>(
      '[data-slot="brand-product-rail-list"]',
    );
    const firstPanel = list?.querySelector<HTMLElement>(
      '[data-slot="brand-product-rail-campaign"]',
    );
    const nestedProductList = firstPanel?.querySelector<HTMLElement>(
      '[data-slot="product-list"]',
    );
    if (!root || !container || !list || !firstPanel || !nestedProductList) {
      throw new Error("Plain mobile Brand Product Rail did not render");
    }

    const rootStyle = getComputedStyle(root);
    const containerStyle = getComputedStyle(container);
    const listStyle = getComputedStyle(list);
    const rootRect = root.getBoundingClientRect();
    const listRect = list.getBoundingClientRect();
    if (
      root.dataset.mobileSurface !== "plain" ||
      nestedProductList.dataset.mobileSurface !== "plain" ||
      rootRect.left !== 0 ||
      rootRect.right !== window.innerWidth ||
      rootStyle.marginLeft !== "0px" ||
      rootStyle.marginRight !== "0px" ||
      rootStyle.borderRadius !== "0px" ||
      rootStyle.borderTopWidth !== "1px" ||
      rootStyle.borderBottomWidth !== "0px" ||
      containerStyle.padding !== "16px" ||
      listRect.left !== 0 ||
      listRect.right !== window.innerWidth ||
      firstPanel.getBoundingClientRect().left !== 16 ||
      listStyle.columnGap !== "8px" ||
      listStyle.marginLeft !== "-16px" ||
      listStyle.marginRight !== "-16px" ||
      listStyle.paddingLeft !== "16px" ||
      listStyle.paddingRight !== "16px" ||
      listStyle.scrollPaddingInline !== "16px"
    ) {
      throw new Error(
        "Plain mobile Brand Product Rail must use the full-bleed 16px surface contract",
      );
    }
  },
};

export const Pc: Story = {
  name: "PC",
  render: renderResponsiveStory,
  play: verifyDesktopResponsiveLayout,
};
