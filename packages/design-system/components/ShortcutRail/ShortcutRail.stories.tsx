import type { Meta, StoryObj } from "@storybook/react-vite";

import { ShortcutRail } from "./ShortcutRail";
import storyStyles from "./ShortcutRail.stories.module.css";
import type {
  ShortcutRailProps,
} from "./ShortcutRail.types";
import {
  createFullBleedShortcutItems,
  createShortcutItems,
  fullBleedShortcutEntries,
  shortcutCopy,
  type ShortcutLocale,
} from "./fixtures";

function localeFromGlobals(value: unknown): ShortcutLocale {
  return value === "en" ? "en" : "zh";
}

function getProps(locale: ShortcutLocale): ShortcutRailProps {
  return {
    items: createShortcutItems(locale),
    ariaLabel: shortcutCopy[locale].ariaLabel,
    previousLabel: shortcutCopy[locale].previousLabel,
    nextLabel: shortcutCopy[locale].nextLabel,
  };
}

const meta = {
  title: "YAMI/Components/Navigation/Shortcut Rail",
  component: ShortcutRail,
  decorators: [
    (Story) => (
      <div className={storyStyles.pageCanvas} data-slot="shortcut-rail-story-canvas">
        <Story />
      </div>
    ),
  ],
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Responsive YAMI shortcut navigation with circular image icons, native horizontal scrolling, and overflow-aware Button controls over white edge masks.",
      },
    },
  },
  argTypes: {
    surface: {
      control: "inline-radio",
      options: ["card", "plain"],
    },
    dividerPosition: {
      control: "inline-radio",
      options: ["top", "bottom", "none"],
    },
    dividerVariant: {
      control: "inline-radio",
      options: ["gray", "black"],
    },
  },
  args: {
    ...getProps("zh"),
    surface: "plain",
    dividerPosition: "none",
    dividerVariant: "gray",
  },
} satisfies Meta<typeof ShortcutRail>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Showcase: Story = {
  name: "PC",
  globals: {
    viewport: { value: "yamiDesktopMd", isRotated: false },
  },
  render: (args, { globals }) => {
    const locale = localeFromGlobals(globals.locale);
    return (
      <ShortcutRail
        {...getProps(locale)}
        surface={args.surface}
        dividerPosition={args.dividerPosition}
        dividerVariant={args.dividerVariant}
      />
    );
  },
  play: async ({ canvasElement }) => {
    const container = canvasElement.querySelector<HTMLElement>(
      '[data-slot="shortcut-rail-container"]',
    );
    const list = canvasElement.querySelector<HTMLElement>(
      '[data-slot="shortcut-rail-list"]',
    );
    if (!container || !list) {
      throw new Error("Shortcut rail list did not render");
    }

    const links = canvasElement.querySelectorAll(
      '[data-slot="shortcut-rail-link"]',
    );
    if (links.length !== 23) {
      throw new Error(`Expected 23 shortcut links, got ${links.length}`);
    }

    const label = links[0]?.querySelector<HTMLElement>(
      '[data-slot="shortcut-rail-label"]',
    );
    if (!label) throw new Error("Shortcut label did not render");
    const labelStyle = getComputedStyle(label);
    const lineHeight = Number.parseFloat(labelStyle.lineHeight);
    const maxHeight = Number.parseFloat(labelStyle.maxHeight);
    if (
      labelStyle.overflow !== "hidden" ||
      labelStyle.whiteSpace !== "normal" ||
      Math.abs(maxHeight - lineHeight * 2) > 0.5
    ) {
      throw new Error("Shortcut labels must wrap and clamp at two lines");
    }

    const containerStyle = getComputedStyle(container);
    const listStyle = getComputedStyle(list);
    if (
      containerStyle.paddingTop !== "32px" ||
      containerStyle.paddingBottom !== "32px" ||
      listStyle.paddingTop !== "0px" ||
      listStyle.paddingBottom !== "0px"
    ) {
      throw new Error(
        "Shortcut rail container must own the vertical section spacing",
      );
    }

    const iconSurface = links[0]?.querySelector<HTMLElement>("span");
    if (!iconSurface) throw new Error("Shortcut icon surface did not render");
    const iconStyle = getComputedStyle(iconSurface);
    if (iconStyle.width !== "80px" || iconStyle.height !== "80px") {
      throw new Error(
        `Shortcut icon surface must be 80x80, got ${iconStyle.width}x${iconStyle.height}`,
      );
    }

    const icon = iconSurface.querySelector<HTMLElement>("img");
    if (!icon) throw new Error("Shortcut icon did not render");
    const renderedIconStyle = getComputedStyle(icon);
    if (
      renderedIconStyle.width !== "48px" ||
      renderedIconStyle.height !== "48px"
    ) {
      throw new Error(
        `Shortcut icon must be 48x48, got ${renderedIconStyle.width}x${renderedIconStyle.height}`,
      );
    }

    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

    const nextEdge = canvasElement.querySelector<HTMLElement>(
      '[data-slot="shortcut-rail-edge"][data-direction="next"]',
    );
    if (!nextEdge) throw new Error("Next shortcut control did not render");
    if (getComputedStyle(nextEdge).width !== "128px") {
      throw new Error(
        `Shortcut edge mask must be 128px wide, got ${getComputedStyle(nextEdge).width}`,
      );
    }
    const mask = nextEdge.querySelector<HTMLElement>("span");
    if (!mask || !getComputedStyle(mask).backgroundImage.includes("linear-gradient")) {
      throw new Error("Next shortcut control must include the edge gradient mask");
    }

    const nextButton = nextEdge.querySelector<HTMLElement>("button");
    if (!nextButton) throw new Error("Next shortcut button did not render");
    const iconRect = iconSurface.getBoundingClientRect();
    const buttonRect = nextButton.getBoundingClientRect();
    const centerDelta =
      buttonRect.top +
      buttonRect.height / 2 -
      (iconRect.top + iconRect.height / 2);
    if (Math.abs(centerDelta + 2) > 1) {
      throw new Error(
        `Shortcut control must sit 2px above the icon-surface center, delta ${centerDelta}px`,
      );
    }
  },
};

