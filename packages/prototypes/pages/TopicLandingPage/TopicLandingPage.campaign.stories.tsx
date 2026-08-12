import type { Meta, StoryObj } from "@storybook/react-vite";

import { TopicLandingPage } from "./TopicLandingPage";
import { createCampaignTopicLandingPageFixture } from "./campaign.fixtures";

const meta = {
  title: "YAMI/Pages/Topic Landing Page/Campaign",
  component: TopicLandingPage,
  parameters: {
    layout: "fullscreen",
    controls: { disable: true },
    docs: {
      description: {
        component:
          "The campaign presentation of Topic Landing Page. It currently copies Brand content and has an independent fixture entry for later maintenance.",
      },
      story: { inline: false, height: "2400px" },
    },
  },
  globals: {
    theme: "light",
    viewport: { value: "yamiDesktopMd", isRotated: false },
  },
  args: createCampaignTopicLandingPageFixture(),
  render: (args, { globals }) => {
    const locale = globals.locale === "zh" ? "zh" : "en";
    const localizedArgs = createCampaignTopicLandingPageFixture(locale);

    return (
      <TopicLandingPage
        {...localizedArgs}
        contentMaxWidth={args.contentMaxWidth}
        titleFontFamily={args.titleFontFamily}
      />
    );
  },
} satisfies Meta<typeof TopicLandingPage>;

export default meta;
type Story = StoryObj<typeof meta>;

function assertBrandRailTitleFont(canvasElement: HTMLElement) {
  const main = canvasElement.querySelector<HTMLElement>(
    '[data-slot="topic-landing-main"]',
  );
  const title = canvasElement.querySelector<HTMLElement>(
    '[data-slot="brand-product-rail"] h2',
  );
  const style = title ? getComputedStyle(title) : null;

  if (
    !main ||
    !style ||
    (main.dataset.titleFontFamily === "serif"
      ? !style.fontFamily.includes("Source Serif 4") ||
        style.fontWeight !== "600"
      : style.fontFamily.includes("Source Serif 4") ||
        style.fontWeight !== "400")
  ) {
    throw new Error(
      "Campaign Brand Product Rail title must follow the page title font family",
    );
  }
}

function assertCampaignBrandTitlesAreVisible(canvasElement: HTMLElement) {
  const brandRail = canvasElement.querySelector<HTMLElement>(
    '[data-slot="topic-landing-brand-rail"]',
  );
  const brandPanels = brandRail?.querySelectorAll<HTMLElement>(
    '[data-slot="brand-product-rail-campaign"]',
  );

  if (!brandRail || !brandPanels?.length) {
    throw new Error("Campaign Brand Product Rail titles did not render");
  }

  for (const brandPanel of brandPanels) {
    const brandBanner = brandPanel.querySelector<HTMLElement>(
      '[data-slot="product-list-banner"]',
    );
    const brandTitle = brandPanel.querySelector<HTMLElement>(
      '[data-slot="product-list-title"]',
    );
    if (!brandBanner || !brandTitle) {
      throw new Error("Campaign brand panel title anatomy did not render");
    }

    const bannerBounds = brandBanner.getBoundingClientRect();
    const titleBounds = brandTitle.getBoundingClientRect();
    if (
      titleBounds.width <= 0 ||
      titleBounds.height <= 0 ||
      titleBounds.top < bannerBounds.top ||
      titleBounds.bottom > bannerBounds.bottom
    ) {
      throw new Error(
        "Campaign brand titles must remain inside their visible banners",
      );
    }
  }
}

export const Pc: Story = {
  name: "Campaign — PC",
  play: async ({ canvasElement }) => {
    assertBrandRailTitleFont(canvasElement);
    assertCampaignBrandTitlesAreVisible(canvasElement);
  },
};

export const Mobile: Story = {
  name: "Campaign — Mobile",
  globals: {
    viewport: { value: "yamiMobile", isRotated: false },
  },
  play: async ({ canvasElement }) => {
    assertBrandRailTitleFont(canvasElement);
    assertCampaignBrandTitlesAreVisible(canvasElement);
    const popularPicks = canvasElement.querySelector<HTMLElement>(
      '[data-slot="topic-landing-standard-rail"]',
    );
    const brandRail = canvasElement.querySelector<HTMLElement>(
      '[data-slot="topic-landing-brand-rail"]',
    );
    const brandRailRoot = brandRail?.querySelector<HTMLElement>(
      '[data-slot="brand-product-rail"]',
    );
    if (
      !popularPicks ||
      !brandRail ||
      popularPicks.nextElementSibling !== brandRail ||
      brandRailRoot?.dataset.mobileSurface !== "plain"
    ) {
      throw new Error(
        "Campaign must place a plain Brand Product Rail after Popular Picks",
      );
    }
  },
};
