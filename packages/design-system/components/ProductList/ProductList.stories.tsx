import type { CSSProperties } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { ProductList } from "./ProductList";
import type { ProductListItem, ProductListProps } from "./ProductList.types";
import storyStyles from "./ProductList.stories.module.css";
import {
  createProductListProducts,
  createProductListTabs,
  productListCopy as copy,
  type ProductListLocale as ProductLocale,
} from "./fixtures";

const bannerSrc = new URL("./assets/mega-saver-banner.webp", import.meta.url)
  .href;
const bannerMobileSrc = new URL(
  "./assets/campaign-banner-mobile.png",
  import.meta.url,
).href;
const atmosphereDesktopSrc = new URL(
  "./assets/atmospheric-pc.jpg",
  import.meta.url,
).href;
const atmosphereMobileSrc = new URL(
  "./assets/atmospheric-mobile.jpg",
  import.meta.url,
).href;

function getProps(
  locale: ProductLocale,
  overrides: Partial<ProductListProps> = {},
): ProductListProps {
  const localeCopy = copy[locale];
  return {
    title: localeCopy.heading,
    products: createProductListProducts(locale),
    tabs: createProductListTabs(locale),
    viewAllHref: "#all-products",
    viewAllLabel: localeCopy.viewAll,
    loadMoreLabel: localeCopy.loadMore,
    loadingLabel: localeCopy.loading,
    onAddToCart: () => {},
    ...overrides,
  };
}

function localeFromGlobals(value: unknown): ProductLocale {
  return value === "en" ? "en" : "zh";
}

const meta = {
  title: "YAMI/Components/Commerce/Product List",
  component: ProductList,
  decorators: [
    (Story) => (
      <div className={storyStyles.pageCanvas}>
        <Story />
      </div>
    ),
  ],
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Responsive, data-driven YAMI product collection. It composes ProductCard, Tabs, and Button into rail and waterfall layouts with standard, themed, and atmospheric surfaces.",
      },
    },
  },
  argTypes: {
    mobileSurface: {
      options: ["card", "plain"],
      control: { type: "radio" },
      description:
        "Mobile section surface. Plain is full-bleed with 16px content padding and supports dividers; card keeps the inset rounded surface and ignores mobile dividers.",
    },
    dividerPosition: {
      options: ["top", "bottom", "none"],
      control: { type: "radio" },
      description:
        "Section divider edge. Always supported on desktop; on mobile it is available only for the plain surface.",
    },
    dividerVariant: {
      options: ["gray", "black"],
      control: { type: "radio" },
      description: "Gray renders at 1px; black emphasis renders at 2px.",
    },
  },
  args: {
    title: "产品列表",
    products: createProductListProducts("en"),
    appearance: "standard",
    layout: "rail",
    mobileSurface: "card",
    dividerPosition: "top",
    dividerVariant: "gray",
  },
} satisfies Meta<typeof ProductList>;

export default meta;
type Story = StoryObj<typeof meta>;

function Collection({
  globals,
  overrides,
}: {
  globals: Record<string, unknown>;
  overrides?: Partial<ProductListProps>;
}) {
  const locale = localeFromGlobals(globals.locale);
  return <ProductList {...getProps(locale, overrides)} />;
}

