import type { Meta, StoryObj } from "@storybook/react-vite";

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
    const waterfallRowItems = main?.querySelectorAll<HTMLElement>(
      '[data-motion-reveal="waterfall-row"]',
    );
    const waterfallLoadMore = main?.querySelector<HTMLElement>(
      '[data-slot="product-list-load-more"]',
    );
    if (
      !initialReveal ||
      scrollReveals?.length !== 6 ||
      !waterfallRowItems ||
      waterfallRowItems.length <= 6 ||
      waterfallLoadMore?.dataset.motionReveal !== "waterfall-row" ||
      main?.dataset.motionReady === undefined
    ) {
      throw new Error(
        "Ecommerce home must expose initial, section and waterfall row reveal groups",
      );
    }

    // The page shell no longer pins a 1024px floor — every section shrinks with
    // the viewport. The one exception is the footer, which has no mobile layout
    // and leaves the flow below --breakpoints-desktop instead of dragging the
    // page into a horizontal scroll.
    const isDesktop = page.getBoundingClientRect().width >= 1024;
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
    if (
      sectionsStyle.gap !== "0px" ||
      sectionsStyle.paddingTop !== "0px" ||
      sectionsStyle.paddingBottom !== "0px"
    ) {
      throw new Error("Ecommerce home sections must not add vertical spacing");
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
          current.offsetTop - (previous.offsetTop + previous.offsetHeight),
        ) > 1
      ) {
        throw new Error("Ecommerce home sections must touch vertically");
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
    if (
      atmosphericProductList.getAttribute("data-divider-position") !== "top" ||
      atmosphericProductListStyle.borderTopWidth !== "1px"
    ) {
      throw new Error(
        `Atmospheric band must draw a 1px rule on its own top edge, got ${atmosphericProductListStyle.borderTopWidth}`,
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
    if (panelBox.left - bandBox.left < 1 || panelBox.top - bandBox.top < 1) {
      throw new Error(
        "The campaign panel must be inset inside the band, not fill it — otherwise the rule has no boundary to sit on",
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
