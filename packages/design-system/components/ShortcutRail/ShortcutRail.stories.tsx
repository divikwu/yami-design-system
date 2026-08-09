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
    dividerPosition: "none",
    dividerVariant: "gray",
  },
} satisfies Meta<typeof ShortcutRail>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Showcase: Story = {
  render: (args, { globals }) => {
    const locale = localeFromGlobals(globals.locale);
    return (
      <ShortcutRail
        {...getProps(locale)}
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

export const TitledGray: Story = {
  name: "Titled — Gray Surface",
  args: {
    dividerPosition: "bottom",
    dividerVariant: "black",
  },
  render: (args, { globals }) => {
    const locale = localeFromGlobals(globals.locale);
    return (
      <ShortcutRail
        {...getProps(locale)}
        title={locale === "en" ? "Featured shortcuts" : "热门分类"}
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
    const title = canvasElement.querySelector<HTMLElement>(
      '[data-slot="shortcut-rail-title"]',
    );
    const railBody = canvasElement.querySelector<HTMLElement>(
      '[data-slot="shortcut-rail-body"]',
    );
    const list = canvasElement.querySelector<HTMLElement>(
      '[data-slot="shortcut-rail-list"]',
    );
    const iconSurface = canvasElement.querySelector<HTMLElement>(
      '[data-slot="shortcut-rail-link"] > span',
    );
    if (
      !root ||
      !surface ||
      !container ||
      !title ||
      !railBody ||
      !list ||
      !iconSurface
    ) {
      throw new Error("Titled Shortcut Rail must render its title and list");
    }
    const rootStyle = getComputedStyle(root);
    const surfaceStyle = getComputedStyle(surface);
    const containerStyle = getComputedStyle(container);
    const titleStyle = getComputedStyle(title);
    const listStyle = getComputedStyle(list);
    const iconSurfaceStyle = getComputedStyle(iconSurface);
    if (
      root.dataset.hasTitle !== "true" ||
      root.dataset.dividerPosition !== "bottom" ||
      root.dataset.dividerVariant !== "black" ||
      surface.parentElement !== root ||
      container.parentElement !== surface ||
      surfaceStyle.width !== rootStyle.width ||
      surfaceStyle.borderTopWidth !== "0px" ||
      surfaceStyle.borderBottomWidth !== "2px" ||
      title.parentElement !== container ||
      railBody.parentElement !== container ||
      containerStyle.maxWidth !== "1920px" ||
      containerStyle.marginLeft !== containerStyle.marginRight ||
      containerStyle.paddingTop !== "32px" ||
      containerStyle.paddingBottom !== "32px" ||
      containerStyle.paddingLeft !== "48px" ||
      containerStyle.paddingRight !== "48px" ||
      title.textContent?.trim().length === 0 ||
      titleStyle.textAlign !== "left" ||
      titleStyle.fontWeight !== "400" ||
      titleStyle.padding !== "0px" ||
      listStyle.justifyContent !== "flex-start" ||
      listStyle.padding !== "0px" ||
      surfaceStyle.backgroundColor === "rgba(0, 0, 0, 0)" ||
      iconSurfaceStyle.backgroundColor === surfaceStyle.backgroundColor
    ) {
      throw new Error("Titled Shortcut Rail must be left aligned on a gray surface");
    }
  },
};

export const FullBleedImages: Story = {
  name: "Full-bleed Images",
  globals: {
    viewport: { value: "yamiMobile", isRotated: false },
  },
  render: (args, { globals }) => {
    const locale = localeFromGlobals(globals.locale);
    const props = getProps(locale);
    return (
      <ShortcutRail
        {...props}
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
      !list ||
      !rootRect ||
      !railBodyRect ||
      !listStyle ||
      root.dataset.railPresentation !== "full-bleed" ||
      canvasElement.querySelector('[data-slot="shortcut-rail-progress"]') ||
      getComputedStyle(root).overflow !== "hidden" ||
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
  name: "Mobile — 1 Line",
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
          "Below 1024px the rail keeps a full-width plain surface with smaller entries, a paging thumb instead of edge buttons, and a width that divides the rail by `min(5, max(4, count))` — so a long list always breaks the fifth entry at the edge.",
      },
    },
  },
  render: (args, { globals }) => {
    const locale = localeFromGlobals(globals.locale);
    return (
      <ShortcutRail
        {...getProps(locale)}
        title={locale === "en" ? "Featured shortcuts" : "热门分类"}
        dividerPosition={args.dividerPosition}
        dividerVariant={args.dividerVariant}
      />
    );
  },
  play: async ({ canvasElement }) => {
    const root = canvasElement.querySelector<HTMLElement>(
      '[data-slot="shortcut-rail"]',
    );
    const title = canvasElement.querySelector<HTMLElement>(
      '[data-slot="shortcut-rail-title"]',
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
    if (!root || !container || !title || !railBody || !list) {
      throw new Error("Mobile Shortcut Rail did not render");
    }
    const rootStyle = getComputedStyle(root);
    const containerStyle = getComputedStyle(container);
    const titleStyle = getComputedStyle(title);
    const listStyle = getComputedStyle(list);
    if (
      root.dataset.mobileSurface !== "plain" ||
      Math.abs(
        root.getBoundingClientRect().width -
          canvasElement.getBoundingClientRect().width,
      ) > 1 ||
      rootStyle.marginLeft !== "0px" ||
      rootStyle.marginRight !== "0px" ||
      rootStyle.borderRadius !== "0px" ||
      title.parentElement !== container ||
      railBody.parentElement !== container ||
      containerStyle.paddingLeft !== "16px" ||
      containerStyle.paddingRight !== "16px" ||
      containerStyle.paddingTop !== "16px" ||
      containerStyle.paddingBottom !== "16px" ||
      titleStyle.paddingLeft !== "0px" ||
      titleStyle.paddingRight !== "0px" ||
      titleStyle.paddingTop !== "0px" ||
      titleStyle.paddingBottom !== "0px" ||
      listStyle.paddingLeft !== "0px" ||
      listStyle.paddingRight !== "0px" ||
      listStyle.paddingTop !== "0px" ||
      listStyle.paddingBottom !== "0px"
    ) {
      throw new Error(
        "Mobile Shortcut Rail must use the full-width plain surface",
      );
    }
  },
};

export const MobileTwoLines: Story = {
  name: "Mobile — 2 Lines",
  globals: {
    viewport: { value: "yamiMobile", isRotated: false },
  },
  parameters: {
    docs: {
      description: {
        story:
          "`lines={2}` flows the same entries into a two-row grid that pages as one block, so a long list stays a single swipe deep rather than a long scroll.",
      },
    },
  },
  render: (args, { globals }) => {
    const locale = localeFromGlobals(globals.locale);
    return (
      <ShortcutRail
        {...getProps(locale)}
        lines={2}
        dividerPosition={args.dividerPosition}
        dividerVariant={args.dividerVariant}
      />
    );
  },
};