export const Showcase: Story = {
  render: (args, { globals }) => (
    <Collection
      globals={globals}
      overrides={{
        dividerPosition: args.dividerPosition,
        dividerVariant: args.dividerVariant,
        mobileSurface: args.mobileSurface,
      }}
    />
  ),
  play: async ({ canvasElement }) => {
    const container = canvasElement.querySelector<HTMLElement>(
      '[data-slot="product-list-container"]',
    );
    if (!container) throw new Error("Product List container did not render");
    if (getComputedStyle(container).rowGap !== "12px") {
      throw new Error("Desktop Product List must use a 12px vertical gap");
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
  render: (args, { globals }) => (
    <Collection
      globals={globals}
      overrides={{
        dividerPosition: args.dividerPosition,
        dividerVariant: args.dividerVariant,
      }}
    />
  ),
  play: async ({ canvasElement }) => {
    const root = canvasElement.querySelector<HTMLElement>(
      '[data-slot="product-list"]',
    );
    if (!root) throw new Error("Product List did not render");
    const style = getComputedStyle(root);
    if (style.borderBottomWidth !== "2px" || style.borderTopWidth !== "0px") {
      throw new Error("Product List black divider must render 2px on the bottom only");
    }
  },
};

export const MobileDividerDisabled: Story = {
  tags: ["!dev", "!autodocs"],
  globals: {
    viewport: { value: "yamiMobile", isRotated: false },
  },
  args: {
    mobileSurface: "card",
    dividerPosition: "bottom",
    dividerVariant: "black",
  },
  render: BlackBottomDivider.render,
  play: async ({ canvasElement }) => {
    const root = canvasElement.querySelector<HTMLElement>(
      '[data-slot="product-list"]',
    );
    const container = canvasElement.querySelector<HTMLElement>(
      '[data-slot="product-list-container"]',
    );
    const list = canvasElement.querySelector<HTMLElement>(
      '[data-slot="product-list-items"]',
    );
    if (!root || !container || !list) {
      throw new Error("Product List did not render");
    }
    const style = getComputedStyle(root);
    if (style.borderBottomWidth !== "0px" || style.borderTopWidth !== "0px") {
      throw new Error("Card mobile Product List must ignore divider configuration");
    }
    const containerStyle = getComputedStyle(container);
    const listStyle = getComputedStyle(list);
    if (
      style.marginLeft !== "8px" ||
      style.marginRight !== "8px" ||
      style.borderRadius !== "12px" ||
      containerStyle.paddingLeft !== "8px" ||
      containerStyle.paddingRight !== "8px" ||
      list.getBoundingClientRect().left !== root.getBoundingClientRect().left ||
      list.getBoundingClientRect().right !== root.getBoundingClientRect().right ||
      listStyle.columnGap !== "8px" ||
      listStyle.marginLeft !== "-8px" ||
      listStyle.marginRight !== "-8px" ||
      listStyle.paddingTop !== "2px" ||
      listStyle.paddingRight !== "8px" ||
      listStyle.paddingBottom !== "2px" ||
      listStyle.paddingLeft !== "8px"
    ) {
      throw new Error(
        "Card mobile Product List must preserve the default 8px rail geometry",
      );
    }
  },
};

export const MobilePlain: Story = {
  name: "Mobile / Plain",
  globals: {
    viewport: { value: "yamiMobile", isRotated: false },
  },
  args: {
    mobileSurface: "plain",
    dividerPosition: "top",
    dividerVariant: "gray",
  },
  render: Showcase.render,
  play: async ({ canvasElement }) => {
    const root = canvasElement.querySelector<HTMLElement>(
      '[data-slot="product-list"]',
    );
    const container = canvasElement.querySelector<HTMLElement>(
      '[data-slot="product-list-container"]',
    );
    const list = canvasElement.querySelector<HTMLElement>(
      '[data-slot="product-list-items"]',
    );
    const firstItem = list?.firstElementChild as HTMLElement | null;
    const firstCard = list?.querySelector<HTMLElement>(
      '[data-slot="product-card"]',
    );
    const tabsList = canvasElement.querySelector<HTMLElement>(
      '[role="tablist"]',
    );
    const firstTab = tabsList?.querySelector<HTMLElement>('[role="tab"]');
    if (
      !root ||
      !container ||
      !list ||
      !firstItem ||
      !firstCard ||
      !tabsList ||
      !firstTab
    ) {
      throw new Error("Product List did not render");
    }

    const rootStyle = getComputedStyle(root);
    const containerStyle = getComputedStyle(container);
    const listStyle = getComputedStyle(list);
    const tabsListStyle = getComputedStyle(tabsList);
    if (
      root.dataset.mobileSurface !== "plain" ||
      root.getBoundingClientRect().left !== 0 ||
      root.getBoundingClientRect().width !== window.innerWidth ||
      rootStyle.marginLeft !== "0px" ||
      rootStyle.marginRight !== "0px" ||
      rootStyle.borderRadius !== "0px"
    ) {
      throw new Error("Plain mobile Product List must be square and full-bleed");
    }
    if (
      containerStyle.paddingTop !== "16px" ||
      containerStyle.paddingRight !== "16px" ||
      containerStyle.paddingBottom !== "16px" ||
      containerStyle.paddingLeft !== "16px"
    ) {
      throw new Error("Plain mobile Product List must use 16px content padding");
    }
    if (
      rootStyle.borderTopWidth !== "1px" ||
      rootStyle.borderBottomWidth !== "0px"
    ) {
      throw new Error("Plain mobile Product List must support the top divider");
    }
    if (
      tabsList.getBoundingClientRect().left !== 0 ||
      tabsList.getBoundingClientRect().right !== window.innerWidth ||
      firstTab.getBoundingClientRect().left !== 16 ||
      tabsListStyle.columnGap !== "4px" ||
      tabsListStyle.marginLeft !== "-16px" ||
      tabsListStyle.marginRight !== "-16px" ||
      tabsListStyle.paddingRight !== "16px" ||
      tabsListStyle.paddingLeft !== "16px" ||
      tabsListStyle.scrollPaddingInline !== "16px" ||
      tabsList.scrollWidth <= tabsList.clientWidth
    ) {
      throw new Error(
        "Plain mobile Product List tabs must span the viewport without changing tab spacing",
      );
    }
    if (
      list.getBoundingClientRect().left !== 0 ||
      list.getBoundingClientRect().right !== window.innerWidth ||
      firstItem.getBoundingClientRect().left !== 16 ||
      listStyle.columnGap !== "8px" ||
      listStyle.marginLeft !== "-16px" ||
      listStyle.marginRight !== "-16px" ||
      listStyle.paddingTop !== "2px" ||
      listStyle.paddingRight !== "16px" ||
      listStyle.paddingBottom !== "2px" ||
      listStyle.paddingLeft !== "16px" ||
      listStyle.scrollPaddingInline !== "16px" ||
      firstCard.dataset.surface !== "plain" ||
      getComputedStyle(firstCard).padding !== "0px" ||
      list.scrollWidth <= list.clientWidth
    ) {
      throw new Error(
        "Plain mobile Product List rail must preserve the default 8px geometry and remain scrollable",
      );
    }
  },
};

export const MobilePlainBlackBottomDivider: Story = {
  tags: ["!dev", "!autodocs"],
  globals: {
    viewport: { value: "yamiMobile", isRotated: false },
  },
  args: {
    mobileSurface: "plain",
    dividerPosition: "bottom",
    dividerVariant: "black",
  },
  render: Showcase.render,
  play: async ({ canvasElement }) => {
    const root = canvasElement.querySelector<HTMLElement>(
      '[data-slot="product-list"]',
    );
    if (!root) throw new Error("Product List did not render");
    const style = getComputedStyle(root);
    if (style.borderBottomWidth !== "2px" || style.borderTopWidth !== "0px") {
      throw new Error("Plain mobile Product List must support the black bottom divider");
    }
  },
};

export const MobilePlainVariantContract: Story = {
  tags: ["!dev", "!autodocs"],
  globals: {
    viewport: { value: "yamiMobile", isRotated: false },
  },
  args: {
    mobileSurface: "plain",
    dividerPosition: "top",
    dividerVariant: "gray",
  },
  render: (args, { globals }) => {
    const locale = localeFromGlobals(globals.locale);
    const shared = {
      mobileSurface: args.mobileSurface,
      dividerPosition: args.dividerPosition,
      dividerVariant: args.dividerVariant,
    };

    return (
      <>
        <ProductList {...getProps(locale, shared)} />
        <ProductList
          {...getProps(locale, {
            ...shared,
            title: copy[locale].themedTitle,
            appearance: "themed",
            banner: {
              src: bannerSrc,
              mobileSrc: bannerMobileSrc,
              alt: copy[locale].bannerAlt,
              backgroundColor: "#E4E5F0",
              mobileBackgroundColor: "#F9EAF3",
            },
          })}
        />
        <ProductList
          {...getProps(locale, {
            ...shared,
            title: copy[locale].atmosphericTitle,
            appearance: "atmospheric",
            backgroundColor: "#FFF8EB",
            backgroundImage: atmosphereDesktopSrc,
            backgroundImageMobile: atmosphereMobileSrc,
          })}
        />
        <ProductList
          {...getProps(locale, {
            ...shared,
            products: [],
            loading: true,
            skeletonCount: 4,
          })}
        />
        <ProductList
          {...getProps(locale, {
            ...shared,
            layout: "waterfall",
          })}
        />
      </>
    );
  },
  play: async ({ canvasElement }) => {
    const roots = Array.from(
      canvasElement.querySelectorAll<HTMLElement>(
        '[data-slot="product-list"]',
      ),
    );
    if (roots.length !== 5) {
      throw new Error(`Expected five Product List variants, got ${roots.length}`);
    }

    const railRoots = roots.filter((root) => root.dataset.layout === "rail");
    for (const root of railRoots) {
      const list = root.querySelector<HTMLElement>(
        '[data-slot="product-list-items"]',
      );
      const firstItem = list?.firstElementChild as HTMLElement | null;
      if (!list || !firstItem) {
        throw new Error("Mobile plain rail did not render items");
      }
      const style = getComputedStyle(list);
      const listRect = list.getBoundingClientRect();
      const rootRect = root.getBoundingClientRect();
      if (
        root.dataset.mobileSurface !== "plain" ||
        listRect.left - rootRect.left !== 0 ||
        rootRect.right - listRect.right !== 0 ||
        firstItem.getBoundingClientRect().left - listRect.left !== 16 ||
        style.columnGap !== "8px" ||
        style.marginLeft !== "-16px" ||
        style.marginRight !== "-16px" ||
        style.paddingTop !== "2px" ||
        style.paddingRight !== "16px" ||
        style.paddingBottom !== "2px" ||
        style.paddingLeft !== "16px" ||
        style.scrollPaddingInline !== "16px" ||
        list.scrollWidth <= list.clientWidth
      ) {
        throw new Error(
          `${root.dataset.appearance} mobile plain rail must share the default 8px geometry`,
        );
      }
    }

    const waterfall = roots.find((root) => root.dataset.layout === "waterfall");
    const waterfallList = waterfall?.querySelector<HTMLElement>(
      '[data-slot="product-list-items"]',
    );
    const waterfallCard = waterfallList?.querySelector<HTMLElement>(
      '[data-slot="product-card"]',
    );
    if (
      waterfall?.dataset.mobileSurface !== "plain" ||
      !waterfallList ||
      !waterfallCard ||
      getComputedStyle(waterfallList).display !== "grid" ||
      getComputedStyle(waterfallList).gap !== "16px" ||
      getComputedStyle(waterfallList).padding !== "0px" ||
      getComputedStyle(waterfall).borderRadius !== "0px" ||
      waterfallCard.dataset.surface !== "plain" ||
      getComputedStyle(waterfallCard).padding !== "0px"
    ) {
      throw new Error(
        "Mobile plain waterfall must use a square surface with 16px spacing and no list padding",
      );
    }
  },
};

export const StandardRail: Story = {
  render: Showcase.render,
  play: verifyDesktopListPadding,
};

export const StaticRailHeader: Story = {
  tags: ["!dev", "!autodocs"],
  render: (_args, { globals }) => {
    const locale = localeFromGlobals(globals.locale);
    return (
      <ProductList
        {...getProps(locale, {
          products: createProductListProducts(locale).slice(0, 2),
          viewAllHref: " ",
        })}
      />
    );
  },
  play: async ({ canvasElement }) => {
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    const actions = canvasElement.querySelector(
      '[data-slot="product-list-actions"]',
    );
    const navigation = canvasElement.querySelector(
      '[data-slot="rail-navigation"]',
    );
    const viewAll = canvasElement.querySelector(
      '[data-slot="product-list-view-all"]',
    );
    if (actions || navigation || viewAll) {
      throw new Error(
        "A non-scrollable rail without a collection link must render no heading actions",
      );
    }
  },
};

async function verifyCampaignPadding({
  canvasElement,
}: {
  canvasElement: HTMLElement;
}) {
  if (window.innerWidth < 1024) return;
  await verifyDesktopListPadding({ canvasElement });
  const outer = canvasElement.querySelector<HTMLElement>(
    '[class*="campaignCanvas"]',
  );
  if (!outer) throw new Error("Campaign Product List outer frame did not render");
  const style = getComputedStyle(outer);
  if (
    style.paddingTop !== "32px" ||
    style.paddingRight !== "48px" ||
    style.paddingBottom !== "32px" ||
    style.paddingLeft !== "48px"
  ) {
    throw new Error(
      "Themed and atmospheric Product Lists require an outer 48px horizontal and 32px vertical padding frame",
    );
  }
}

async function verifyDesktopListPadding({
  canvasElement,
}: {
  canvasElement: HTMLElement;
}) {
  if (window.innerWidth < 1024) return;
  const list = canvasElement.querySelector<HTMLElement>(
    '[data-slot="product-list-items"]',
  );
  if (!list) throw new Error("Desktop Product List items did not render");
  const style = getComputedStyle(list);
  if (
    style.paddingTop !== "4px" ||
    style.paddingRight !== "0px" ||
    style.paddingBottom !== "0px" ||
    style.paddingLeft !== "0px"
  ) {
    throw new Error("Desktop Product List must use 4px top padding only");
  }
}

async function verifyThemedRailSurface(context: {
  canvasElement: HTMLElement;
}) {
  await verifyCampaignPadding(context);
  const list = context.canvasElement.querySelector<HTMLElement>(
    '[data-slot="product-list-items"]',
  );
  const root = context.canvasElement.querySelector<HTMLElement>(
    '[data-slot="product-list"]',
  );
  const firstItem = list?.firstElementChild as HTMLElement | null;
  const firstImage = list?.querySelector<HTMLElement>(
    '[data-slot="product-card-image"]',
  );
  if (!root || !list || !firstItem || !firstImage) {
    throw new Error("Themed Product List rail did not render");
  }
  const style = getComputedStyle(list);
  const rootRect = root.getBoundingClientRect();
  const listRect = list.getBoundingClientRect();
  const itemStyle = getComputedStyle(firstItem);
  const imageStyle = getComputedStyle(firstImage);
  const desktop = window.innerWidth >= 1024;
  if (
    list.dataset.surface !== "card" ||
    style.backgroundColor !== "rgba(0, 0, 0, 0)" ||
    style.borderRadius !== "0px" ||
    style.columnGap !== (desktop ? "12px" : "8px") ||
    style.paddingTop !== (desktop ? "4px" : "2px") ||
    style.paddingRight !== (desktop ? "0px" : "8px") ||
    style.paddingBottom !== (desktop ? "0px" : "2px") ||
    style.paddingLeft !== (desktop ? "0px" : "8px") ||
    style.scrollPaddingInline !== (desktop ? "0px" : "8px") ||
    (!desktop && Math.abs(listRect.left - rootRect.left) > 0.5) ||
    (!desktop && Math.abs(listRect.right - rootRect.right) > 0.5) ||
    (window.innerWidth < 1024
      ? firstItem.getBoundingClientRect().width !== 152
      : firstItem.getBoundingClientRect().width <= 152) ||
    itemStyle.backgroundColor !== "rgba(0, 0, 0, 0)" ||
    imageStyle.backgroundColor !== "rgb(255, 255, 255)"
  ) {
    throw new Error(
      "Themed Product List rail must use the shared Horizontal Scroll List card surface",
    );
  }
}

export const ThemedRail: Story = {
  render: (args, { globals }) => {
    const locale = localeFromGlobals(globals.locale);
    return (
      <div className={storyStyles.campaignCanvas}>
        <ProductList
          {...getProps(locale, {
            title: copy[locale].themedTitle,
            appearance: "themed",
            mobileSurface: args.mobileSurface,
            dividerPosition: args.dividerPosition,
            dividerVariant: args.dividerVariant,
            banner: {
              src: bannerSrc,
              mobileSrc: bannerMobileSrc,
              alt: copy[locale].bannerAlt,
              backgroundColor: "#E4E5F0",
              mobileBackgroundColor: "#F9EAF3",
            },
          })}
        />
      </div>
    );
  },
  play: verifyThemedRailSurface,
};

export const AtmosphericRail: Story = {
  render: (args, { globals }) => {
    const locale = localeFromGlobals(globals.locale);
    return (
      <div className={storyStyles.campaignCanvas}>
        <ProductList
          {...getProps(locale, {
            title: copy[locale].atmosphericTitle,
            appearance: "atmospheric",
            mobileSurface: args.mobileSurface,
            dividerPosition: args.dividerPosition,
            dividerVariant: args.dividerVariant,
            backgroundColor: "#FFF8EB",
            backgroundImage: atmosphereDesktopSrc,
            backgroundImageMobile: atmosphereMobileSrc,
          })}
        />
      </div>
    );
  },
  play: verifyCampaignPadding,
};

export const Waterfall: Story = {
  render: (args, { globals }) => (
    <Collection
      globals={globals}
      overrides={{
        layout: "waterfall",
        mobileSurface: args.mobileSurface,
        dividerPosition: args.dividerPosition,
        dividerVariant: args.dividerVariant,
        viewAllHref: undefined,
        hasMore: true,
        onLoadMore: () => {},
      }}
    />
  ),
  play: async ({ canvasElement }) => {
    await verifyDesktopListPadding({ canvasElement });
    for (const id of [
      "elegance-face-powder-i",
      "revive-moisturizing-renewal-cream",
    ]) {
      if (!canvasElement.querySelector(`[href$="/products/${id}"]`)) {
        throw new Error(`Waterfall is missing the shared product fixture "${id}"`);
      }
    }
  },
};

const skeletonMatrixStyle: CSSProperties = {
  display: "grid",
  gap: "var(--space-400)",
  paddingBlock: "var(--space-200)",
};

export const SkeletonMatrix: Story = {
  render: (args, { globals }) => {
    const locale = localeFromGlobals(globals.locale);
    const localeCopy = copy[locale];
    const layouts = ["rail", "waterfall"] as const;

    return (
      <div style={skeletonMatrixStyle}>
        {layouts.map((layout) => (
          <ProductList
            key={layout}
            title={`${localeCopy.loading} · ${layout}`}
            products={[]}
            layout={layout}
            mobileSurface={args.mobileSurface}
            dividerPosition={args.dividerPosition}
            dividerVariant={args.dividerVariant}
            loading
            loadingLabel={localeCopy.loading}
            skeletonCount={4}
          />
        ))}
      </div>
    );
  },
};

/* One divider contract across all three appearances: dividerPosition and
 * dividerVariant decide it, desktop draws it, mobile draws none. Standard is a
 * square full-bleed band and paints a border; the campaign appearances are
 * rounded panels, where a border follows the 16px radius and curves, so they
 * paint a clipped overlay instead. The prop is what a caller sees, so that is
 * what this asserts — not which of the two mechanisms answered.
 *
 * Hidden from the sidebar: a matrix of computed styles, not a format to
 * browse. */
export const DividerContract: Story = {
  tags: ["!dev", "!autodocs"],
  render: (_args, { globals }) => {
    const locale = localeFromGlobals(globals.locale);
    return (
      <div className={storyStyles.pageCanvas}>
        {(["standard", "themed", "atmospheric"] as const).map((appearance) => (
          <ProductList
            key={appearance}
            {...getProps(locale, {
              appearance,
              dividerPosition: "top",
              dividerVariant: "gray",
            })}
          />
        ))}
      </div>
    );
  },
  play: async ({ canvasElement }) => {
    const lists = Array.from(
      canvasElement.querySelectorAll<HTMLElement>('[data-slot="product-list"]'),
    );
    if (lists.length !== 3) {
      throw new Error(`Expected one list per appearance, got ${lists.length}`);
    }

    const desktop = window.innerWidth >= 1024;
    const paints = (root: HTMLElement, edge: "top" | "bottom") => {
      const style = getComputedStyle(root);
      const overlay = getComputedStyle(root, "::after");
      const border =
        edge === "top" ? style.borderTopWidth : style.borderBottomWidth;
      const drawnByBorder = Number.parseFloat(border) > 0;
      const drawnByOverlay =
        overlay.content !== "none" &&
        Number.parseFloat(overlay.height) > 0 &&
        Number.parseFloat(edge === "top" ? overlay.top : overlay.bottom) === 0;
      return drawnByBorder || drawnByOverlay;
    };

    for (const root of lists) {
      const appearance = root.dataset.appearance;

      for (const edge of ["top", "bottom"] as const) {
        root.setAttribute("data-divider-position", edge);
        if (paints(root, edge) !== desktop) {
          throw new Error(
            `${appearance} with dividerPosition="${edge}" must ${desktop ? "paint" : "paint no"} rule at ${window.innerWidth}px`,
          );
        }
        // The opposite edge stays clear, whatever the width.
        const other = edge === "top" ? "bottom" : "top";
        if (paints(root, other)) {
          throw new Error(
            `${appearance} with dividerPosition="${edge}" must leave its ${other} edge clear`,
          );
        }
      }

      root.setAttribute("data-divider-position", "none");
      if (paints(root, "top") || paints(root, "bottom")) {
        throw new Error(`${appearance} with dividerPosition="none" must paint nothing`);
      }
      root.setAttribute("data-divider-position", "top");
    }
  },
};

export const DividerContractMobile: Story = {
  ...DividerContract,
  tags: ["!dev", "!autodocs"],
  globals: { viewport: { value: "yamiMobile", isRotated: false } },
};

/* The waterfall's column ladder below the desktop breakpoint, asserted at each
 * band's narrowest point — where a threshold set too low does its damage. Both
 * stories run the same check; only the viewport differs.
 *
 * Hidden from the sidebar: a measurement rig, not a format to browse. */
const assertWaterfallColumns: NonNullable<Story["play"]> = async ({
  canvasElement,
}) => {
  const grid = canvasElement.querySelector<HTMLElement>(
    '[data-slot="product-list-items"]',
  );
  if (!grid) throw new Error("Waterfall grid did not render");

  const width = window.innerWidth;
  const expected = width >= 1024 ? null : width >= 768 ? 4 : width >= 560 ? 3 : 2;
  if (expected === null) return;

  const columns = getComputedStyle(grid).gridTemplateColumns.split(" ").length;
  if (columns !== expected) {
    throw new Error(
      `At ${width}px the feed must run ${expected} columns, ran ${columns}`,
    );
  }

  // The ladder exists to keep the card readable, so the count alone is not the
  // point. 152px is the horizontal rails' card; a feed card must not come in
  // under it, which is what a 440px three-column threshold would have done.
  const card = grid.firstElementChild as HTMLElement | null;
  if (!card) throw new Error("Waterfall grid rendered no cards");
  const cardWidth = card.getBoundingClientRect().width;
  if (cardWidth < 152) {
    throw new Error(
      `At ${width}px a ${expected}-column feed leaves a ${cardWidth.toFixed(1)}px card, under the 152px rail card`,
    );
  }
};

export const WaterfallColumnsPhone: Story = {
  ...Waterfall,
  tags: ["!dev", "!autodocs"],
  globals: { viewport: { value: "yamiMobile", isRotated: false } },
  play: assertWaterfallColumns,
};

/* 480px is the band a 440px threshold would have broken: three columns there
 * leave a 136px card. Neither the phone nor the tablet story covers it — the
 * damage of a threshold set too low happens between the presets. */
export const WaterfallColumnsLargePhone: Story = {
  ...Waterfall,
  tags: ["!dev", "!autodocs"],
  globals: { viewport: { value: "yamiMobileXl", isRotated: false } },
  play: assertWaterfallColumns,
};

export const WaterfallColumnsTablet: Story = {
  ...Waterfall,
  tags: ["!dev", "!autodocs"],
  globals: { viewport: { value: "yamiTablet", isRotated: false } },
  play: assertWaterfallColumns,
};
