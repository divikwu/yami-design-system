import type { Meta, StoryObj } from "@storybook/react-vite";
import { userEvent } from "storybook/test";

import {
  createProductListProducts,
  createProductListTabs,
} from "@yami/design-system/components/ProductList/fixtures";

import { EcommerceHomeTemplate } from "./EcommerceHome";
import {
  createEcommerceHomeFixture,
  type EcommerceHomeLocale,
} from "./fixtures";

function localeFromGlobals(value: unknown): EcommerceHomeLocale {
  return value === "en" ? "en" : "zh";
}

const meta = {
  title: "YAMI/Pages/Ecommerce Home",
  component: EcommerceHomeTemplate,
  parameters: {
    layout: "fullscreen",
    controls: { disable: true },
    docs: {
      description: {
        component:
          "YAMI ecommerce homepage template. It composes the maintained Header, Hero Banner, Shortcut Rail, Product List, Social Media Gallery, Brand Product Rail, and Footer. Every section shrinks with the viewport; the footer is the sole exception and drops out below 1024px, having no mobile layout.",
      },
      story: { inline: false, height: "1800px" },
    },
  },
  globals: {
    theme: "light",
    viewport: { value: "yamiDesktopMd", isRotated: false },
  },
  args: createEcommerceHomeFixture("en"),
} satisfies Meta<typeof EcommerceHomeTemplate>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Pc: Story = {
  name: "PC",
  render: (_args, { globals }) => (
    <EcommerceHomeTemplate
      {...createEcommerceHomeFixture(localeFromGlobals(globals.locale))}
    />
  ),
  play: async ({ canvasElement, globals }) => {
    const page = canvasElement.querySelector<HTMLElement>(
      '[data-slot="ecommerce-home"]',
    );
    if (!page) throw new Error("Ecommerce home did not render");

    const stickyHeader = page.querySelector<HTMLElement>(
      '[data-slot="ecommerce-home-header"]',
    );
    const stickyHeaderStyle = stickyHeader && getComputedStyle(stickyHeader);
    if (
      stickyHeaderStyle?.position !== "sticky" ||
      stickyHeaderStyle.top !== "0px" ||
      Number.parseInt(stickyHeaderStyle.zIndex, 10) < 1
    ) {
      throw new Error("Ecommerce home navigation must remain sticky at the top");
    }
    const storyWindow = canvasElement.ownerDocument.defaultView;
    if (storyWindow?.matchMedia("(max-width: 1023.98px)").matches) {
      const atmosphereStyle = getComputedStyle(page, "::before");
      const atmosphereWidth = Number.parseFloat(atmosphereStyle.width);
      const atmosphereHeight = Number.parseFloat(atmosphereStyle.height);
      const activeHeroCopy = page.querySelector<HTMLElement>(
        '[data-slot="hero-banner-item"] [data-slot="hero-banner-copy"]',
      );
      const activeHeroSurfaceColor = activeHeroCopy?.parentElement
        ? getComputedStyle(activeHeroCopy.parentElement).backgroundColor
        : undefined;
      const atmosphereColorProbe = document.createElement("span");
      atmosphereColorProbe.style.color =
        `color-mix(in srgb, ${activeHeroSurfaceColor} 16%, var(--background-primary))`;
      page.append(atmosphereColorProbe);
      const expectedAtmosphereColor = getComputedStyle(
        atmosphereColorProbe,
      ).color;
      atmosphereColorProbe.remove();
      if (
        atmosphereStyle.position !== "absolute" ||
        !atmosphereStyle.backgroundImage.includes("linear-gradient") ||
        !activeHeroSurfaceColor ||
        !atmosphereStyle.backgroundImage.includes(expectedAtmosphereColor) ||
        Math.abs(atmosphereWidth - page.getBoundingClientRect().width) > 1 ||
        Math.abs(atmosphereHeight - Math.min(atmosphereWidth, 440)) > 1 ||
        atmosphereHeight > 440
      ) {
        throw new Error(
          "Mobile ecommerce home atmosphere must be a full-width 16%-banner-to-page gradient with a 1:1 height capped at 440px",
        );
      }

      const heroRail = page.querySelector<HTMLElement>(
        '[data-slot="hero-banner-list"]',
      );
      const visibleHeroItems = heroRail
        ? Array.from(heroRail.children)
            .filter(
              (item): item is HTMLElement =>
                item instanceof HTMLElement &&
                getComputedStyle(item).display !== "none",
            )
            .sort((a, b) => a.offsetLeft - b.offsetLeft)
        : [];
      const nextHeroItem = visibleHeroItems[1];
      const nextHeroCopy = nextHeroItem?.querySelector<HTMLElement>(
        '[data-slot="hero-banner-copy"]',
      );
      const nextHeroSurfaceColor = nextHeroCopy?.parentElement
        ? getComputedStyle(nextHeroCopy.parentElement).backgroundColor
        : undefined;
      if (!heroRail || !nextHeroItem || !nextHeroSurfaceColor) {
        throw new Error(
          "Mobile ecommerce home needs two color-bearing banners",
        );
      }
      heroRail.scrollLeft = nextHeroItem.offsetLeft;
      heroRail.dispatchEvent(
        new storyWindow.Event("scroll", { bubbles: true }),
      );
      if (
        getComputedStyle(page)
          .getPropertyValue("--ecommerce-home-atmosphere-color")
          .trim() !== nextHeroSurfaceColor
      ) {
        throw new Error(
          "Mobile ecommerce home atmosphere must follow the dominant banner in the same scroll event",
        );
      }
      heroRail.scrollLeft = visibleHeroItems[0]?.offsetLeft ?? 0;
      heroRail.dispatchEvent(
        new storyWindow.Event("scroll", { bubbles: true }),
      );

      if (
        stickyHeader?.hasAttribute("data-scrolled") ||
        stickyHeaderStyle.backgroundColor !== "rgba(0, 0, 0, 0)"
      ) {
        throw new Error(
          "Mobile ecommerce home header must be transparent at the top",
        );
      }

      storyWindow.scrollTo(0, 1);
      await new Promise<void>((resolve) =>
        storyWindow.requestAnimationFrame(() => resolve()),
      );
      if (
        !stickyHeader.hasAttribute("data-scrolled") ||
        getComputedStyle(stickyHeader).backgroundColor === "rgba(0, 0, 0, 0)"
      ) {
        throw new Error(
          "Mobile ecommerce home header must gain a background after scrolling",
        );
      }
      await new Promise<void>((resolve) =>
        storyWindow.setTimeout(resolve, 200),
      );
      const mobileBrand = stickyHeader.querySelector<HTMLElement>(
        '[data-slot="header-mobile-brand"]',
      );
      const mobileSearchRow = stickyHeader.querySelector<HTMLElement>(
        '[data-slot="header-mobile-search-row"]',
      );
      const mobileActions = stickyHeader.querySelector<HTMLElement>(
        '[data-slot="header-mobile-actions"]',
      );
      if (
        !mobileBrand ||
        !mobileSearchRow ||
        !mobileActions ||
        getComputedStyle(mobileBrand).opacity !== "0" ||
        getComputedStyle(mobileBrand).visibility !== "hidden" ||
        mobileSearchRow.getBoundingClientRect().top !==
          mobileActions.getBoundingClientRect().top
      ) {
        throw new Error(
          "Scrolled mobile ecommerce header must replace the logo row with search while keeping its actions",
        );
      }
      storyWindow.scrollTo(0, 0);
    }

    const main = page.querySelector<HTMLElement>(
      '[data-slot="ecommerce-home-main"]',
    );
    const expectedContentMaxWidth = "1920px";
    const contentContainers = main?.querySelectorAll<HTMLElement>(
      '[data-slot="hero-banner"], [data-slot="shortcut-rail-container"], [data-slot="billboard-link"], [data-slot="product-list-container"], [data-slot="brand-product-rail-container"], [data-slot="social-media-gallery-container"], [data-slot="trending-searches-container"]',
    );
    if (
      main?.dataset.contentMaxWidth !== expectedContentMaxWidth ||
      !contentContainers?.length ||
      Array.from(contentContainers).some(
        (container) =>
          getComputedStyle(container).maxWidth !== expectedContentMaxWidth,
      )
    ) {
      throw new Error(
        "Ecommerce home must apply one page-level maximum width to every main content container",
      );
    }
    const initialReveal = main?.querySelector<HTMLElement>(
      '[data-motion-reveal="initial"]',
    );
    const scrollReveals = main?.querySelectorAll<HTMLElement>(
      '[data-motion-reveal="scroll"]',
    );
    const waterfallMotionRoot = main?.querySelector<HTMLElement>(
      '[data-slot="ecommerce-home-section"][data-kind="products"] > [data-slot="product-list"][data-layout="waterfall"]',
    );
    const waterfallHeading = waterfallMotionRoot?.querySelector<HTMLElement>(
      '[data-slot="product-list-heading"]',
    );
    const waterfallTabs = waterfallMotionRoot?.querySelector<HTMLElement>(
      '[data-slot="product-list-container"] > [data-slot="tabs"]',
    );
    const waterfallRowItems = waterfallMotionRoot?.querySelectorAll<HTMLElement>(
      '[data-slot="product-list-item"]',
    );
    const waterfallLoadMore = waterfallMotionRoot?.querySelector<HTMLElement>(
      '[data-slot="product-list-load-more"]',
    );
    if (
      !initialReveal ||
      scrollReveals?.length !== 6 ||
      waterfallMotionRoot?.dataset.motionReveal !== undefined ||
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
        "Ecommerce home must match Topic Landing initial, section, heading, tabs and waterfall row reveal groups",
      );
    }
    if (main.dataset.motionReady === "true") {
      const previousInitialState = initialReveal.dataset.motionState;
      const previousInitialDirection = initialReveal.dataset.motionDirection;
      delete initialReveal.dataset.motionState;
      initialReveal.dataset.motionDirection = "down";
      const initialHiddenTranslateY = new DOMMatrixReadOnly(
        getComputedStyle(initialReveal).transform,
      ).m42;
      initialReveal.dataset.motionState = "visible";
      const initialVisibleStyle = getComputedStyle(initialReveal);
      // Snapshot the values before restoring the observed state. The computed
      // style object is live and otherwise follows that restoration.
      const initialTransitionDuration =
        initialVisibleStyle.transitionDuration;
      const initialTransitionTimingFunction =
        initialVisibleStyle.transitionTimingFunction;
      if (previousInitialState === undefined) {
        delete initialReveal.dataset.motionState;
      } else {
        initialReveal.dataset.motionState = previousInitialState;
      }
      if (previousInitialDirection === undefined) {
        delete initialReveal.dataset.motionDirection;
      } else {
        initialReveal.dataset.motionDirection = previousInitialDirection;
      }
      if (
        initialHiddenTranslateY !== 32 ||
        initialTransitionDuration !== "0.5s, 0.5s" ||
        initialTransitionTimingFunction !==
          "ease-in-out, ease-in-out"
      ) {
        throw new Error(
          `Ecommerce home initial reveal must match Topic Landing's 32px, 500ms ease-in-out entrance; got translateY=${initialHiddenTranslateY}px, duration="${initialTransitionDuration}", timing="${initialTransitionTimingFunction}"`,
        );
      }

      const compactRevealTargets = [
        ...Array.from(scrollReveals),
        waterfallHeading,
        waterfallTabs,
        ...Array.from(waterfallRowItems),
        waterfallLoadMore,
      ];
      for (const revealTarget of compactRevealTargets) {
        const previousMotionState = revealTarget.dataset.motionState;
        const previousMotionDirection =
          revealTarget.dataset.motionDirection;
        delete revealTarget.dataset.motionState;
        delete revealTarget.dataset.motionDirection;
        const hiddenTranslateY = new DOMMatrixReadOnly(
          getComputedStyle(revealTarget).transform,
        ).m42;

        revealTarget.dataset.motionDirection = "down";
        revealTarget.dataset.motionState = "visible";
        const visibleStyle = getComputedStyle(revealTarget);
        const transitionDurations =
          visibleStyle.transitionDuration.split(", ");
        const transitionTimings =
          visibleStyle.transitionTimingFunction.split(", ");

        revealTarget.dataset.motionDirection = "up";
        const upwardDuration =
          getComputedStyle(revealTarget).transitionDuration;

        if (previousMotionState === undefined) {
          delete revealTarget.dataset.motionState;
        } else {
          revealTarget.dataset.motionState = previousMotionState;
        }
        if (previousMotionDirection === undefined) {
          delete revealTarget.dataset.motionDirection;
        } else {
          revealTarget.dataset.motionDirection = previousMotionDirection;
        }

        if (
          hiddenTranslateY !== 24 ||
          transitionDurations.length !== 2 ||
          transitionDurations.some((duration) => duration !== "0.32s") ||
          transitionTimings.length !== 2 ||
          transitionTimings.some((timing) => timing !== "ease-out") ||
          upwardDuration !== "0s"
        ) {
          throw new Error(
            "Ecommerce home section reveals must use a 24px, 320ms ease-out entrance only while scrolling down",
          );
        }
      }
    }

    // The page shell no longer pins a 1024px floor — every section shrinks with
    // the viewport. The one exception is the footer, which has no mobile layout
    // and leaves the flow below --breakpoints-desktop instead of dragging the
    // page into a horizontal scroll.
    const isDesktop = page.getBoundingClientRect().width >= 1024;
    if (!isDesktop) {
      const sharedHeadings = Array.from(
        page.querySelectorAll<HTMLElement>(
          [
            '[data-slot="shortcut-rail-title"]',
            '[data-slot="product-list-heading"]',
            '[data-slot="trending-searches-heading"]',
            '[data-slot="social-media-gallery-heading"]',
            '[data-slot="brand-product-rail-heading"]',
            '[data-slot="review-list-heading"]',
          ].join(", "),
        ),
      );
      if (
        sharedHeadings.length === 0 ||
        sharedHeadings.some(
          (heading) => getComputedStyle(heading).paddingLeft !== "4px",
        )
      ) {
        throw new Error(
          "Mobile shared section headings must use 4px left padding",
        );
      }
    }
    const requiredSlots = [
      "header",
      "hero-banner",
      "shortcut-rail",
      "social-media-gallery",
      "brand-product-rail",
      ...(isDesktop ? ["footer"] : []),
    ];
    for (const slot of requiredSlots) {
      if (!page.querySelector(`[data-slot="${slot}"]`)) {
        throw new Error(`Ecommerce home is missing ${slot}`);
      }
    }

    const footer = page.querySelector<HTMLElement>('[data-slot="footer"]');
    if (
      footer &&
      getComputedStyle(footer).display !== (isDesktop ? "block" : "none")
    ) {
      throw new Error(
        isDesktop
          ? "Footer must render at 1024px and up"
          : "Footer has no mobile layout and must drop out below 1024px",
      );
    }

    const hero = page.querySelector<HTMLElement>('[data-slot="hero-banner"]');
    if (!hero) throw new Error("Ecommerce home hero did not render");
    const heroStyle = getComputedStyle(hero);
    if (
      heroStyle.borderTopWidth !== "0px" ||
      heroStyle.borderBottomWidth !== "0px"
    ) {
      throw new Error("Ecommerce home hero must not render a section divider");
    }

    const heroFrame = page.querySelector<HTMLElement>(
      '[data-slot="ecommerce-home-hero"]',
    );
    if (!heroFrame) throw new Error("Ecommerce home hero frame did not render");
    const heroFrameStyle = getComputedStyle(heroFrame);
    if (
      heroFrameStyle.paddingTop !== "0px" ||
      heroFrameStyle.paddingBottom !== "0px"
    ) {
      throw new Error("Ecommerce home hero frame must have no vertical padding");
    }

    const trendingSearches = page.querySelector<HTMLElement>(
      '[data-slot="trending-searches"]',
    );
    if (!trendingSearches) {
      throw new Error("Ecommerce home trending searches did not render");
    }
    const trendingSearchesStyle = getComputedStyle(trendingSearches);
    const expectedTrendingSearchesBorderWidth = isDesktop ? "1px" : "0px";
    if (
      trendingSearches.dataset.dividerPosition !== "top" ||
      trendingSearches.dataset.dividerVariant !== "gray" ||
      trendingSearchesStyle.borderTopWidth !==
        expectedTrendingSearchesBorderWidth ||
      trendingSearchesStyle.borderBottomWidth !== "0px"
    ) {
      throw new Error(
        `Ecommerce home trending searches must use a gray ${expectedTrendingSearchesBorderWidth} top divider at this viewport`,
      );
    }

    const shortcutRail = page.querySelector<HTMLElement>(
      '[data-slot="shortcut-rail"]',
    );
    if (!shortcutRail) throw new Error("Ecommerce home shortcut rail did not render");
    if (
      (heroFrame.compareDocumentPosition(shortcutRail) &
        Node.DOCUMENT_POSITION_FOLLOWING) ===
      0
    ) {
      throw new Error("Ecommerce home shortcut rail must render below the hero");
    }

    const sectionsFrame = page.querySelector<HTMLElement>(
      '[data-slot="ecommerce-home-sections"]',
    );
    if (!sectionsFrame) {
      throw new Error("Ecommerce home sections frame did not render");
    }
    const sectionsStyle = getComputedStyle(sectionsFrame);
    const expectedSectionsGap = isDesktop
      ? "0px"
      : getComputedStyle(page)
          .getPropertyValue("--layout-page-margin-card")
          .trim();
    if (
      sectionsStyle.gap !== expectedSectionsGap ||
      sectionsStyle.paddingTop !== "0px" ||
      sectionsStyle.paddingBottom !== "0px"
    ) {
      throw new Error(
        `Ecommerce home sections must use a ${expectedSectionsGap} vertical gap`,
      );
    }
    const sectionFrames = Array.from(
      sectionsFrame.querySelectorAll<HTMLElement>(
        '[data-slot="ecommerce-home-section"]',
      ),
    );
    for (let index = 1; index < sectionFrames.length; index += 1) {
      const previous = sectionFrames[index - 1];
      const current = sectionFrames[index];
      if (
        Math.abs(
          current.offsetTop -
            (previous.offsetTop + previous.offsetHeight) -
            Number.parseFloat(expectedSectionsGap),
        ) > 1
      ) {
        throw new Error(
          `Ecommerce home sections must preserve a ${expectedSectionsGap} vertical gap`,
        );
      }
    }

    // Every products section owns a ProductList directly, whatever the page
    // ends up carrying. Counting them instead pinned the page to the two it
    // happened to have and broke on the next section added.
    const productSections = Array.from(
      sectionsFrame.querySelectorAll<HTMLElement>(
        ':scope > [data-slot="ecommerce-home-section"][data-kind="products"]',
      ),
    );
    if (productSections.length === 0) {
      throw new Error("Ecommerce home rendered no product sections");
    }
    const orphan = productSections.find(
      (section) =>
        !section.querySelector(':scope > [data-slot="product-list"]'),
    );
    if (orphan) {
      throw new Error(
        `Products section ${orphan.id || "(unnamed)"} did not render a ProductList`,
      );
    }

    // The waterfall feed runs on ProductList's own catalogue and categories.
    // Counting is not enough — the page carried its own eight products three
    // times over and would have passed any count check — so this compares the
    // rendered titles and tab labels against the fixture the component uses.
    const waterfall = page.querySelector<HTMLElement>(
      '[data-slot="ecommerce-home-section"] > [data-slot="product-list"][data-layout="waterfall"]',
    );
    if (!waterfall) throw new Error("Ecommerce home waterfall did not render");
    if (!isDesktop) {
      const waterfallList = waterfall.querySelector<HTMLElement>(
        '[data-slot="product-list-items"]',
      );
      if (!waterfallList) {
        throw new Error("Ecommerce home mobile waterfall list did not render");
      }
      const waterfallListStyle = getComputedStyle(waterfallList);
      if (
        waterfallListStyle.paddingTop !== "0px" ||
        waterfallListStyle.paddingRight !== "0px" ||
        waterfallListStyle.paddingBottom !== "0px" ||
        waterfallListStyle.paddingLeft !== "0px" ||
        waterfallListStyle.rowGap !== "8px"
      ) {
        throw new Error(
          "Ecommerce home mobile waterfall must use zero list padding and an 8px row gap",
        );
      }
    }
    const locale = localeFromGlobals(globals.locale);
    const soldLabels = Array.from(
      page.querySelectorAll<HTMLElement>('[data-slot="product-card-sold"]'),
    ).map((label) => label.textContent?.trim() ?? "");
    if (soldLabels.length === 0) {
      throw new Error("Ecommerce home rendered no product sales labels");
    }
    if (
      locale === "zh"
        ? soldLabels.some(
            (label) => !label.includes("周销 ") || label.includes("销量"),
          )
        : soldLabels.some((label) => !label.includes("Sold"))
    ) {
      throw new Error(
        locale === "zh"
          ? "Chinese product cards must label sales as 周销"
          : "English product cards must retain the Sold label",
      );
    }
    const productBadgeLabels = Array.from(
      page.querySelectorAll<HTMLElement>(
        '[data-slot="product-card-badges"] > [data-slot="badge"]',
      ),
    ).map((label) => label.textContent?.trim() ?? "");
    if (!productBadgeLabels.includes("Low Price")) {
      throw new Error("Product cards must render the Low Price badge in English");
    }
    const translatedBadge = productBadgeLabels.find((label) =>
      /[\u3400-\u9fff]/u.test(label),
    );
    if (translatedBadge) {
      throw new Error(
        `Product card badges must stay in English, received "${translatedBadge}"`,
      );
    }
    const expectedProducts = createProductListProducts(locale).map(
      (product) => product.title,
    );
    const renderedProducts = Array.from(
      waterfall.querySelectorAll<HTMLElement>('[data-slot="product-card"]'),
    ).map((card) => card.querySelector("a[href*='products']")?.textContent?.trim());
    const missingProduct = expectedProducts.find(
      (title) => !renderedProducts.includes(title),
    );
    if (renderedProducts.length !== expectedProducts.length || missingProduct) {
      throw new Error(
        `The waterfall must carry ProductList's catalogue: ${renderedProducts.length} of ${expectedProducts.length} products, missing "${missingProduct ?? "none"}"`,
      );
    }
    const expectedTabs = createProductListTabs(locale).map((tab) => tab.label);
    const renderedTabs = Array.from(
      waterfall.querySelectorAll<HTMLElement>('[role="tab"]'),
    ).map((tab) => tab.textContent?.trim());
    if (
      renderedTabs.length !== expectedTabs.length ||
      expectedTabs.some((label, index) => renderedTabs[index] !== label)
    ) {
      throw new Error(
        `The waterfall must carry ProductList's categories, got ${renderedTabs.join(", ")}`,
      );
    }

    const atmosphericSection = page.querySelector<HTMLElement>(
      '[data-slot="ecommerce-home-section"][data-kind="products"][data-appearance="atmospheric"]',
    );
    if (!atmosphericSection) {
      throw new Error("Ecommerce home atmospheric section did not render");
    }
    const atmosphericProductList = page.querySelector<HTMLElement>(
      '[data-slot="product-list"][data-appearance="atmospheric"]',
    );
    if (!atmosphericProductList) {
      throw new Error("Ecommerce home atmospheric product list did not render");
    }
    // The band opens on a gray rule and draws it itself. The page holds no
    // divider CSS, so the section wrapper stays bare.
    const atmosphericSectionStyle = getComputedStyle(atmosphericSection);
    const atmosphericProductListStyle = getComputedStyle(atmosphericProductList);
    if (
      atmosphericSection.getAttribute("data-divider-position") !== "top" ||
      atmosphericSection.getAttribute("data-divider-variant") !== "gray" ||
      atmosphericSectionStyle.borderTopWidth !== "0px" ||
      atmosphericSectionStyle.borderBottomWidth !== "0px"
    ) {
      throw new Error(
        "Ecommerce home must ask for a gray top rule and paint none of it itself",
      );
    }
    const expectedAtmosphericBorderWidth = isDesktop ? "1px" : "0px";
    if (
      atmosphericProductList.getAttribute("data-divider-position") !== "top" ||
      atmosphericProductListStyle.borderTopWidth !==
        expectedAtmosphericBorderWidth
    ) {
      throw new Error(
        `Atmospheric band must use a ${expectedAtmosphericBorderWidth} top rule at this viewport, got ${atmosphericProductListStyle.borderTopWidth}`,
      );
    }

    // The point of the two-layer split: the rule spans the section and sits on
    // the boundary with the section above, rather than inside the tinted panel.
    // Asserting the geometry, since a rule on the wrong box still computes to
    // 1px and would pass every check above.
    const bandBox = atmosphericProductList.getBoundingClientRect();
    const sectionBox = atmosphericSection.getBoundingClientRect();
    if (Math.abs(bandBox.width - sectionBox.width) > 1) {
      throw new Error(
        `Atmospheric band must span its section for the rule to reach the page edges, got ${bandBox.width}px of ${sectionBox.width}px`,
      );
    }
    if (Math.abs(bandBox.top - sectionBox.top) > 1) {
      throw new Error(
        `Atmospheric band must start where its section does, sat ${bandBox.top - sectionBox.top}px lower`,
      );
    }
    const panel = atmosphericProductList.querySelector<HTMLElement>(
      '[data-slot="product-list-container"]',
    );
    if (!panel) throw new Error("Atmospheric campaign panel did not render");
    const panelBox = panel.getBoundingClientRect();
    const panelTopOffset = panelBox.top - bandBox.top;
    if (
      panelBox.left - bandBox.left < 1 ||
      (isDesktop ? panelTopOffset < 1 : Math.abs(panelTopOffset) > 1)
    ) {
      throw new Error(
        isDesktop
          ? "The campaign panel must be inset inside the desktop band"
          : "The mobile campaign panel must be horizontally inset and top-aligned with its band",
      );
    }

    // Each section carries the kind the page assigned it, however many the
    // fixture ends up with — a fixed count only recorded how many existed the
    // day it was written.
    const sections = Array.from(
      page.querySelectorAll<HTMLElement>(
        '[data-slot="ecommerce-home-section"]',
      ),
    );
    if (sections.length === 0) {
      throw new Error("Ecommerce home rendered no sections");
    }
    const kinds = new Set([
      "products",
      "social",
      "brands",
      "billboard",
      "searches",
    ]);
    const strayKind = sections.find(
      (section) => !kinds.has(section.dataset.kind ?? ""),
    );
    if (strayKind) {
      throw new Error(
        `Homepage section ${strayKind.id || "(unnamed)"} declared an unknown kind "${strayKind.dataset.kind}"`,
      );
    }

    if (page.scrollWidth > page.clientWidth + 1) {
      throw new Error(
        `Ecommerce home must not overflow horizontally: ${page.scrollWidth}px > ${page.clientWidth}px`,
      );
    }
    // The page element is not enough: an absolutely positioned element with no
    // positioned ancestor escapes both the page and every scroll container,
    // and holds the document itself open. A sr-only span in TrendingSearches
    // did exactly that — page.scrollWidth read clean while the document
    // scrolled to 2417px.
    const doc = page.ownerDocument.documentElement;
    if (doc.scrollWidth > doc.clientWidth + 1) {
      throw new Error(
        `The document must not scroll horizontally: ${doc.scrollWidth}px > ${doc.clientWidth}px`,
      );
    }
  },
};