export const CardSurface: Story = {
  tags: ["!dev", "!autodocs"],
  args: {
    surface: "card",
  },
  render: (args, { globals }) => {
    const locale = localeFromGlobals(globals.locale);
    return (
      <ShortcutRail
        {...getProps(locale)}
        surface={args.surface}
        dividerPosition={args.dividerPosition}
        dividerVariant={args.dividerVariant}
      />
    );
  },
  play: async ({ canvasElement }) => {
    const root = canvasElement.querySelector<HTMLElement>(
      '[data-slot="shortcut-rail"]',
    );
    const surface = canvasElement.querySelector<HTMLElement>(
      '[data-slot="shortcut-rail-surface"]',
    );
    const container = canvasElement.querySelector<HTMLElement>(
      '[data-slot="shortcut-rail-container"]',
    );
    if (!root || !surface || !container) {
      throw new Error("Card Shortcut Rail did not render");
    }

    const rootStyle = getComputedStyle(root);
    const surfaceStyle = getComputedStyle(surface);
    const containerStyle = getComputedStyle(container);
    const canvasRect = canvasElement.getBoundingClientRect();
    const rootRect = root.getBoundingClientRect();
    const expectedMargin = canvasRect.width < 1024 ? 8 : 48;
    const expectedWidth = Math.min(
      canvasRect.width - expectedMargin * 2,
      1920 - expectedMargin * 2,
    );
    if (
      root.dataset.surface !== "card" ||
      root.querySelector('[data-slot="shortcut-rail-progress"]') ||
      Math.abs(rootRect.width - expectedWidth) > 1 ||
      Math.abs(
        rootRect.left - canvasRect.left - (canvasRect.width - expectedWidth) / 2,
      ) > 1 ||
      rootStyle.borderRadius !== "12px" ||
      surfaceStyle.borderRadius !== "12px" ||
      surfaceStyle.backgroundColor === "rgba(0, 0, 0, 0)" ||
      surfaceStyle.borderTopWidth !== "0px" ||
      surfaceStyle.borderBottomWidth !== "0px" ||
      surfaceStyle.boxShadow !== "none" ||
      containerStyle.padding !== "8px"
    ) {
      throw new Error(
        "Card Shortcut Rail must use the shared inset, radius, surface, and compact padding without a border or shadow",
      );
    }
  },
};

