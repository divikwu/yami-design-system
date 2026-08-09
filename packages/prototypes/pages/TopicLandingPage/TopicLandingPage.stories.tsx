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
          "A localized editorial theme landing page with a global header, ThemeHero, a full-bleed ShortcutRail, ThemeProductList, ReviewList, a Standard Rail and a ProductList Waterfall collection, followed by the global footer.",
      },
      story: { inline: false, height: "2400px" },
    },
  },
  argTypes: {
    contentMaxWidth: {
      control: { type: "number", min: 320, step: 8 },
      description:
        "Shared maximum width for all content containers inside main. Header and Footer are excluded.",
    },
    titleFontFamily: {
      control: "inline-radio",
      options: ["sans", "serif"],
      description:
        "Shared font family for the ThemeHero title and every module title inside main.",
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
  play: async ({ canvasElement, args, globals }) => {
    const locale = globals.locale === "zh" ? "zh" : "en";
    const localizedExpectation =
      locale === "zh"
        ? {
            heroTitle: "Anua：温和有效的韩系护肤",
            heroDescription: "Anua 甄选亲肤天然成分",
            firstShortcut: "粮油调味",
            lastShortcut: "母婴玩具",
            firstReview: "温和又干净，洗完很舒服",
            activityTitle: "艾努雅",
            firstTab: "精选分类",
          }
        : {
            heroTitle: "Anua: Gentle yet Effective Korean Skincare",
            heroDescription:
              "Anua pairs skin-friendly natural ingredients with focused actives",
            firstShortcut: "Grocery",
            lastShortcut: "Toys , Kids, Babies",
            firstReview: "It feels so gentle and still gets all the gunk out",
            activityTitle: "Anua",
            firstTab: "Featured shortcuts",
          };
    const page = canvasElement.querySelector<HTMLElement>(
      '[data-slot="topic-landing-page"]',
    );
    if (!page || page.lang !== locale) {
      throw new Error("Topic landing page must expose its content language");
    }

    const main = page.querySelector<HTMLElement>(
      '[data-slot="topic-landing-main"]',
    );
    const initialReveal = main?.querySelector<HTMLElement>(
      '[data-motion-reveal="initial"]',
    );
    const scrollReveals = main?.querySelectorAll<HTMLElement>(
      '[data-motion-reveal="scroll"]',
    );
    const waterfallRowItems = main?.querySelectorAll<HTMLElement>(
      '[data-motion-reveal="waterfall-row"]',
    );
    const waterfallLoadMore = main?.querySelector<HTMLElement>(
      '[data-slot="product-list-load-more"]',
    );
    if (
      !initialReveal ||
      scrollReveals?.length !== 2 ||
      !waterfallRowItems ||
      waterfallRowItems.length <= 6 ||
      waterfallLoadMore?.dataset.motionReveal !== "waterfall-row" ||
      main?.dataset.motionReady === undefined
    ) {
      throw new Error(
        "Topic landing page must expose initial, section and waterfall row reveal groups",
      );
    }
    const contentContainers = main?.querySelectorAll<HTMLElement>(
      '[data-slot="theme-hero-container"], [data-slot="topic-landing-tabs-container"], [data-slot="shortcut-rail-container"], [data-slot="review-list-container"], [data-slot="product-list-container"]',
    );
    const expectedContentMaxWidth =
      typeof args.contentMaxWidth === "number"
        ? `${args.contentMaxWidth}px`
        : (args.contentMaxWidth ?? "1440px");
    const resolvedContentMaxWidth = contentContainers?.[0]
      ? getComputedStyle(contentContainers[0]).maxWidth
      : undefined;
    const resolvedContentMaxWidthPx = Number.parseFloat(
      resolvedContentMaxWidth ?? "",
    );
    if (
      !main ||
      main.dataset.contentMaxWidth !== expectedContentMaxWidth ||
      contentContainers?.length !== 7 ||
      !resolvedContentMaxWidth ||
      (typeof args.contentMaxWidth === "number" &&
        resolvedContentMaxWidth !== expectedContentMaxWidth) ||
      Array.from(contentContainers).some(
        (container) =>
          getComputedStyle(container).maxWidth !== resolvedContentMaxWidth,
      )
    ) {
      throw new Error(
        `Topic landing page main content containers must share the page-level ${expectedContentMaxWidth} maximum width`,
      );
    }

    const hero = page.querySelector('[data-slot="theme-hero"]');
    if (!hero) throw new Error("Topic landing page is missing ThemeHero");
    const heroForeground = hero.querySelector<HTMLImageElement>(
      '[data-slot="theme-hero-media"] img',
    );
    const heroAtmosphere = hero.querySelector<HTMLImageElement>(
      '[data-slot="theme-hero-atmosphere"] img',
    );
    if (
      !heroForeground?.src.includes("anua-hero.webp") ||
      heroForeground.fetchPriority !== "high" ||
      !heroAtmosphere?.src.includes("anua-hero-atmosphere.webp") ||
      heroAtmosphere.fetchPriority !== "low"
    ) {
      throw new Error(
        "Topic landing Hero must prioritize an optimized foreground and use a lightweight atmosphere image",
      );
    }

    const shortcutRail = page.querySelector<HTMLElement>(
      '[data-slot="topic-landing-shortcut-rail"]',
    );
    const primaryTabs = page.querySelector<HTMLElement>(
      '[data-slot="topic-landing-tabs"]',
    );
    const primaryTabsList = primaryTabs?.querySelector<HTMLElement>(
      '[data-slot="tabs-list"]',
    );
    const primaryTabsContainer = primaryTabs?.querySelector<HTMLElement>(
      '[data-slot="topic-landing-tabs-container"]',
    );
    const activePrimaryTab = primaryTabs?.querySelector<HTMLElement>(
      '[data-slot="tabs-trigger"][data-state="active"]',
    );
    const primaryTabsStyle = primaryTabs ? getComputedStyle(primaryTabs) : null;
    const primaryTabsContainerStyle = primaryTabsContainer
      ? getComputedStyle(primaryTabsContainer)
      : null;
    const isDesktopTabs = page.getBoundingClientRect().width >= 1024;
    if (
      !primaryTabs ||
      !primaryTabsList ||
      !primaryTabsContainer ||
      !primaryTabsStyle ||
      !primaryTabsContainerStyle ||
      primaryTabsList.dataset.variant !== "primary" ||
      primaryTabsList.dataset.style !== "a" ||
      activePrimaryTab?.textContent !== localizedExpectation.firstTab ||
      primaryTabsStyle.maxWidth !== "none" ||
      primaryTabsStyle.marginLeft !== "0px" ||
      primaryTabsStyle.marginRight !== "0px" ||
      primaryTabsStyle.paddingLeft !== "0px" ||
      primaryTabsStyle.paddingRight !== "0px" ||
      primaryTabsContainerStyle.maxWidth !== resolvedContentMaxWidth ||
      primaryTabsContainerStyle.paddingLeft !==
        (isDesktopTabs ? "48px" : "0px") ||
      primaryTabsContainerStyle.paddingRight !==
        (isDesktopTabs ? "48px" : "0px") ||
      (typeof args.contentMaxWidth === "number" &&
        primaryTabsContainer.getBoundingClientRect().width >
          args.contentMaxWidth + 1) ||
      !shortcutRail ||
      primaryTabs.compareDocumentPosition(shortcutRail) !==
        Node.DOCUMENT_POSITION_FOLLOWING
    ) {
      throw new Error(
        "Topic landing page must render localized Primary Style A tabs immediately before Featured shortcuts",
      );
    }
    const themeProductList = page.querySelector<HTMLElement>(
      '[data-slot="theme-product-list"]',
    );
    const shortcutLinks = shortcutRail?.querySelectorAll<HTMLElement>(
      '[data-slot="shortcut-rail-link"]',
    );
    const shortcutContainer = shortcutRail?.querySelector<HTMLElement>(
      '[data-slot="shortcut-rail-container"]',
    );
    if (
      !shortcutRail ||
      !themeProductList ||
      hero.nextElementSibling !== primaryTabs ||
      primaryTabs.nextElementSibling !== shortcutRail ||
      shortcutRail.nextElementSibling !== themeProductList ||
      !shortcutContainer ||
      getComputedStyle(shortcutContainer).maxWidth !==
        resolvedContentMaxWidth ||
      (typeof args.contentMaxWidth === "number" &&
        shortcutContainer.getBoundingClientRect().width >
          args.contentMaxWidth + 1) ||
      shortcutLinks?.length !== 8 ||
      shortcutLinks[0]?.textContent?.trim() !==
        localizedExpectation.firstShortcut ||
      shortcutLinks[7]?.textContent?.trim() !==
        localizedExpectation.lastShortcut ||
      shortcutRail.querySelectorAll(
        '[data-image-presentation="full-bleed"]',
      ).length !== 8
    ) {
      throw new Error(
        "Topic landing page must place Primary Style A tabs and the eight-item Full-bleed Shortcut Rail between ThemeHero and Start Here",
      );
    }

    const normalize = (value: unknown) =>
      String(value ?? "")
        .replace(/\s+/g, " ")
        .trim();
    const heading = hero.querySelector<HTMLElement>("h2");
    if (
      normalize(heading?.textContent) !==
      normalize(localizedExpectation.heroTitle)
    ) {
      throw new Error("Topic landing page heading is missing");
    }

    const copy = hero.querySelector('[data-slot="theme-hero-copy"]');
    if (
      !copy ||
      !normalize(copy.textContent).includes(
        normalize(localizedExpectation.heroDescription),
      )
    ) {
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
      standardRailContainer.getBoundingClientRect().width >
        resolvedContentMaxWidthPx + 1
    ) {
      throw new Error(
        `Topic landing page Standard Rail content must cap at ${expectedContentMaxWidth}`,
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
      waterfallContainer.getBoundingClientRect().width >
        resolvedContentMaxWidthPx + 1
    ) {
      throw new Error(
        `Topic landing page Waterfall content must cap at ${expectedContentMaxWidth}`,
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
    const reviewWrapper = page.querySelector<HTMLElement>(
      '[data-slot="topic-landing-review-list"]',
    );
    const waterfallWrapper = page.querySelector<HTMLElement>(
      '[data-page-slot="topic-landing-waterfall"]',
    );
    const deferredSections = [reviewWrapper, standardRail, waterfallWrapper];
    if (
      deferredSections.some(
        (section) =>
          !section || getComputedStyle(section).contentVisibility !== "auto",
      )
    ) {
      throw new Error(
        "Topic landing page must defer rendering for Reviews and later sections",
      );
    }
    const reviewSection = page.querySelector<HTMLElement>(
      '[data-slot="topic-landing-review-list"]',
    );
    const reviewCards = reviewList?.querySelectorAll<HTMLElement>(
      '[data-slot="review-card"]',
    );
    const reviewImages = reviewList?.querySelectorAll<HTMLImageElement>(
      '[data-slot="review-card-product"] img',
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
      !reviewImages ||
      reviewImages.length !== 3 ||
      Array.from(reviewImages).some(
        (image) => !image.src.endsWith(".webp") || image.loading !== "lazy",
      ) ||
      !reviewItems ||
      reviewItems.length !== 3 ||
      !reviewItemsList ||
      !reviewContainer ||
      !reviewList.textContent?.includes(localizedExpectation.firstReview) ||
      reviewList.querySelector('[data-slot="review-list-view-all-mobile"]')
    ) {
      throw new Error(
        "Topic landing page ReviewList must reuse the component content without a view-all action",
      );
    }
    if (
      reviewSection.querySelector('[data-slot="review-list"]') !== reviewList ||
      reviewContainer.getBoundingClientRect().width >
        resolvedContentMaxWidthPx + 1
    ) {
      throw new Error(
        `Topic landing page ReviewList content must cap at ${expectedContentMaxWidth}`,
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
          "Topic landing page ReviewList must show three card slots within its configured content width",
        );
      }
    }

    const moduleTitles = page.querySelectorAll<HTMLElement>(
      '[data-slot="product-list-title"], [data-slot="review-list-title"]',
    );
    const shortcutTitle = page.querySelector<HTMLElement>(
      '[data-slot="shortcut-rail-title"]',
    );
    const primaryTabLabels = Array.from(
      primaryTabs.querySelectorAll<HTMLElement>('[data-slot="tabs-trigger"]'),
      (tab) => normalize(tab.textContent),
    );
    const moduleTitleLabels = [shortcutTitle, ...moduleTitles].map((title) => {
      const visibleResponsiveTitle = Array.from(
        title?.querySelectorAll<HTMLElement>("span") ?? [],
      ).find((candidate) => getComputedStyle(candidate).display !== "none");
      return normalize(visibleResponsiveTitle?.textContent ?? title?.textContent);
    });
    if (
      primaryTabLabels.length !== moduleTitleLabels.length ||
      primaryTabLabels.some(
        (label, index) => label !== moduleTitleLabels[index],
      )
    ) {
      throw new Error(
        "Topic landing page primary tabs must mirror every following module title in order",
      );
    }
    const titleFontFamily = args.titleFontFamily ?? "serif";
    const pageTitles = [heading, shortcutTitle, ...moduleTitles].filter(
      (title): title is HTMLElement => Boolean(title),
    );
    if (
      main.dataset.titleFontFamily !== titleFontFamily ||
      pageTitles.length !== 6 ||
      pageTitles.some((title) =>
        titleFontFamily === "serif"
          ? !getComputedStyle(title).fontFamily.includes("Source Serif 4") ||
            getComputedStyle(title).fontWeight !== "600"
          : getComputedStyle(title).fontFamily.includes("Source Serif 4") ||
            getComputedStyle(title).fontWeight !== "400",
      )
    ) {
      throw new Error(
        "Topic landing page must apply its title font family to the hero and every module title",
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
          ?.textContent !== localizedExpectation.activityTitle
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

export const Chinese: Story = {
  name: "中文",
  globals: {
    locale: "zh",
    viewport: { value: "yamiDesktopMd", isRotated: false },
  },
  args: createTopicLandingPageFixture("zh"),
  play: Pc.play,
};

export const ChineseMobile: Story = {
  name: "中文 Mobile",
  globals: {
    locale: "zh",
    viewport: { value: "yamiMobile", isRotated: false },
  },
  args: createTopicLandingPageFixture("zh"),
  play: Pc.play,
};

export const CustomContentWidth: Story = {
  name: "Custom Content Width",
  args: {
    contentMaxWidth: 1320,
  },
  parameters: {
    controls: {
      disable: false,
      include: ["contentMaxWidth"],
    },
  },
  play: Pc.play,
};

export const SansTitles: Story = {
  name: "Sans Titles",
  args: {
    titleFontFamily: "sans",
  },
  parameters: {
    controls: {
      disable: false,
      include: ["titleFontFamily"],
    },
  },
  play: Pc.play,
};