export const SearchFocused: Story = {
  name: "Search — Focused",
  globals: {
    locale: "en",
    viewport: { value: "yamiDesktopXl", isRotated: false },
  },
  render: () => (
    <EcommerceHomeTemplate {...createEcommerceHomeFixture("en")} />
  ),
  play: async ({ canvasElement }) => {
    const field = canvasElement.querySelector<HTMLInputElement>(
      '[data-slot="header-search"][data-variant="pc"] [data-slot="header-search-field"]',
    );
    if (!field) throw new Error("PC search field did not render");

    await userEvent.click(field);

    const panel = canvasElement.querySelector<HTMLElement>(
      '[data-slot="header-search-panel"]',
    );
    const scrim = canvasElement.querySelector<HTMLElement>(
      '[data-slot="header-search"] [aria-label="Close search"]',
    );
    const matchaLink = panel?.querySelector<HTMLAnchorElement>(
      'a[href*="yami-pages-topic-landing-page-topic--pc"]',
    );
    const matchaSearchLink = panel?.querySelector<HTMLAnchorElement>(
      'a[href*="yami-pages-search-results--results"]',
    );
    if (
      panel?.dataset.state !== "discovery" ||
      !scrim ||
      matchaLink?.textContent?.trim() !== "matcha" ||
      matchaSearchLink?.textContent?.trim() !== "matcha powder" ||
      !panel.textContent?.includes("Recent Searches") ||
      !panel.textContent.includes("Popular Searches") ||
      !panel.textContent.includes("Hot Deals") ||
      getComputedStyle(panel).borderRadius !== "16px"
    ) {
      throw new Error("Focused search must match the Figma discovery state");
    }
  },
};

