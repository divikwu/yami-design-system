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
            heroDescription:
              "以温和亲肤成分结合针对性活性成分，为舒缓、补水、提亮与屏障护理提供简单清晰的日常方案。",
            heroTags: [
              "Heartleaf 鱼腥草",
              "温和日常配方",
              "针对性活性护理",
            ],
            heroPrimaryCta: "选购商品",
            heroSecondaryCta: "探索更多",
            firstShortcut: "粮油调味",
            lastShortcut: "母婴玩具",
            firstReview: "温和又干净，洗完很舒服",
            activityTitle: "艾努雅",
            firstTab: "精选分类",
          }
        : {
            heroTitle: "Anua: Gentle yet Effective Korean Skincare",
            heroDescription:
              "Skin-friendly ingredients and targeted actives for simple daily care across soothing, hydration, brightening, and barrier support.",
            heroTags: [
              "Heartleaf Botanical",
              "Gentle Daily Formulas",
              "Targeted Active Care",
            ],
            heroPrimaryCta: "Shop Products",
            heroSecondaryCta: "Explore More",
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
    const waterfallReveal = main?.querySelector<HTMLElement>(
      '[data-page-slot="topic-landing-waterfall"]',
    );
    const waterfallHeading = waterfallReveal?.querySelector<HTMLElement>(
      '[data-slot="product-list-heading"]',
    );
    const waterfallTabs = waterfallReveal?.querySelector<HTMLElement>(
      '[data-slot="product-list-container"] > [data-slot="tabs"]',
    );
    const waterfallRowItems = waterfallReveal?.querySelectorAll<HTMLElement>(
      '[data-slot="product-list-item"]',
    );
    const waterfallLoadMore = waterfallReveal?.querySelector<HTMLElement>(
      '[data-slot="product-list-load-more"]',
    );
    if (
      !initialReveal ||
      scrollReveals?.length !== 2 ||
      waterfallReveal?.dataset.motionReveal !== undefined ||
      waterfallHeading?.dataset.motionReveal !== "waterfall-heading" ||
      waterfallTabs?.dataset.motionReveal !== "waterfall-tabs" ||
      !waterfallRowItems ||
      waterfallRowItems.length <= 6 ||
      Array.from(waterfallRowItems).some(
        (item) => item.dataset.motionReveal !== "waterfall-row",
      ) ||
      waterfallLoadMore?.dataset.motionReveal !== "waterfall-row" ||
      main?.dataset.motionReady === undefined
    ) {
      throw new Error(
        "Topic landing page waterfall must reveal its heading, tabs and product rows independently",
      );
    }
    if (main.dataset.motionReady === "true") {
      const motionRevealTargets = [
        ...Array.from(scrollReveals),
        waterfallHeading,
        waterfallTabs,
        ...Array.from(waterfallRowItems),
        waterfallLoadMore,
      ];
      for (const revealTarget of motionRevealTargets) {
        const previousMotionState = revealTarget.dataset.motionState;
        delete revealTarget.dataset.motionState;
        const hiddenTransform = getComputedStyle(revealTarget).transform;
        const hiddenTranslateY = new DOMMatrixReadOnly(hiddenTransform).m42;

        revealTarget.dataset.motionState = "visible";
        const visibleStyle = getComputedStyle(revealTarget);
        const transitionDurations =
          visibleStyle.transitionDuration.split(", ");
        const transitionTimings =
          visibleStyle.transitionTimingFunction.split(", ");

        if (previousMotionState === undefined) {
          delete revealTarget.dataset.motionState;
        } else {
          revealTarget.dataset.motionState = previousMotionState;
        }

        if (
          hiddenTranslateY !== 24 ||
          transitionDurations.length !== 2 ||
          transitionDurations.some((duration) => duration !== "0.32s") ||
          transitionTimings.length !== 2 ||
          transitionTimings.some((timing) => timing !== "ease-out")
        ) {
          throw new Error(
            "Topic landing page section reveals must use the compact 24px, 320ms ease-out entrance",
          );
        }
      }
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
    const primaryTabsRoot = primaryTabsContainer?.querySelector<HTMLElement>(
      '[data-slot="tabs"]',
    );
    const activePrimaryTab = primaryTabs?.querySelector<HTMLElement>(
      '[data-slot="tabs-trigger"][data-state="active"]',
    );
    const primaryTabsStyle = primaryTabs ? getComputedStyle(primaryTabs) : null;
    const primaryTabsContainerStyle = primaryTabsContainer
      ? getComputedStyle(primaryTabsContainer)
      : null;
    const primaryTabsListStyle = primaryTabsList
      ? getComputedStyle(primaryTabsList)
      : null;
    const isDesktopTabs = page.getBoundingClientRect().width >= 1024;
    if (
      !primaryTabs ||
      !primaryTabsList ||
      !primaryTabsContainer ||
      !primaryTabsRoot ||
      !primaryTabsStyle ||
      !primaryTabsContainerStyle ||
      !primaryTabsListStyle ||
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
        (isDesktopTabs ? "48px" : "16px") ||
      primaryTabsContainerStyle.paddingRight !==
        (isDesktopTabs ? "48px" : "16px") ||
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
    if (!isDesktopTabs) {
      const primaryTabsRect = primaryTabs.getBoundingClientRect();
      const primaryTabsRootRect = primaryTabsRoot.getBoundingClientRect();
      const primaryTabsListRect = primaryTabsList.getBoundingClientRect();
      if (
        Math.abs(primaryTabsRootRect.left - primaryTabsRect.left) > 1 ||
        Math.abs(primaryTabsRootRect.right - primaryTabsRect.right) > 1 ||
        Math.abs(primaryTabsListRect.left - primaryTabsRect.left) > 1 ||
        Math.abs(primaryTabsListRect.right - primaryTabsRect.right) > 1 ||
        primaryTabsListStyle.overflowX !== "auto" ||
        primaryTabsListStyle.paddingLeft !== "16px" ||
        primaryTabsListStyle.paddingRight !== "16px" ||
        primaryTabsList.scrollWidth <= primaryTabsList.clientWidth
      ) {
        throw new Error(
          "Topic landing page mobile tabs must use a full-width horizontal scroll viewport with 16px edge padding",
        );
      }
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

    const copy = hero.querySelector<HTMLElement>(
      '[data-slot="theme-hero-copy"]',
    );
    const heroDescription = copy?.querySelector<HTMLElement>(
      '[data-slot="theme-hero-description"]',
    );
    const heroDescriptionStyle = heroDescription
      ? getComputedStyle(heroDescription)
      : null;
    const isMobileHero = window.innerWidth < 1024;
    const expectedHeroDescriptionSize = isMobileHero ? "14px" : "16px";
    if (
      !copy ||
      !heroDescription ||
      !normalize(copy.textContent).includes(
        normalize(localizedExpectation.heroDescription),
      ) ||
      heroDescriptionStyle?.fontSize !== expectedHeroDescriptionSize ||
      heroDescriptionStyle?.lineHeight !== "20px"
    ) {
      throw new Error(
        "Topic landing page description must use localized ThemeHero copy at desktop 16/20 and mobile 14/20",
      );
    }

    const heroBadgeElements = Array.from(
      hero.querySelectorAll<HTMLElement>(
        '[data-slot="theme-hero-tags"] [data-slot="badge"]',
      ),
    );
    const heroTags = heroBadgeElements.map((badge) =>
      normalize(badge.textContent),
    );
    if (
      heroTags.length !== localizedExpectation.heroTags.length ||
      heroTags.some(
        (tag, index) => tag !== localizedExpectation.heroTags[index],
      ) ||
      heroBadgeElements.some((badge) => {
        const style = getComputedStyle(badge);
        const expectedHeight = isMobileHero ? "20px" : "24px";
        const expectedFontSize = isMobileHero ? "12px" : "14px";
        const expectedLineHeight = isMobileHero ? "16px" : "20px";
        return (
          badge.dataset.tone !== "dark" ||
          badge.dataset.size !== "md" ||
          style.height !== expectedHeight ||
          style.borderRadius !== "4px" ||
          style.fontSize !== expectedFontSize ||
          style.lineHeight !== expectedLineHeight ||
          style.paddingLeft !== "8px" ||
          style.paddingRight !== "8px" ||
          style.backgroundColor !== "rgba(0, 0, 0, 0.08)" ||
          style.color !== "rgb(255, 255, 255)" ||
          style.boxShadow !== "none"
        );
      })
    ) {
      throw new Error(
        "Topic landing page keywords must use responsive filled dark Badges with 8px inline padding",
      );
    }

    const heroActions = hero.querySelector<HTMLElement>(
      '[data-slot="theme-hero-actions"]',
    );
    const primaryAction = heroActions?.querySelector<HTMLButtonElement>(
      '[data-action="primary"]',
    );
    const secondaryAction = heroActions?.querySelector<HTMLButtonElement>(
      '[data-action="secondary"]',
    );
    const shopTarget = page.querySelector<HTMLElement>("#shop");
    const exploreTarget = page.querySelector<HTMLElement>("#explore");
    const heroActionsStyle = heroActions
      ? getComputedStyle(heroActions)
      : null;
    const heroCopyStyle = getComputedStyle(copy);
    const heroCopyContentWidth =
      copy.getBoundingClientRect().width -
      Number.parseFloat(heroCopyStyle.paddingLeft) -
      Number.parseFloat(heroCopyStyle.paddingRight);
    const heroActionsWidth = heroActions?.getBoundingClientRect().width ?? 0;
    const expectedActionPadding = window.innerWidth >= 1024 ? "16px" : "8px";
    if (
      !heroActions ||
      !primaryAction ||
      !secondaryAction ||
      !shopTarget ||
      !exploreTarget ||
      normalize(primaryAction.textContent) !== localizedExpectation.heroPrimaryCta ||
      normalize(secondaryAction.textContent) !== localizedExpectation.heroSecondaryCta ||
      primaryAction.getAttribute("aria-controls") !== "shop" ||
      secondaryAction.getAttribute("aria-controls") !== "explore" ||
      heroActionsStyle?.paddingTop !== expectedActionPadding ||
      heroActionsStyle?.paddingBottom !== expectedActionPadding ||
      (isMobileHero &&
        (heroActionsStyle?.flexWrap !== "nowrap" ||
          Math.abs(heroActionsWidth - heroCopyContentWidth) > 1)) ||
      (!isMobileHero && heroActionsWidth >= copy.getBoundingClientRect().width)
    ) {
      throw new Error(
        "Topic landing page must connect localized Hero actions with responsive padding and mobile full-width distribution to existing page sections",
      );
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

    const lowPriceBadges = Array.from(
      productLists[0]?.querySelectorAll<HTMLElement>(
        '[data-slot="product-card-badges"] [data-slot="badge"][data-type="low-price"]',
      ) ?? [],
    );
    if (
      lowPriceBadges.length !== 1 ||
      normalize(lowPriceBadges[0]?.textContent) !== "Low Price"
    ) {
      throw new Error(
        "Topic landing page product-image Badge labels must remain English in every locale",
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
    if (standardRail.nextElementSibling !== reviewWrapper) {
      throw new Error(
        "Topic landing page ReviewList must follow the Standard Rail",
      );
    }
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
