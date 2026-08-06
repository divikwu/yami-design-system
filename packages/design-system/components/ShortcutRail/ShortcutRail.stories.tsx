import type { Meta, StoryObj } from "@storybook/react-vite";

import { ShortcutRail } from "./ShortcutRail";
import storyStyles from "./ShortcutRail.stories.module.css";
import type {
  ShortcutRailProps,
} from "./ShortcutRail.types";
import {
  createShortcutItems,
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
  args: getProps("zh"),
} satisfies Meta<typeof ShortcutRail>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Showcase: Story = {
  render: (_args, { globals }) => {
    const locale = localeFromGlobals(globals.locale);
    return <ShortcutRail {...getProps(locale)} />;
  },
  play: async ({ canvasElement }) => {
    const list = canvasElement.querySelector<HTMLElement>(
      '[data-slot="shortcut-rail-list"]',
    );
    if (!list) throw new Error("Shortcut rail list did not render");

    const links = canvasElement.querySelectorAll(
      '[data-slot="shortcut-rail-link"]',
    );
    if (links.length !== 23) {
      throw new Error(`Expected 23 shortcut links, got ${links.length}`);
    }

    const listStyle = getComputedStyle(list);
    if (
      listStyle.paddingTop !== "24px" ||
      listStyle.paddingBottom !== "24px"
    ) {
      throw new Error(
        `Shortcut rail must use 24px block padding, got ${listStyle.paddingTop} ${listStyle.paddingBottom}`,
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
          "Below 1024px the rail becomes the mobile card from Figma `3183:34141`: smaller entries, a paging thumb instead of edge buttons, and a width that divides the card by `min(5, max(4, count))` — so a long list always breaks the fifth entry at the edge.",
      },
    },
  },
  render: (_args, { globals }) => {
    const locale = localeFromGlobals(globals.locale);
    return <ShortcutRail {...getProps(locale)} />;
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
  render: (_args, { globals }) => {
    const locale = localeFromGlobals(globals.locale);
    return <ShortcutRail {...getProps(locale)} lines={2} />;
  },
};
