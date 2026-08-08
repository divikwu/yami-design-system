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
          "An editorial theme landing page for English-site users with a global header, ThemeHero, ThemeProductList, ReviewList, a Standard Rail and a ProductList Waterfall collection, followed by the global footer.",
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

    if (hero.querySelector("button")) {
      throw new Error("Topic landing page must not render a hero CTA");
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

    for (const productList of productLists.filter(
      (list) => list.dataset.layout === "rail",
    )) {
      const items = productList.querySelector<HTMLElement>(
        '[data-slot="product-list-items"]',
      );
      const navigation = productList.querySelector(
        '[data-slot="rail-navigation"]',
      );
      if (
        items &&
        items.scrollWidth <= items.clientWidth + 1 &&
        navigation
      ) {
        throw new Error(
          "Topic landing page must hide rail navigation when all content fits",
        );
      }
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
    if (
      productLists[1]?.querySelector('[data-slot="product-list-view-all"]') ||
      productLists[1]?.querySelector('[data-slot="product-list-view-all-mobile"]')
    ) {
      throw new Error(
        "Topic landing page Standard Rail must hide view-all without a destination",
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

    const loadMoreButton = waterfall?.querySelector<HTMLElement>(
      '[data-slot="product-list-load-more"] > button',
    );
    if (
      page.getBoundingClientRect().width >= 1024 &&
      loadMoreButton?.getBoundingClientRect().height !== 48
    ) {
      throw new Error(
        "Topic landing page desktop Load more button must be 48px high",
      );
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

    const reviewList = page.querySelector<HTMLElement>(
      '[data-slot="review-list"]',
    );
    const reviewSection = page.querySelector<HTMLElement>(
      '[data-slot="topic-landing-review-list"]',
    );
    const reviewCards = reviewList?.querySelectorAll<HTMLElement>(
      '[data-slot="review-card"]',
    );
    const reviewItems = reviewList?.querySelectorAll<HTMLElement>(
      '[data-slot="review-list-items"] > li',
    );
    const reviewItemsList = reviewList?.querySelector<HTMLElement>(
      '[data-slot="review-list-items"]',
    );
    const reviewContainer = reviewList?.querySelector<HTMLElement>(
      '[data-slot="review-list-container"]',
    );
    if (
      !reviewList ||
      !reviewSection ||
      !reviewCards ||
      reviewCards.length !== 3 ||
      !reviewItems ||
      reviewItems.length !== 3 ||
      !reviewItemsList ||
      !reviewContainer ||
      !reviewList.textContent?.includes("It feels so gentle") ||
      reviewList.querySelector('[data-slot="review-list-view-all-mobile"]')
    ) {
      throw new Error(
        "Topic landing page ReviewList must reuse the component content without a view-all action",
      );
    }
    if (
      reviewSection.querySelector('[data-slot="review-list"]') !== reviewList ||
      reviewContainer.getBoundingClientRect().width > 1441
    ) {
      throw new Error(
        "Topic landing page ReviewList content must cap at 1440px",
      );
    }
    const reviewGap = getComputedStyle(reviewContainer).rowGap;
    const firstReviewCard = reviewCards[0];
    if (page.getBoundingClientRect().width < 1024) {
      const reviewItemsStyle = getComputedStyle(reviewItemsList);
      if (
        reviewGap !== "8px" ||
        reviewItemsStyle.paddingTop !== "0px" ||
        reviewItemsStyle.paddingBottom !== "0px" ||
        firstReviewCard.getBoundingClientRect().width !== 344 ||
        getComputedStyle(firstReviewCard).borderRadius !== "8px"
      ) {
        throw new Error(
          "Topic landing page ReviewList mobile layout must match the shared ReviewList/ProductList geometry",
        );
      }
    } else {
      if (
        reviewGap !== "16px" ||
        getComputedStyle(firstReviewCard).borderRadius !== "8px"
      ) {
        throw new Error(
          "Topic landing page ReviewList desktop must preserve its 16px gap and desktop radius",
        );
      }

      const itemGap = Number.parseFloat(getComputedStyle(reviewItemsList).gap);
      const expectedItemWidth =
        (reviewItemsList.getBoundingClientRect().width - itemGap * 2) / 3;
      if (
        Math.abs(
          reviewItems[0].getBoundingClientRect().width - expectedItemWidth,
        ) > 1
      ) {
        throw new Error(
          "Topic landing page ReviewList must show three card slots within its 1440px content width",
        );
      }
    }

    if (
      productLists.some(
        (productList) =>
          productList.querySelectorAll('[data-slot="product-card"]').length === 0,
      )
    ) {
      throw new Error("Topic landing page product lists must render products");
    }

    const footer = page.querySelector<HTMLElement>('[data-slot="footer"]');
    const isDesktop = page.getBoundingClientRect().width >= 1024;
    const activityHeader = page.querySelector<HTMLElement>(
      '[data-slot="activity-page-header"]',
    );
    const globalHeader = page.querySelector<HTMLElement>(
      '[data-slot="topic-landing-global-header"]',
    );
    if (!activityHeader || !globalHeader) {
      throw new Error("Topic landing page is missing its responsive navigation");
    }
    if (isDesktop) {
      if (
        getComputedStyle(activityHeader.parentElement!).display !== "none" ||
        getComputedStyle(globalHeader).display === "none"
      ) {
        throw new Error("Desktop topic landing page must retain the global header");
      }
    } else {
      if (
        getComputedStyle(activityHeader.parentElement!).display === "none" ||
        getComputedStyle(globalHeader).display !== "none" ||
        activityHeader.querySelector('[data-slot="activity-page-header-title"]')
          ?.textContent !== "Anua"
      ) {
        throw new Error("Mobile topic landing page must use the Anua activity header");
      }
      if (Math.round(activityHeader.getBoundingClientRect().height) !== 56) {
        throw new Error("Mobile topic landing activity header must be 56px high");
      }

      const mobileSurfaceSections = [...productLists, reviewList];
      if (
        mobileSurfaceSections.some(
          (section) =>
            section.dataset.mobileSurface !== "plain" ||
            section.dataset.dividerPosition !== "top" ||
            section.dataset.dividerVariant !== "gray" ||
            getComputedStyle(section).borderTopWidth !== "1px",
        )
      ) {
        throw new Error(
          "Topic landing page mobile content sections must use the plain surface with a top gray divider",
        );
      }
    }
    const activeHeader = isDesktop
      ? globalHeader
      : activityHeader.parentElement!;
    const activeHeaderStyle = getComputedStyle(activeHeader);
    if (
      activeHeaderStyle.position !== "sticky" ||
      activeHeaderStyle.top !== "0px" ||
      activeHeaderStyle.zIndex !== "10"
    ) {
      throw new Error(
        "Topic landing navigation must remain sticky above page content",
      );
    }
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