export const FullBleedImages: Story = {
  name: "Mobile — Full-bleed",
  globals: {
    viewport: { value: "yamiMobile", isRotated: false },
  },
  render: (args, { globals }) => {
    const locale = localeFromGlobals(globals.locale);
    const props = getProps(locale);
    return (
      <ShortcutRail
        {...props}
        surface={args.surface}
        title={locale === "en" ? "Featured shortcuts" : "热门分类"}
        items={createFullBleedShortcutItems()}
        dividerPosition={args.dividerPosition}
        dividerVariant={args.dividerVariant}
      />
    );
  },
  play: async ({ canvasElement }) => {
    const root = canvasElement.querySelector<HTMLElement>(
      '[data-slot="shortcut-rail"]',
    );
    const railBody = canvasElement.querySelector<HTMLElement>(
      '[data-slot="shortcut-rail-body"]',
    );
    const title = canvasElement.querySelector<HTMLElement>(
      '[data-slot="shortcut-rail-title"]',
    );
    const links = canvasElement.querySelectorAll<HTMLElement>(
      '[data-slot="shortcut-rail-link"]',
    );
    const list = canvasElement.querySelector<HTMLElement>(
      '[data-slot="shortcut-rail-list"]',
    );
    const images = canvasElement.querySelectorAll<HTMLElement>(
      '[data-image-presentation="full-bleed"] img',
    );
    const rootRect = root?.getBoundingClientRect();
    const railBodyRect = railBody?.getBoundingClientRect();
    const listStyle = list ? getComputedStyle(list) : null;
    if (
      !root ||
      !railBody ||
      !title ||
      !list ||
      !rootRect ||
      !railBodyRect ||
      !listStyle ||
      root.dataset.railPresentation !== "full-bleed" ||
      canvasElement.querySelector('[data-slot="shortcut-rail-progress"]') ||
      getComputedStyle(root).overflow !== "hidden" ||
      getComputedStyle(title).paddingLeft !== "0px" ||
      getComputedStyle(title).paddingRight !== "4px" ||
      listStyle.overflowX !== "auto" ||
      listStyle.paddingLeft !== "16px" ||
      listStyle.paddingRight !== "16px" ||
      Math.abs(railBodyRect.left - rootRect.left) > 1 ||
      Math.abs(railBodyRect.right - rootRect.right) > 1 ||
      list.scrollWidth <= list.clientWidth ||
      images.length !== fullBleedShortcutEntries.length
    ) {
      throw new Error(
        "Full-bleed mobile shortcuts must reach the viewport edges and remain scrollable without a progress bar",
      );
    }
    const expectedImageSize =
      canvasElement.getBoundingClientRect().width < 1024 ? "56px" : "80px";
    if (
      Array.from(images).some((image) => {
        const style = getComputedStyle(image);
        return (
          style.width !== expectedImageSize ||
          style.height !== expectedImageSize ||
          style.objectFit !== "cover"
        );
      })
    ) {
      throw new Error("Full-bleed shortcut images must fill and crop the circular surface");
    }
    fullBleedShortcutEntries.forEach(([label, assetId], index) => {
      const image = links[index]?.querySelector<HTMLImageElement>("img");
      const src = `https://cdn.yamibuy.net/item/${assetId}_300x300.webp`;
      if (
        links[index]?.textContent?.trim() !== label ||
        image?.src !== src
      ) {
        throw new Error(`Full-bleed shortcut ${index + 1} must use ${label}`);
      }
    });
  },
};