export const SearchWithQuery: Story = {
  name: "Search — With Query",
  globals: {
    locale: "en",
    viewport: { value: "yamiDesktopXl", isRotated: false },
  },
  render: () => (
    <EcommerceHomeTemplate {...createEcommerceHomeFixture("en")} />
  ),
  play: async ({ canvasElement }) => {
    const field = canvasElement.querySelector<HTMLInputElement>(
      '[data-slot="header-search"][data-variant="pc"] [data-slot="header-search-field"]',
    );
    if (!field) throw new Error("PC search field did not render");

    await userEvent.click(field);
    await userEvent.type(field, "mat");

    const panel = canvasElement.querySelector<HTMLElement>(
      '[data-slot="header-search-panel"]',
    );
    const suggestions = panel?.querySelectorAll("button");
    const firstSuggestion = suggestions?.item(0);
    if (
      field.value !== "mat" ||
      panel?.dataset.state !== "suggestions" ||
      suggestions?.length !== 12 ||
      firstSuggestion?.textContent?.trim() !== "mat" ||
      getComputedStyle(firstSuggestion).borderColor !== "rgba(0, 0, 0, 0.87)"
    ) {
      throw new Error("Typed search must match the Figma keyword state");
    }
  },
};

export const Mobile: Story = {
  name: "Mobile",
  globals: {
    viewport: { value: "yamiMobile", isRotated: false },
  },
  render: (_args, { globals }) => (
    <EcommerceHomeTemplate
      {...createEcommerceHomeFixture(localeFromGlobals(globals.locale))}
    />
  ),
  play: Pc.play,
};
