import type { Meta, StoryObj } from "@storybook/react-vite";

import { createThemeHeroProps } from "@yami/design-system/components/ThemeHero/fixtures";

import { TopicLandingPage } from "./TopicLandingPage";
import { createTopicLandingPageFixture } from "./fixtures";

const meta = {
  title: "YAMI/Pages/Topic Landing Page/Brand",
  component: TopicLandingPage,
  parameters: {
    layout: "fullscreen",
    controls: { disable: true },
    docs: {
      description: {
        component:
          "The brand-keyword presentation of Topic Landing Page, with a global header, ThemeHero, a full-bleed ShortcutRail, ThemeProductList, ReviewList, a Standard Rail and a ProductList Waterfall collection, followed by the global footer.",
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
    theme: "light",
    viewport: { value: "yamiDesktopMd", isRotated: false },
  },
  args: createTopicLandingPageFixture(),
  render: (args, { globals }) => {
    const locale = globals.locale === "zh" ? "zh" : "en";
    const localizedArgs = createTopicLandingPageFixture(locale);

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

export const Pc: Story = {
  name: "Brand — PC",
  play: async ({ canvasElement, args, globals }) => {
    const locale = globals.locale === "zh" ? "zh" : "en";
    const localizedArgs = createTopicLandingPageFixture(locale);
    const localizedExpectation =
      locale === "zh"
        ? {
            heroTitle: "Anua：温和有效的韩系护肤",
            heroDescription:
              "以温和亲肤成分结合针对性活性成分，为舒缓、补水、提亮与屏障护理提供简单清晰的日常方案。",
            heroDescriptionExpandLabel: "更多",
            heroDescriptionCollapseLabel: "收起",
            heroTags: [
              "Heartleaf 鱼腥草",
              "温和日常配方",
              "针对性活性护理",
            ],
            firstShortcut: "清洁与去角质",
            lastShortcut: "彩妆",
            firstReview: "温和又干净，洗完很舒服",
            activityTitle: "艾努雅",
            firstTab: "精选分类",
            exploreMoreCategory: "清洁与去角质",
            exploreMorePairing: "相关推荐",
            exploreMoreDescription:
              "探索该系列更多产品，以及为你精选的搭配好物。",
            startHereTitle: "打造你的 ANUA 护肤流程",
            startHereThemes: [
              {
                tab: "温和清洁",
                title: "清洁彻底，也保持舒适",
                firstProduct: "鱼腥草毛孔清洁卸妆油 200ml",
              },
              {
                tab: "舒缓调理",
                title: "先舒缓，再为后续护理打底",
                firstProduct: "鱼腥草 77% 玻尿酸舒缓爽肤水 250ml",
              },
              {
                tab: "淡斑提亮",
                title: "集中改善暗沉与痘印",
                firstProduct: "烟酰胺 10% + 传明酸 4% 淡斑精华 30ml",
              },
              {
                tab: "补水修护",
                title: "补足水分，稳住肌肤屏障",
                firstProduct: "PDRN 玻尿酸胶囊 100 精华 30ml",
              },
              {
                tab: "日间防护",
                title: "保湿打底，完成日间防护",
                firstProduct: "KPDH 清爽保湿防晒霜 SPF50+ 50ml",
              },
            ],
          }
        : {
            heroTitle: "Anua: Gentle yet Effective Korean Skincare",
            heroDescription:
              "Skin-friendly ingredients and targeted actives for simple daily care across soothing, hydration, brightening, and barrier support.",
            heroDescriptionExpandLabel: "More",
            heroDescriptionCollapseLabel: "Less",
            heroTags: [
              "Heartleaf Botanical",
              "Gentle Daily Formulas",
              "Targeted Active Care",
            ],
            firstShortcut: "Cleanse & Peel",
            lastShortcut: "Makeup",
            firstReview: "It feels so gentle and still gets all the gunk out",
            activityTitle: "Anua",
            firstTab: "Explore by Type",
            exploreMoreCategory: "Cleanse & Peel",
            exploreMorePairing: "Related Picks",
            exploreMoreDescription:
              "Discover more from the collection, plus complementary picks selected for you.",
            startHereTitle: "Build Your Anua Routine",
            startHereThemes: [
              {
                tab: "Cleanse & Reset",
                title: "Thoroughly cleanse, without the tight feel",
                firstProduct: "Heartleaf Pore Control Cleansing Oil, 200 ml",
              },
              {
                tab: "Calm & Prep",
                title: "Soothe first, then prep for what follows",
                firstProduct:
                  "Heartleaf 77% + Hyaluron Soothing Toner, 250 ml",
              },
              {
                tab: "Brighten & Correct",
                title: "Target dark spots and dull tone",
                firstProduct:
                  "Niacinamide 10% + TXA 4% Dark Spot Correcting Serum, 30 ml",
              },
              {
                tab: "Hydrate & Repair",
                title: "Replenish moisture and support the barrier",
                firstProduct:
                  "PDRN Hyaluronic Acid Capsule 100 Serum, 30 ml",
              },
              {
                tab: "Protect & Finish",
                title: "Moisturize, then finish with daily SPF",
                firstProduct:
                  "KPDH Daily Clear Moisturizing Sun Cream SPF50+, 50 ml",
              },
            ],
          };
    const page = canvasElement.querySelector<HTMLElement>(
      '[data-slot="topic-landing-page"]',
    );
    if (!page || page.lang !== locale) {
      throw new Error("Topic landing page must expose its content language");
    }
    const runInteractionChecks = import.meta.env.MODE === "test";
    const initialStoryScrollY = window.scrollY;
    const initialStoryLocation = `${window.location.pathname}${window.location.search}${window.location.hash}`;
    let maximumStoryScrollDelta = 0;
    const recordStoryScroll = () => {
      maximumStoryScrollDelta = Math.max(
        maximumStoryScrollDelta,
        Math.abs(window.scrollY - initialStoryScrollY),
      );
    };
    window.addEventListener("scroll", recordStoryScroll, { passive: true });
    const captureScrollRequest = async (action: () => void) => {
      const originalScrollIntoView = Element.prototype.scrollIntoView;
      let request:
        | {
            target: Element;
            options?: boolean | ScrollIntoViewOptions;
          }
        | undefined;
      Element.prototype.scrollIntoView = function scrollIntoView(
        options?: boolean | ScrollIntoViewOptions,
      ) {
        request = { target: this, options };
      };
      try {
        action();
        await new Promise<void>((resolve) =>
          requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
        );
        return request;
      } finally {
        Element.prototype.scrollIntoView = originalScrollIntoView;
      }
    };

    const main = page.querySelector<HTMLElement>(
      '[data-slot="topic-landing-main"]',
    );
    const initialReveal = main?.querySelector<HTMLElement>(
      '[data-motion-reveal="initial"]',
    );
    const initialRevealContent = initialReveal?.querySelectorAll<HTMLElement>(
      '[data-slot="theme-hero-copy"], [data-slot="theme-hero-media"]',
    );
    const scrollReveals = main?.querySelectorAll<HTMLElement>(
      '[data-motion-reveal="scroll"]',
    );
    const expectedScrollRevealSlots = [
      "topic-landing-shortcut-rail",
      "topic-landing-theme-product-list",
      "topic-landing-standard-rail",
      ...(main?.querySelector('[data-slot="topic-landing-brand-rail"]')
        ? ["topic-landing-brand-rail"]
        : []),
      "topic-landing-review-list",
      "topic-landing-waterfall-section",
    ];
    const waterfallReveal = main?.querySelector<HTMLElement>(
      '[data-page-slot="topic-landing-waterfall"]',
    );
    const waterfallRowItems = waterfallReveal?.querySelectorAll<HTMLElement>(
      '[data-slot="product-list-item"]',
    );
    const waterfallSection = waterfallReveal?.closest<HTMLElement>(
      '[data-slot="topic-landing-waterfall-section"]',
    );
    const isDesktopMotion = page.getBoundingClientRect().width >= 1024;
    if (
      !initialReveal ||
      initialRevealContent?.length !== 2 ||
      !scrollReveals ||
      Array.from(scrollReveals).some(
        (section, index) =>
          section.dataset.slot !== expectedScrollRevealSlots[index],
      ) ||
      scrollReveals.length !== expectedScrollRevealSlots.length ||
      waterfallReveal?.dataset.motionReveal !== undefined ||
      waterfallSection?.dataset.motionReveal !== "scroll" ||
      !waterfallRowItems ||
      waterfallRowItems.length <= 6 ||
      Array.from(waterfallRowItems).some((item) =>
        isDesktopMotion
          ? item.dataset.motionReveal !== "scroll-row" ||
            item.dataset.motionObserved !== "true"
          : item.dataset.motionReveal !== undefined,
      ) ||
      main?.dataset.motionReady !== "true"
    ) {
      throw new Error(
        "Topic landing page content modules must use one consistent scroll reveal boundary",
      );
    }
    if (main.dataset.motionReady === "true") {
      const previousInitialMotionState = initialReveal.dataset.motionState;
      delete initialReveal.dataset.motionState;
      const initialRootStyle = getComputedStyle(initialReveal);
      const hiddenInitialContent = Array.from(initialRevealContent).map(
        (target) => {
          const style = getComputedStyle(target);
          return {
            opacity: style.opacity,
            translateY: new DOMMatrixReadOnly(style.transform).m42,
          };
        },
      );

      initialReveal.dataset.motionState = "visible";
      const visibleInitialContent = Array.from(initialRevealContent).map(
        (target) => getComputedStyle(target),
      );

      if (previousInitialMotionState === undefined) {
        delete initialReveal.dataset.motionState;
      } else {
        initialReveal.dataset.motionState = previousInitialMotionState;
      }

      if (
        initialRootStyle.opacity !== "1" ||
        initialRootStyle.transform !== "none" ||
        hiddenInitialContent.some(
          ({ opacity, translateY }) => opacity !== "0" || translateY !== 32,
        ) ||
        visibleInitialContent.some((style) => {
          const durations = style.transitionDuration.split(", ");
          const timings = style.transitionTimingFunction.split(", ");
          return (
            durations.length !== 2 ||
            durations.some((duration) => duration !== "0.5s") ||
            timings.length !== 2 ||
            timings.some((timing) => timing !== "ease-in-out")
          );
        })
      ) {
        throw new Error(
          "Topic landing Hero must keep its module static while its copy and media fade upward",
        );
      }

      for (const revealSection of Array.from(scrollReveals)) {
        const revealContent =
          isDesktopMotion && revealSection === waterfallSection
            ? revealSection.querySelector<HTMLElement>(
                '[data-slot="product-list-heading"]',
              )
            : revealSection.querySelector<HTMLElement>(
                '[data-slot="shortcut-rail-container"], [data-slot="brand-product-rail-container"], [data-slot="product-list-container"], [data-slot="review-list-container"]',
              );
        if (!revealContent) {
          throw new Error("Topic landing module content did not render");
        }

        const previousMotionState = revealSection.dataset.motionState;
        delete revealSection.dataset.motionState;
        const rootStyle = getComputedStyle(revealSection);
        const hiddenStyle = getComputedStyle(revealContent);
        const hiddenTranslateY = new DOMMatrixReadOnly(
          hiddenStyle.transform,
        ).m42;

        revealSection.dataset.motionState = "visible";
        const visibleStyle = getComputedStyle(revealContent);
        const transitionDurations =
          visibleStyle.transitionDuration.split(", ");
        const transitionTimings =
          visibleStyle.transitionTimingFunction.split(", ");

        if (previousMotionState === undefined) {
          delete revealSection.dataset.motionState;
        } else {
          revealSection.dataset.motionState = previousMotionState;
        }

        if (
          rootStyle.opacity !== "1" ||
          rootStyle.transform !== "none" ||
          hiddenStyle.opacity !== "0" ||
          hiddenTranslateY !== 24 ||
          transitionDurations.length !== 2 ||
          transitionDurations.some((duration) => duration !== "0.32s") ||
          transitionTimings.length !== 2 ||
          transitionTimings.some((timing) => timing !== "ease-out")
        ) {
          throw new Error(
            "Topic landing modules must keep their roots static while their content fades upward",
          );
        }
      }

      if (isDesktopMotion) {
        const firstWaterfallItem = waterfallRowItems[0];
        if (!firstWaterfallItem) {
          throw new Error("Topic landing waterfall products did not render");
        }
        const previousMotionState = firstWaterfallItem.dataset.motionState;
        const previousMotionDirection =
          firstWaterfallItem.dataset.motionDirection;
        delete firstWaterfallItem.dataset.motionState;
        delete firstWaterfallItem.dataset.motionDirection;
        const hiddenStyle = getComputedStyle(firstWaterfallItem);
        const hiddenTranslateY = new DOMMatrixReadOnly(
          hiddenStyle.transform,
        ).m42;

        firstWaterfallItem.dataset.motionDirection = "down";
        firstWaterfallItem.dataset.motionState = "visible";
        const downwardStyle = getComputedStyle(firstWaterfallItem);
        const downwardDurations =
          downwardStyle.transitionDuration.split(", ");

        firstWaterfallItem.dataset.motionDirection = "up";
        const upwardDuration =
          getComputedStyle(firstWaterfallItem).transitionDuration;

        if (previousMotionState === undefined) {
          delete firstWaterfallItem.dataset.motionState;
        } else {
          firstWaterfallItem.dataset.motionState = previousMotionState;
        }
        if (previousMotionDirection === undefined) {
          delete firstWaterfallItem.dataset.motionDirection;
        } else {
          firstWaterfallItem.dataset.motionDirection =
            previousMotionDirection;
        }

        if (
          hiddenStyle.opacity !== "0" ||
          hiddenTranslateY !== 24 ||
          downwardDurations.length !== 2 ||
          downwardDurations.some((duration) => duration !== "0.32s") ||
          upwardDuration !== "0s"
        ) {
          throw new Error(
            "Desktop waterfall rows must animate only while entering on downward scroll",
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
      primaryTabsStyle.position !== "sticky" ||
      primaryTabsStyle.top !== "0px" ||
      primaryTabsStyle.zIndex !== "10" ||
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
        "Topic landing page must render localized Primary Style A tabs immediately before Explore by Type",
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
    const themeProductListSection = page.querySelector<HTMLElement>(
      '[data-slot="topic-landing-theme-product-list"]',
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
      !themeProductListSection ||
      hero.nextElementSibling !== primaryTabs ||
      primaryTabs.nextElementSibling !== shortcutRail ||
      shortcutRail.nextElementSibling !== themeProductListSection ||
      themeProductListSection.firstElementChild !== themeProductList ||
      !shortcutContainer ||
      getComputedStyle(shortcutContainer).maxWidth !==
        resolvedContentMaxWidth ||
      (typeof args.contentMaxWidth === "number" &&
        shortcutContainer.getBoundingClientRect().width >
          args.contentMaxWidth + 1) ||
      shortcutLinks?.length !== 7 ||
      shortcutLinks[0]?.textContent?.trim() !==
        localizedExpectation.firstShortcut ||
      shortcutLinks[0]?.getAttribute("href") !==
        "#explore-more-cleanse-peel" ||
      shortcutLinks[6]?.textContent?.trim() !==
        localizedExpectation.lastShortcut ||
      shortcutRail.querySelectorAll(
        '[data-image-presentation="full-bleed"]',
      ).length !== 7
    ) {
      throw new Error(
        "Topic landing page must place Primary Style A tabs and the seven-item Full-bleed Shortcut Rail between ThemeHero and Start Here",
      );
    }

    if (!isDesktopTabs) {
      const expectedModuleTitleLeft =
        shortcutContainer.getBoundingClientRect().left +
        Number.parseFloat(getComputedStyle(shortcutContainer).paddingLeft);
      const moduleTitles = Array.from(
        page.querySelectorAll<HTMLElement>(
          '[data-slot="shortcut-rail-title"], [data-slot="product-list-title"], [data-slot="review-list-title"]',
        ),
      );
      if (
        moduleTitles.length !== 5 ||
        moduleTitles.some(
          (title) =>
            Math.abs(
              title.getBoundingClientRect().left - expectedModuleTitleLeft,
            ) > 1,
        )
      ) {
        throw new Error(
          "Mobile topic landing module titles must align flush with the shared content edge",
        );
      }
    }

    if (!isDesktopTabs && locale === "en") {
      const shortcutLabels = Array.from(
        shortcutRail.querySelectorAll<HTMLElement>(
          '[data-slot="shortcut-rail-label"]',
        ),
      );
      const moisturizersLabel = shortcutLabels.find(
        (label) => label.textContent?.trim() === "Moisturizers",
      );
      const cleanseLabel = shortcutLabels.find(
        (label) => label.textContent?.trim() === "Cleanse & Peel",
      );
      const labelLineHeight = moisturizersLabel
        ? Number.parseFloat(getComputedStyle(moisturizersLabel).lineHeight)
        : 0;
      if (
        !moisturizersLabel ||
        !cleanseLabel ||
        getComputedStyle(moisturizersLabel).overflowWrap !== "normal" ||
        moisturizersLabel.scrollWidth > moisturizersLabel.clientWidth ||
        moisturizersLabel.getBoundingClientRect().height >
          labelLineHeight + 1 ||
        cleanseLabel.getBoundingClientRect().height <
          labelLineHeight * 2 - 1
      ) {
        throw new Error(
          "Mobile Shortcut Rail must keep single English words intact while allowing multi-word labels to wrap to two lines",
        );
      }
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
    const heroDescriptionText = copy?.querySelector<HTMLElement>(
      '[data-slot="theme-hero-description-text"]',
    );
    const heroDescriptionCopy = copy?.querySelector<HTMLElement>(
      '[data-slot="theme-hero-description-copy"]',
    );
    const heroDescriptionToggle = copy?.querySelector<HTMLButtonElement>(
      '[data-slot="theme-hero-description-toggle"]',
    );
    const heroDescriptionStyle = heroDescription
      ? getComputedStyle(heroDescription)
      : null;
    const isMobileHero = window.innerWidth < 1024;
    const expectedHeroDescriptionSize = isMobileHero ? "14px" : "16px";
    const expectedHeroDescriptionLines = isMobileHero ? "2" : "3";
    if (
      !copy ||
      !heroDescription ||
      !heroDescriptionText ||
      !heroDescriptionCopy ||
      normalize(localizedArgs.hero.description) !==
        normalize(localizedExpectation.heroDescription) ||
      (heroDescriptionToggle === null &&
        normalize(heroDescriptionCopy.textContent) !==
          normalize(localizedExpectation.heroDescription)) ||
      (heroDescriptionToggle !== null &&
        (!normalize(heroDescriptionCopy.textContent).endsWith("…") ||
          !normalize(localizedExpectation.heroDescription).startsWith(
            normalize(heroDescriptionCopy.textContent).slice(0, -1),
          ))) ||
      normalize(localizedArgs.hero.descriptionExpandLabel) !==
        localizedExpectation.heroDescriptionExpandLabel ||
      normalize(localizedArgs.hero.descriptionCollapseLabel) !==
        localizedExpectation.heroDescriptionCollapseLabel ||
      heroDescriptionStyle?.fontSize !== expectedHeroDescriptionSize ||
      heroDescriptionStyle?.lineHeight !== "20px" ||
      getComputedStyle(heroDescriptionText).webkitLineClamp !==
        expectedHeroDescriptionLines ||
      (heroDescriptionToggle !== null &&
        (normalize(heroDescriptionToggle.textContent) !==
          localizedExpectation.heroDescriptionExpandLabel ||
          getComputedStyle(heroDescriptionToggle).backgroundImage !== "none" ||
          getComputedStyle(heroDescriptionToggle).fontWeight !== "400"))
    ) {
      throw new Error(
        "Topic landing page description must use localized three-line desktop and two-line mobile ThemeHero copy with a plain-text localized expansion action",
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
        const usesLightBadge =
          isMobileHero && hero.dataset.mobileForeground === "dark";
        return (
          badge.dataset.tone !== "dark" ||
          badge.dataset.size !== "md" ||
          style.height !== expectedHeight ||
          style.borderRadius !== "4px" ||
          style.fontSize !== expectedFontSize ||
          style.lineHeight !== expectedLineHeight ||
          style.paddingLeft !== "8px" ||
          style.paddingRight !== "8px" ||
          style.backgroundColor !==
            (usesLightBadge
              ? "rgba(255, 255, 255, 0.68)"
              : "rgba(0, 0, 0, 0.08)") ||
          style.color !==
            (usesLightBadge ? "rgb(0, 0, 0)" : "rgb(255, 255, 255)") ||
          style.boxShadow !== "none"
        );
      })
    ) {
      throw new Error(
        "Topic landing page keywords must use responsive adaptive filled Badges with 8px inline padding",
      );
    }

    const heroActions = hero.querySelector<HTMLElement>(
      '[data-slot="theme-hero-actions"]',
    );
    if (heroActions) {
      throw new Error(
        "Topic landing page Hero must not render CTA actions",
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

    const startHereTitle = productLists[0]?.querySelector<HTMLElement>(
      '[data-slot="product-list-title"]',
    );
    const startHereDescription = productLists[0]?.querySelector<HTMLElement>(
      '[data-slot="product-list-description"]',
    );
    const startHereCopy = productLists[0]?.querySelector<HTMLElement>(
      '[data-slot="product-list-copy"]',
    );
    const startHereHeading = productLists[0]?.querySelector<HTMLElement>(
      '[data-slot="product-list-heading"]',
    );
    const startHereActions = productLists[0]?.querySelector<HTMLElement>(
      '[data-slot="product-list-actions"]',
    );
    if (
      !startHereTitle ||
      startHereDescription ||
      !startHereCopy ||
      !startHereHeading ||
      normalize(startHereTitle.textContent) !==
        localizedExpectation.startHereTitle ||
      (isDesktopTabs &&
        startHereActions &&
        Math.abs(
          startHereActions.getBoundingClientRect().right -
            startHereHeading.getBoundingClientRect().right,
        ) > 1)
    ) {
      throw new Error(
        "Start here must render the localized routine title without supporting copy",
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
        .length !== 8
    ) {
      throw new Error(
        "Topic landing page Standard Rail must render eight products",
      );
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
    const waterfallHeading = waterfall?.querySelector<HTMLElement>(
      '[data-slot="product-list-heading"]',
    );
    const waterfallTitle = waterfall?.querySelector<HTMLElement>(
      '[data-slot="product-list-title"]',
    );
    const waterfallCopy = waterfall?.querySelector<HTMLElement>(
      '[data-slot="product-list-copy"]',
    );
    const waterfallDescription = waterfall?.querySelector<HTMLElement>(
      '[data-slot="product-list-description"]',
    );
    const waterfallDescriptionStyle = waterfallDescription
      ? getComputedStyle(waterfallDescription)
      : null;
    if (
      !waterfallContainer ||
      !waterfallHeading ||
      !waterfallTitle ||
      !waterfallCopy ||
      !waterfallDescription ||
      !waterfallDescriptionStyle ||
      normalize(waterfallDescription.textContent) !==
        localizedExpectation.exploreMoreDescription ||
      waterfallDescriptionStyle.fontSize !== "14px" ||
      waterfallDescriptionStyle.lineHeight !== "20px" ||
      (isDesktopTabs &&
        getComputedStyle(waterfallCopy).alignItems !== "baseline") ||
      (isDesktopTabs &&
        Math.abs(
          waterfallDescription.getBoundingClientRect().left -
            waterfallTitle.getBoundingClientRect().right -
            8,
        ) > 1) ||
      (!isDesktopTabs &&
        waterfallDescription.getBoundingClientRect().top <
          waterfallTitle.getBoundingClientRect().bottom) ||
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

    const exploreMoreTabs = Array.from(
      waterfall?.querySelectorAll<HTMLButtonElement>(
        '[data-slot="tabs-trigger"]',
      ) ?? [],
    );
    const allProductsCount = waterfall?.querySelectorAll(
      '[data-slot="product-list-item"]',
    ).length;
    const categoryTab = exploreMoreTabs.find(
      (tab) => normalize(tab.textContent) === localizedExpectation.exploreMoreCategory,
    );
    const pairingTab = exploreMoreTabs.find(
      (tab) => normalize(tab.textContent) === localizedExpectation.exploreMorePairing,
    );
    if (
      exploreMoreTabs.length !== 9 ||
      !categoryTab ||
      !pairingTab ||
      exploreMoreTabs[1] !== pairingTab ||
      !allProductsCount ||
      allProductsCount !== Math.min(60, localizedArgs.waterfall.products.length) ||
      waterfall?.querySelector('[data-slot="product-card-badges"]')
    ) {
      throw new Error(
        "Explore More must initially render at most 60 badge-free products and nine localized tabs",
      );
    }

    if (runInteractionChecks) {
      const shortcutScrollRequest = await captureScrollRequest(() =>
        shortcutLinks?.[0]?.click(),
      );
      if (
        categoryTab.dataset.state !== "active" ||
        window.location.hash !== "#explore-more-cleanse-peel" ||
        shortcutScrollRequest?.target !== waterfall ||
        typeof shortcutScrollRequest.options !== "object" ||
        shortcutScrollRequest.options.block !== "start" ||
        waterfall?.querySelectorAll('[data-slot="product-list-item"]')
          .length !== 8 ||
        waterfall?.querySelector('[data-slot="product-card-badges"]') ||
        waterfall?.querySelector('[data-slot="product-list-load-more"]')
      ) {
        throw new Error(
          "Explore by Type must select and anchor to the matching badge-free Explore More category",
        );
      }

      pairingTab.click();
      await new Promise<void>((resolve) =>
        requestAnimationFrame(() => resolve()),
      );
      if (
        waterfall?.querySelectorAll('[data-slot="product-list-item"]')
          .length !== 8 ||
        waterfall?.querySelector('[data-slot="product-card-badges"]') ||
        waterfall?.querySelector('[data-slot="product-list-load-more"]')
      ) {
        throw new Error(
          "Related Picks must show eight badge-free curated products without Load more",
        );
      }

      exploreMoreTabs[0]?.click();
      await new Promise<void>((resolve) =>
        requestAnimationFrame(() => resolve()),
      );
      const resetWaterfallSection = waterfall?.closest<HTMLElement>(
        '[data-slot="topic-landing-waterfall-section"]',
      );
      if (
        resetWaterfallSection?.dataset.motionObserved !== "true" ||
        resetWaterfallSection.dataset.motionReveal !== "scroll"
      ) {
        throw new Error(
          "Explore More must preserve its module-level motion boundary after switching tabs",
        );
      }
      window.history.replaceState(
        null,
        "",
        `${window.location.pathname}${window.location.search}`,
      );
    }

    const loadMoreButton = waterfall?.querySelector<HTMLElement>(
      '[data-slot="product-list-load-more"] > button',
    );
    if (Boolean(loadMoreButton) !== (localizedArgs.waterfall.products.length > 60)) {
      throw new Error("Explore More must show Load more only when products remain beyond the first 60");
    }
    if (
      loadMoreButton &&
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

    const startHereTabs = Array.from(
      themeProductList.querySelectorAll<HTMLButtonElement>(
        '[data-slot="tabs-trigger"]',
      ),
    );
    if (startHereTabs.length !== localizedExpectation.startHereThemes.length) {
      throw new Error("Start Here must expose all five routine themes");
    }
    if (runInteractionChecks) {
      for (const scenario of localizedExpectation.startHereThemes) {
        const trigger = startHereTabs.find(
          (tab) => normalize(tab.textContent) === scenario.tab,
        );
        if (!trigger) {
          throw new Error(`Start Here is missing the ${scenario.tab} theme`);
        }

        trigger.click();
        await new Promise<void>((resolve) =>
          requestAnimationFrame(() => resolve()),
        );

        const contentTitle = themeProductList.querySelector<HTMLElement>(
          '[data-slot="theme-product-list-overlay"] h3',
        );
        const currentItems = themeProductList.querySelectorAll<HTMLElement>(
          '[data-slot="product-list-item"]',
        );
        const firstCard = currentItems[0]?.querySelector<HTMLElement>(
          '[data-slot="product-card"]',
        );
        const firstProductLink = firstCard?.querySelector<HTMLAnchorElement>(
          'a[href*="/p/"]',
        );
        if (
          trigger.dataset.state !== "active" ||
          normalize(contentTitle?.textContent) !== scenario.title ||
          currentItems.length !== 6 ||
          !normalize(firstCard?.textContent).includes(scenario.firstProduct) ||
          !firstProductLink?.href.startsWith(
            `https://www.yami.com/us/${locale}/p/`,
          )
        ) {
          throw new Error(
            `Start Here theme ${scenario.tab} must swap its scene and six linked ANUA products`,
          );
        }
      }

      startHereTabs[0]?.click();
      await new Promise<void>((resolve) =>
        requestAnimationFrame(() => resolve()),
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
    const primaryTabTriggers = Array.from(
      primaryTabs.querySelectorAll<HTMLButtonElement>(
        '[data-slot="tabs-trigger"]',
      ),
    );
    const primaryTabTargets = localizedArgs.primaryTabs.items.map((item) =>
      document.getElementById(item.targetId),
    );
    if (primaryTabTargets.some((target) => !target)) {
      throw new Error("Topic landing page primary tab target did not render");
    }
    if (runInteractionChecks) {
      for (const [index, tab] of primaryTabTriggers.entries()) {
        const targetId = localizedArgs.primaryTabs.items[index]?.targetId;
        const target = targetId ? document.getElementById(targetId) : null;
        const scrollRequest = await captureScrollRequest(() => tab.click());
        if (
          !targetId ||
          tab.dataset.state !== "active" ||
          tab.getAttribute("aria-controls") !== targetId ||
          window.location.hash !== `#${targetId}` ||
          !target ||
          scrollRequest?.target !== target ||
          typeof scrollRequest.options !== "object" ||
          scrollRequest.options.block !== "start"
        ) {
          throw new Error(
            "Topic landing page primary tabs must select and anchor to their matching modules",
          );
        }
      }
      await captureScrollRequest(() => primaryTabTriggers[0]?.click());

      const originalTargetRects = primaryTabTargets.map((target) =>
        target!.getBoundingClientRect.bind(target),
      );
      const simulateActiveSection = async (activeIndex: number) => {
        primaryTabTargets.forEach((target, index) => {
          const originalRect = originalTargetRects[index]!();
          target!.getBoundingClientRect = () =>
            new DOMRect(
              originalRect.x,
              index <= activeIndex ? 0 : 1000 + index * 100,
              originalRect.width,
              originalRect.height,
            );
        });
        window.dispatchEvent(new Event("scroll"));
        await new Promise<void>((resolve) =>
          requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
        );
      };

      try {
        await simulateActiveSection(3);
        if (primaryTabTriggers[0]?.dataset.state !== "active") {
          throw new Error(
            "Topic landing page primary tabs must keep the clicked tab active during programmatic scrolling",
          );
        }
        window.dispatchEvent(new Event("scrollend"));
        await new Promise<void>((resolve) =>
          requestAnimationFrame(() =>
            requestAnimationFrame(() =>
              requestAnimationFrame(() =>
                requestAnimationFrame(() => resolve()),
              ),
            ),
          ),
        );
        if (primaryTabTriggers[3]?.dataset.state !== "active") {
          throw new Error(
            "Topic landing page primary tabs must follow the active module while scrolling",
          );
        }
        await simulateActiveSection(0);
        if (primaryTabTriggers[0]?.dataset.state !== "active") {
          throw new Error(
            "Topic landing page primary tabs must restore the first module at the top of the page",
          );
        }
      } finally {
        primaryTabTargets.forEach((target, index) => {
          target!.getBoundingClientRect = originalTargetRects[index]!;
        });
      }
      window.history.replaceState(
        null,
        "",
        `${window.location.pathname}${window.location.search}`,
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
      activeHeaderStyle.position !== "static" ||
      activeHeaderStyle.top !== "auto" ||
      activeHeaderStyle.zIndex !== "auto"
    ) {
      throw new Error(
        "Topic landing Header must scroll with the page instead of remaining sticky",
      );
    }
    if (isDesktop && !footer) {
      throw new Error("Topic landing page is missing the desktop footer");
    }

    if (page.scrollWidth > page.clientWidth + 1) {
      throw new Error("Topic landing page introduces horizontal overflow");
    }
    window.removeEventListener("scroll", recordStoryScroll);
    window.history.replaceState(null, "", initialStoryLocation);
    if (maximumStoryScrollDelta > 1) {
      throw new Error(
        `Topic landing page interaction checks must not move the visible preview, observed ${maximumStoryScrollDelta}px`,
      );
    }
  },
};

export const Mobile: Story = {
  name: "Brand — Mobile",
  globals: {
    viewport: { value: "yamiMobile", isRotated: false },
  },
  play: Pc.play,
};

export const Chinese: Story = {
  name: "中文",
  tags: ["!dev", "!autodocs"],
  globals: {
    locale: "zh",
    viewport: { value: "yamiDesktopMd", isRotated: false },
  },
  play: Pc.play,
};

export const ChineseMobile: Story = {
  name: "中文 Mobile",
  tags: ["!dev", "!autodocs"],
  globals: {
    locale: "zh",
    viewport: { value: "yamiMobile", isRotated: false },
  },
  play: Pc.play,
};

export const CustomContentWidth: Story = {
  name: "Custom Content Width",
  tags: ["!dev", "!autodocs"],
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
  tags: ["!dev", "!autodocs"],
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
