import type { Meta, StoryObj } from "@storybook/react-vite";

import { createEcommerceHomeFixture } from "../EcommerceHome/fixtures";
import { TopicLandingPage } from "./TopicLandingPage";
import { createTopicKeywordLandingPageFixture } from "./topic.fixtures";

const meta = {
  title: "YAMI/Pages/Topic Landing Page/Topic",
  component: TopicLandingPage,
  parameters: {
    layout: "fullscreen",
    controls: { disable: true },
    docs: {
      description: {
        component:
          "The topic-keyword presentation of Topic Landing Page, demonstrated with a Matcha journey across powders, lattes, snacks, sweets, tools, brands, and editorial guidance.",
      },
      story: { inline: false, height: "2400px" },
    },
  },
  globals: {
    theme: "light",
    viewport: { value: "yamiDesktopMd", isRotated: false },
  },
  args: createTopicKeywordLandingPageFixture(),
  render: (args, { globals }) => {
    const locale = globals.locale === "zh" ? "zh" : "en";
    const localizedArgs = createTopicKeywordLandingPageFixture(locale);

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

function assertPlainShortcutRail(canvasElement: HTMLElement) {
  const shortcutRail = canvasElement.querySelector<HTMLElement>(
    '[data-slot="shortcut-rail"]',
  );
  if (shortcutRail?.dataset.surface !== "plain") {
    throw new Error("Matcha Topic must use the plain Shortcut Rail surface");
  }
}

export const Pc: Story = {
  name: "Topic — PC",
  play: async ({ canvasElement, globals }) => {
    assertPlainShortcutRail(canvasElement);
    const locale = globals.locale === "zh" ? "zh" : "en";
    const topicSearchPanel =
      createTopicKeywordLandingPageFixture(locale).header.searchPanel;
    const homeSearchPanel =
      createEcommerceHomeFixture(locale).header.searchPanel;
    const homeLink = canvasElement.querySelector<HTMLAnchorElement>(
      '[data-slot="header-brand"]',
    );
    if (
      !homeLink?.href.includes("yami-pages-ecommerce-home--pc") ||
      JSON.stringify(topicSearchPanel) !== JSON.stringify(homeSearchPanel)
    ) {
      throw new Error(
        "Matcha Topic must reuse Ecommerce Home header search data",
      );
    }
  },
};

export const Mobile: Story = {
  name: "Topic — Mobile",
  globals: {
    viewport: { value: "yamiMobile", isRotated: false },
  },
  play: async ({ canvasElement }) => {
    assertPlainShortcutRail(canvasElement);
    const heroHeading = canvasElement.querySelector("h1, h2");
    const heroText = heroHeading?.textContent?.toLowerCase() ?? "";
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
      (!heroText.includes("matcha") && !heroText.includes("抹茶")) ||
      popularPicks.nextElementSibling !== brandRail ||
      brandRailRoot?.dataset.mobileSurface !== "plain"
    ) {
      throw new Error(
        "Matcha Topic must place a plain Brand Product Rail after Popular Picks",
      );
    }
  },
};