export const CompactViewport: Story = {
  name: "Mobile — 1 Row",
  args: {
    surface: "card",
    lines: 1,
  },
  globals: {
    // "390" was never a registered preset, so this story silently rendered at
    // whatever the toolbar happened to hold. yamiMobile (375) is the DS primary
    // mobile target and matches BrandProductRail's CompactViewport.
    viewport: { value: "yamiMobile", isRotated: false },
  },
  parameters: {
    docs: {
      description: {
        story:
          "A title-free mobile card with one row of smaller entries and native horizontal scrolling without paging chrome.",
      },
    },
  },
  render: (args, { globals }) => {
    const locale = localeFromGlobals(globals.locale);
    return (
      <ShortcutRail
        {...getProps(locale)}
        surface={args.surface}
        lines={args.lines}
        dividerPosition={args.dividerPosition}
        dividerVariant={args.dividerVariant}
      />
    );
  },
  play: async ({ canvasElement, args }) => {
    const root = canvasElement.querySelector<HTMLElement>(
      '[data-slot="shortcut-rail"]',
    );
    const surface = canvasElement.querySelector<HTMLElement>(
      '[data-slot="shortcut-rail-surface"]',
    );
    const container = canvasElement.querySelector<HTMLElement>(
      '[data-slot="shortcut-rail-container"]',
    );
    const railBody = canvasElement.querySelector<HTMLElement>(
      '[data-slot="shortcut-rail-body"]',
    );
    const list = canvasElement.querySelector<HTMLElement>(
      '[data-slot="shortcut-rail-list"]',
    );
    const title = canvasElement.querySelector<HTMLElement>(
      '[data-slot="shortcut-rail-title"]',
    );
    if (!root || !surface || !container || !railBody || !list) {
      throw new Error("Mobile Shortcut Rail did not render");
    }
    const rootStyle = getComputedStyle(root);
    const surfaceStyle = getComputedStyle(surface);
    const containerStyle = getComputedStyle(container);
    const listStyle = getComputedStyle(list);
    const canvasRect = canvasElement.getBoundingClientRect();
    const rootRect = root.getBoundingClientRect();
    const railBodyRect = railBody.getBoundingClientRect();
    const expectedLines = String(args.lines ?? 1);
    if (
      root.dataset.surface !== "card" ||
      root.dataset.lines !== expectedLines ||
      root.dataset.hasTitle !== undefined ||
      title ||
      canvasElement.querySelector('[data-slot="shortcut-rail-progress"]') ||
      Math.abs(rootRect.width - (canvasRect.width - 16)) > 1 ||
      Math.abs(rootRect.left - canvasRect.left - 8) > 1 ||
      rootStyle.borderRadius !== "12px" ||
      surfaceStyle.borderRadius !== "12px" ||
      surfaceStyle.boxShadow !== "none" ||
      Math.abs(railBodyRect.left - rootRect.left) > 1 ||
      Math.abs(railBodyRect.right - rootRect.right) > 1 ||
      railBody.parentElement !== container ||
      containerStyle.padding !== "8px" ||
      listStyle.paddingLeft !== "8px" ||
      listStyle.paddingRight !== "8px" ||
      listStyle.paddingTop !== "0px" ||
      listStyle.paddingBottom !== "0px" ||
      listStyle.display !== (expectedLines === "2" ? "grid" : "flex")
    ) {
      throw new Error(
        `Mobile Shortcut Rail must use a title-free ${expectedLines}-line card surface`,
      );
    }
  },
};

export const MobileTwoLines: Story = {
  ...CompactViewport,
  name: "Mobile — 2 Rows",
  args: {
    surface: "card",
    lines: 2,
  },
  parameters: {
    docs: {
      description: {
        story:
          "The same title-free mobile card and entries as `Mobile — 1 Row`, with only `lines={2}` changed.",
      },
    },
  },
};
