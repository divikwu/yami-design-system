import type { Meta, StoryObj } from "@storybook/react-vite";

import { createThemeHeroProps } from "@yami/design-system/components/ThemeHero/fixtures";

import { TopicLandingPage } from "./TopicLandingPage";
import { createTopicLandingPageFixture } from "./fixtures";

const meta = {
  title: "YAMI/Pages/Topic Landing Page",
  component: TopicLandingPage,
  parameters: {
    layout: "fullscreen",
    controls: { disable: true },
    docs: {
      description: {
        component:
          "An editorial theme landing page for English-site users with a global header, ThemeHero, a ThemeProductList rail, a Standard Rail and a ProductList Waterfall collection, followed by the global footer.",
      },
      story: { inline: false, height: "2400px" },
    },
  },
  globals: {
    locale: "en",
    theme: "light",
    viewport: { value: "yamiDesktopMd", isRotated: false },
  },
  args: createTopicLandingPageFixture(),
} satisfies Meta<typeof TopicLandingPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Pc: Story = {
  name: "PC",
  play: async ({ canvasElement }) => {
    const page = canvasElement.querySelector<HTMLElement>(
      '[data-slot="topic-landing-page"]',
    );
    if (!page) throw new Error("Topic landing page did not render");

    const hero = page.querySelector('[data-slot="theme-hero"]');
    if (!hero) throw new Error("Topic landing page is missing ThemeHero");

    const expectedHero = createThemeHeroProps();
    const normalize = (value: unknown) =>
      String(value ?? "")
        .replace(/\s+/g, " ")
        .trim();
    const heading = hero.querySelector("h2");
    if (normalize(heading?.textContent) !== normalize(expectedHero.title)) {
      throw new Error("Topic landing page heading is missing");
    }

    const copy = hero.querySelector('[data-slot="theme-hero-copy"]');
    if (!copy || !normalize(copy.textContent).includes(normalize(expectedHero.description))) {
      throw new Error("Topic landing page description is out of sync with ThemeHero");
    }

    const cta = hero.querySelector("button");
    if (normalize(cta?.textContent) !== normalize(expectedHero.cta?.label)) {
      throw new Error("Topic landing page CTA is out of sync with ThemeHero");
    }

    if (page.querySelector("#explore-topics")) {
      throw new Error("Topic landing page must not render the exploration module");
    }

    if (page.querySelector('[aria-labelledby="feature-title"]')) {
      throw new Error("Topic landing page must not render the feature module");
    }

    const productLists = Array.from(
      page.querySelectorAll<HTMLElement>('[data-slot="product-list"]'),
    );
    if (
      productLists.length !== 3 ||
      productLists[0]?.dataset.layout !== "rail" ||
      productLists[1]?.dataset.layout !== "rail" ||
      productLists[2]?.dataset.layout !== "waterfall"
    ) {
      throw new Error(
        "Topic landing page must render Theme Rail, Standard Rail, then Waterfall",
      );
    }

    const standardRail = page.querySelector<HTMLElement>(
      '[data-slot="topic-landing-standard-rail"]',
    );
    if (
      !standardRail ||
      standardRail.querySelector('[data-slot="product-list"]') !==
        productLists[1]
    ) {
      throw new Error("Topic landing page must include the Standard Rail section");
    }
    const standardRailContainer = standardRail.querySelector<HTMLElement>(
      '[data-slot="product-list-container"]',
    );
    if (
      !standardRailContainer ||
      standardRailContainer.getBoundingClientRect().width > 1441
    ) {
      throw new Error(
        "Topic landing page Standard Rail content must cap at 1440px",
      );
    }
    if (
      page.getBoundingClientRect().width >= 1024 &&
      standardRail.getBoundingClientRect().width + 1 <
        page.getBoundingClientRect().width
    ) {
      throw new Error("Topic landing page Standard Rail must remain full bleed");
    }
    if (
      productLists[1]?.querySelectorAll('[data-slot="product-list-item"]')
        .length !== 6
    ) {
      throw new Error("Topic landing page Standard Rail must render six products");
    }
    const standardRailList = standardRail.querySelector<HTMLElement>(
      '[data-slot="product-list-items"]',
    );
    const standardRailItems = Array.from(
      standardRail.querySelectorAll<HTMLElement>(
        '[data-slot="product-list-item"]',
      ),
    );
    if (
      standardRailContainer.getBoundingClientRect().width >= 1439 &&
      (!standardRailList ||
        standardRailItems.filter((item) => {
          const itemRect = item.getBoundingClientRect();
          const listRect = standardRailList.getBoundingClientRect();
          return (
            itemRect.left >= listRect.left - 1 &&
            itemRect.right <= listRect.right + 1
          );
        }).length !== 6)
    ) {
      throw new Error(
        "Topic landing page Standard Rail must show six slots at 1440px",
      );
    }

    const waterfall = productLists[2];
    const waterfallContainer = waterfall?.querySelector<HTMLElement>(
      '[data-slot="product-list-container"]',
    );
    if (
      !waterfallContainer ||
      waterfallContainer.getBoundingClientRect().width > 1441
    ) {
      throw new Error(
        "Topic landing page Waterfall content must cap at 1440px",
      );
    }
    if (
      page.getBoundingClientRect().width >= 1024 &&
      waterfall &&
      waterfall.getBoundingClientRect().width + 1 <
        page.getBoundingClientRect().width
    ) {
      throw new Error("Topic landing page Waterfall must remain full bleed");
    }

    const themeProductList = page.querySelector<HTMLElement>(
      '[data-slot="theme-product-list"]',
    );
    if (
      !themeProductList ||
      !themeProductList.querySelector('[data-slot="theme-product-list-content"]') ||
      themeProductList.querySelector('[data-slot="product-list-leading-content"]') !==
        themeProductList.querySelector('[data-slot="product-list-items"]')
          ?.firstElementChild
    ) {
      throw new Error(
        "Topic landing page must lead its Standard Rail with the theme content panel",
      );
    }

    if (
      productLists.some(
        (productList) =>
          productList.querySelectorAll('[data-slot="product-card"]').length === 0,
      )
    ) {
      throw new Error("Topic landing page product lists must render products");
    }

    if (!page.querySelector('[data-slot="header"]')) {
      throw new Error("Topic landing page is missing the global header");
    }

    const footer = page.querySelector<HTMLElement>('[data-slot="footer"]');
    const isDesktop = page.getBoundingClientRect().width >= 1024;
    if (isDesktop && !footer) {
      throw new Error("Topic landing page is missing the desktop footer");
    }

    if (page.scrollWidth > page.clientWidth + 1) {
      throw new Error("Topic landing page introduces horizontal overflow");
    }
  },
};

export const Mobile: Story = {
  name: "Mobile",
  globals: {
    viewport: { value: "yamiMobile", isRotated: false },
  },
  play: Pc.play,
};
