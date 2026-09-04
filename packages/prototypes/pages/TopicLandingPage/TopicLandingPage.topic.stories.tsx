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

function assertTopicShortcutRail(canvasElement: HTMLElement) {
  const shortcutRail = canvasElement.querySelector<HTMLElement>(
    '[data-slot="shortcut-rail"]',
  );
  if (
    shortcutRail?.dataset.surface !== "plain" ||
    shortcutRail.dataset.presentation !== "image-card"
  ) {
    throw new Error(
      "Matcha Topic must enable count-aware image cards on the plain Shortcut Rail surface",
    );
  }
}

export const Pc: Story = {
  name: "Topic — PC",
  play: async ({ canvasElement, globals }) => {
    assertTopicShortcutRail(canvasElement);
    const locale = globals.locale === "zh" ? "zh" : "en";
    const topicFixture = createTopicKeywordLandingPageFixture(locale);
    const topicSearchPanel = topicFixture.header.searchPanel;
    const homeSearchPanel =
      createEcommerceHomeFixture(locale).header.searchPanel;
    const homeLink = canvasElement.querySelector<HTMLAnchorElement>(
      '[data-slot="header-brand"]',
    );
    const brandCampaigns = topicFixture.brandRail?.campaigns ?? [];
    const brandRail = canvasElement.querySelector<HTMLElement>(
      '[data-slot="brand-product-rail"]',
    );
    const brandList = brandRail?.querySelector<HTMLElement>(
      '[data-slot="brand-product-rail-list"]',
    );
    const brandPanels = brandList?.querySelectorAll<HTMLElement>(
      '[data-slot="brand-product-rail-campaign"]',
    );
    const brandTitleLinks = canvasElement.querySelectorAll<HTMLAnchorElement>(
      '[data-slot="brand-product-rail-campaign"] [data-slot="product-list-title"] a',
    );
    const listWidth = brandList?.getBoundingClientRect().width ?? 0;
    const firstPanel = brandPanels?.item(0).getBoundingClientRect();
    const lastPanel = brandPanels?.item(brandPanels.length - 1).getBoundingClientRect();
    const filledWidth =
      firstPanel && lastPanel ? lastPanel.right - firstPanel.left : 0;
    if (
      !homeLink?.href.includes("yami-pages-ecommerce-home--pc") ||
      JSON.stringify(topicSearchPanel) !== JSON.stringify(homeSearchPanel) ||
      brandCampaigns.length !== 2 ||
      brandPanels?.length !== 2 ||
      Math.abs(filledWidth - listWidth) > 1 ||
      brandRail?.querySelector('[data-slot="rail-navigation"]') ||
      brandTitleLinks.length !== brandCampaigns.length ||
      canvasElement.querySelector(
        '[data-slot="brand-product-rail-campaign"] [data-slot="product-card-brand"]',
      ) ||
      Array.from(brandTitleLinks).some(
        (link) => {
          const arrow = link.querySelector<SVGElement>(
            '[data-slot="brand-product-rail-title-arrow"]',
          );
          const arrowStyle = arrow ? getComputedStyle(arrow) : null;
          return (
            link.textContent?.includes("›") ||
            !arrowStyle ||
            arrowStyle.width !== "16px" ||
            arrowStyle.height !== "16px"
          );
        },
      ) ||
      brandCampaigns.some(
        (campaign) =>
          !campaign.href ||
          campaign.products.some((product) => product.brandHref !== campaign.href),
      )
    ) {
      throw new Error(
        "Matcha Topic must reuse Ecommerce Home search data and link each brand campaign to its product brand destination",
      );
    }
  },
};

export const HeroLoading: Story = {
  name: "Hero Loading — PC",
  tags: ["!test", "!autodocs"],
  play: async ({ canvasElement }) => {
    const media = canvasElement.querySelector<HTMLElement>(
      '[data-slot="theme-hero-media"]',
    );
    const image = media?.querySelector<HTMLImageElement>("img");
    if (!media || !image) {
      throw new Error("Matcha Topic Hero artwork did not render");
    }

    image.dataset.imageState = "pending";
    await new Promise<void>((resolve) =>
      requestAnimationFrame(() => resolve()),
    );

    const tokenProbe = document.createElement("span");
    tokenProbe.style.backgroundColor = "var(--fill-tertiary)";
    document.body.append(tokenProbe);
    const placeholderColor = getComputedStyle(tokenProbe).backgroundColor;
    tokenProbe.remove();
    const mediaStyle = getComputedStyle(media);
    if (
      mediaStyle.backgroundColor !== placeholderColor ||
      mediaStyle.borderRadius !== "8px"
    ) {
      throw new Error(
        "PC ThemeHero loading simulation must show the tertiary gray placeholder with an 8px radius",
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
    assertTopicShortcutRail(canvasElement);
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
