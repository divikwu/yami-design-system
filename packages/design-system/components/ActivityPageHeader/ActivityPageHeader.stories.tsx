import type { Meta, StoryObj } from "@storybook/react-vite";

import { ActivityPageHeader } from "./ActivityPageHeader";

const meta = {
  title: "YAMI/Components/Navigation/Activity Page Header",
  component: ActivityPageHeader,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Mobile H5 navigation for campaign and editorial landing pages: approved YAMI lockup, one-line page title, search and cart actions. Matches Figma H5 Page8 (7592:65365).",
      },
    },
  },
  globals: {
    locale: "en",
    theme: "light",
    viewport: { value: "yamiMobileLg", isRotated: false },
  },
  args: {
    title: "Title",
    homeHref: "#home",
    onSearch: () => {},
    onCart: () => {},
  },
} satisfies Meta<typeof ActivityPageHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Showcase: Story = {
  play: async ({ canvasElement }) => {
    const root = canvasElement.querySelector<HTMLElement>(
      '[data-slot="activity-page-header"]',
    );
    const bar = canvasElement.querySelector<HTMLElement>(
      '[data-slot="activity-page-header-bar"]',
    );
    const logo = canvasElement.querySelector<HTMLImageElement>(
      '[data-slot="activity-page-header-brand"] img',
    );
    const title = canvasElement.querySelector<HTMLElement>(
      '[data-slot="activity-page-header-title"]',
    );
    const actions = canvasElement.querySelectorAll<HTMLElement>(
      '[data-slot="activity-page-header-actions"] button',
    );

    if (!root || !bar || !logo || !title || actions.length !== 2) {
      throw new Error("ActivityPageHeader did not render its full anatomy");
    }
    if (
      Math.round(root.getBoundingClientRect().width) !== 402 ||
      Math.round(bar.getBoundingClientRect().height) !== 56
    ) {
      throw new Error("ActivityPageHeader must match the 402x56 Figma frame");
    }
    if (
      Math.round(logo.getBoundingClientRect().width) !== 84 ||
      Math.round(logo.getBoundingClientRect().height) !== 32
    ) {
      throw new Error("ActivityPageHeader must use the 84x32 Mobile Logo-UI lockup");
    }
    if (
      getComputedStyle(title).fontSize !== "18px" ||
      getComputedStyle(title).lineHeight !== "24px" ||
      title.textContent !== "Title"
    ) {
      throw new Error("ActivityPageHeader title must use the heading-md contract");
    }
    for (const action of actions) {
      const box = action.getBoundingClientRect();
      if (Math.round(box.width) !== 40 || Math.round(box.height) !== 40) {
        throw new Error("ActivityPageHeader actions must render at 40x40");
      }
      const icon = action.firstElementChild as HTMLElement | null;
      if (!icon || getComputedStyle(icon).maskImage === "none") {
        throw new Error("ActivityPageHeader actions must use maintained icon assets");
      }
    }
    if (root.scrollWidth > root.clientWidth) {
      throw new Error("ActivityPageHeader must not introduce horizontal overflow");
    }
  },
};
