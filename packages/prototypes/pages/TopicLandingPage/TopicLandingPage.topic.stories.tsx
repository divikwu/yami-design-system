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

export const PcImageCardCategories: Story = {
  name: "Topic — PC · Image cards",
  render: (_args, { globals }) => {
    const locale = globals.locale === "zh" ? "zh" : "en";
    const localizedArgs = createTopicKeywordLandingPageFixture(locale);

    return (
      <TopicLandingPage
        {...localizedArgs}
        shortcutRail={{
          ...localizedArgs.shortcutRail,
          presentation: "image-card",
          items: localizedArgs.shortcutRail.items.slice(0, 5),
        }}
      />
    );
  },
  play: async ({ canvasElement }) => {
    const root = canvasElement.querySelector<HTMLElement>(
      '[data-slot="shortcut-rail"]',
    );
    const list = canvasElement.querySelector<HTMLElement>(
      '[data-slot="shortcut-rail-list"]',
    );
    const surface = canvasElement.querySelector<HTMLElement>(
      '[data-slot="shortcut-rail-surface"]',
    );
    const container = canvasElement.querySelector<HTMLElement>(
      '[data-slot="shortcut-rail-container"]',
    );
    const items = list?.querySelectorAll<HTMLElement>("li");
    const firstImage = items?.item(0).querySelector<HTMLElement>(
      '[data-image-presentation="full-bleed"]',
    );
    const firstLabel = items?.item(0).querySelector<HTMLElement>(
      '[data-slot="shortcut-rail-label"]',
    );
    const firstOverlay = firstImage?.querySelector<HTMLElement>(
      '[data-slot="shortcut-rail-image-card-overlay"]',
    );
    const firstScrim = firstImage?.querySelector<HTMLElement>(
      '[data-slot="shortcut-rail-image-card-scrim"]',
    );
    const fallbackLabel = firstImage?.nextElementSibling as HTMLElement | null;
    const firstMedia = firstImage?.querySelector<HTMLImageElement>("img");

    if (
      !root ||
      !surface ||
      !container ||
      !list ||
      !items ||
      !firstImage ||
      !firstLabel ||
      !firstOverlay ||
      !firstScrim ||
      !fallbackLabel ||
      !firstMedia
    ) {
      throw new Error("Image-card Shortcut Rail did not render");
    }

    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

    const listRect = list.getBoundingClientRect();
    const firstRect = items.item(0).getBoundingClientRect();
    const lastRect = items.item(items.length - 1).getBoundingClientRect();
    const expectedCardWidth = Math.max(160, (listRect.width - 5 * 16) / 6);
    const imageRect = firstImage.getBoundingClientRect();
    const mediaRect = firstMedia.getBoundingClientRect();
    const imageStyle = getComputedStyle(firstImage);
    const mediaStyle = getComputedStyle(firstMedia);
    const labelStyle = getComputedStyle(firstLabel);
    const labelRect = firstLabel.getBoundingClientRect();
    const overlayStyle = getComputedStyle(firstOverlay);
    const scrimStyle = getComputedStyle(firstScrim);
    const fallbackLabelStyle = getComputedStyle(fallbackLabel);
    const surfaceStyle = getComputedStyle(surface);
    const containerStyle = getComputedStyle(container);

    if (
      root.dataset.presentation !== "image-card" ||
      root.dataset.desktopPresentation !== "image-card" ||
      surfaceStyle.backgroundColor !== "rgb(245, 245, 245)" ||
      containerStyle.rowGap !== "24px" ||
      items.length < 1 ||
      items.length > 6 ||
      Math.abs(firstRect.width - expectedCardWidth) > 1 ||
      (items.length < 6
        ? lastRect.right >= listRect.right - 1
        : Math.abs(lastRect.right - listRect.right) > 1) ||
      imageStyle.borderRadius !== "8px" ||
      Math.abs(imageRect.width / imageRect.height - 4 / 3) > 0.01 ||
      Math.abs(mediaRect.width - imageRect.width) > 1 ||
      Math.abs(mediaRect.width / mediaRect.height - 1) > 0.01 ||
      Math.abs(
        (mediaRect.top + mediaRect.bottom) / 2 -
          (imageRect.top + imageRect.bottom) / 2,
      ) > 1 ||
      mediaStyle.objectPosition !== "50% 50%" ||
      firstImage.getAttribute("aria-hidden") !== null ||
      !firstImage.contains(firstLabel) ||
      firstScrim.dataset.adaptiveImageScrim !== "true" ||
      overlayStyle.position !== "absolute" ||
      overlayStyle.padding !== "32px 8px 8px" ||
      overlayStyle
        .getPropertyValue("--adaptive-image-scrim-surface-color")
        .trim() ||
      !scrimStyle.backgroundImage.includes("0 0 0 / 0.6") ||
      fallbackLabelStyle.display !== "none" ||
      labelStyle.fontSize !== "16px" ||
      labelStyle.lineHeight !== "20px" ||
      Math.abs(labelRect.height - 20) > 1 ||
      labelStyle.fontWeight !== "400" ||
      labelStyle.color !== "rgb(255, 255, 255)" ||
      labelStyle.textAlign !== "left" ||
      labelRect.top < imageRect.top ||
      labelRect.bottom > imageRect.bottom ||
      canvasElement.querySelector('[data-slot="shortcut-rail-edge"]')
    ) {
      throw new Error(
        "PC image-card shortcuts must use six-column sizing with centered square media in 4:3 frames, white labels over a 60% black translucent scrim, and no paging controls",
      );
    }
  },
};

export const PcImageCardCategoriesMinimumWidth: Story = {
  ...PcImageCardCategories,
  name: "Topic — PC 1024 · Image cards",
  globals: {
    viewport: { value: "yamiDesktop", isRotated: false },
  },
};

export const PcImageCardCategoriesSix: Story = {
  ...PcImageCardCategories,
  name: "Topic — PC 1024 · 6 image cards",
  globals: {
    viewport: { value: "yamiDesktop", isRotated: false },
  },
  render: (_args, { globals }) => {
    const locale = globals.locale === "zh" ? "zh" : "en";
    const localizedArgs = createTopicKeywordLandingPageFixture(locale);

    return (
      <TopicLandingPage
        {...localizedArgs}
        shortcutRail={{
          ...localizedArgs.shortcutRail,
          presentation: "image-card",
          items: localizedArgs.shortcutRail.items.slice(0, 6),
        }}
      />
    );
  },
  play: async ({ canvasElement }) => {
    const list = canvasElement.querySelector<HTMLElement>(
      '[data-slot="shortcut-rail-list"]',
    );

    if (!list || list.children.length !== 6) {
      throw new Error("Six-card Shortcut Rail did not render");
    }

    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

    const nextEdge = canvasElement.querySelector<HTMLElement>(
      '[data-slot="shortcut-rail-edge"][data-direction="next"]',
    );
    const nextButton = nextEdge?.querySelector<HTMLButtonElement>("button");
    const firstOverlay = canvasElement.querySelector<HTMLElement>(
      '[data-slot="shortcut-rail-image-card-overlay"]',
    );
    const listRect = list.getBoundingClientRect();
    const buttonRect = nextButton?.getBoundingClientRect();
    const buttonCenterDelta = buttonRect
      ? buttonRect.top + buttonRect.height / 2 -
        (listRect.top + listRect.height / 2)
      : Number.POSITIVE_INFINITY;

    if (
      getComputedStyle(list).overflowX !== "auto" ||
      list.scrollWidth <= list.clientWidth ||
      !nextButton ||
      !nextEdge ||
      !firstOverlay ||
      Number.parseInt(getComputedStyle(nextEdge).zIndex, 10) <=
        Number.parseInt(getComputedStyle(firstOverlay).zIndex, 10) ||
      Math.abs(buttonCenterDelta) > 1
    ) {
      throw new Error(
        "Six large PC image cards must vertically center the control, keep its mask above the label scrim, and use shared horizontal rail behavior at the 1024px boundary",
      );
    }

    nextButton.click();

    for (let frame = 0; frame < 60 && list.scrollLeft <= 1; frame += 1) {
      await new Promise<void>((resolve) =>
        requestAnimationFrame(() => resolve()),
      );
    }

    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

    if (
      list.scrollLeft <= 1 ||
      !canvasElement.querySelector(
        '[data-slot="shortcut-rail-edge"][data-direction="previous"]',
      )
    ) {
      throw new Error(
        "Six-card Shortcut Rail next control must scroll the list and reveal the previous control",
      );
    }
  },
};

export const PcImageCardCategoriesSeven: Story = {
  name: "Topic — PC · 7 compact entries",
  render: (_args, { globals }) => {
    const locale = globals.locale === "zh" ? "zh" : "en";
    const localizedArgs = createTopicKeywordLandingPageFixture(locale);
    const firstItem = localizedArgs.shortcutRail.items[0]!;

    return (
      <TopicLandingPage
        {...localizedArgs}
        shortcutRail={{
          ...localizedArgs.shortcutRail,
          presentation: "image-card",
          items: [
            ...localizedArgs.shortcutRail.items,
            { ...firstItem, id: `${firstItem.id}-overflow` },
          ],
        }}
      />
    );
  },
  play: async ({ canvasElement }) => {
    const root = canvasElement.querySelector<HTMLElement>(
      '[data-slot="shortcut-rail"]',
    );
    const list = canvasElement.querySelector<HTMLElement>(
      '[data-slot="shortcut-rail-list"]',
    );
    const items = list?.querySelectorAll<HTMLElement>("li");
    const firstImage = items?.item(0).querySelector<HTMLElement>(
      '[data-image-presentation="full-bleed"]',
    );
    const fallbackLabel = firstImage?.nextElementSibling as HTMLElement | null;

    if (!root || !list || !items || !firstImage || !fallbackLabel) {
      throw new Error("Seven-item Shortcut Rail did not render");
    }

    const imageRect = firstImage.getBoundingClientRect();

    if (
      root.dataset.presentation !== "image-card" ||
      root.dataset.desktopPresentation !== "compact" ||
      items.length !== 7 ||
      getComputedStyle(list).display !== "flex" ||
      Math.abs(imageRect.width - 96) > 1 ||
      Math.abs(imageRect.height - 96) > 1 ||
      firstImage.querySelector(
        '[data-slot="shortcut-rail-image-card-overlay"]',
      ) ||
      getComputedStyle(fallbackLabel).display === "none"
    ) {
      throw new Error(
        "Image-card presentation must fall back to 96px circular PC entries above six items",
      );
    }
  },
};

export const MobileImageCardCategories: Story = {
  ...PcImageCardCategories,
  name: "Topic — Mobile · Image cards",
  globals: {
    viewport: { value: "yamiMobile", isRotated: false },
  },
  play: async ({ canvasElement }) => {
    const root = canvasElement.querySelector<HTMLElement>(
      '[data-slot="shortcut-rail"]',
    );
    const firstItem = canvasElement.querySelector<HTMLElement>(
      '[data-slot="shortcut-rail-list"] li',
    );
    const firstImage = firstItem?.querySelector<HTMLElement>(
      '[data-image-presentation="full-bleed"]',
    );
    const firstMedia = firstImage?.querySelector<HTMLImageElement>("img");
    const firstOverlay = firstImage?.querySelector<HTMLElement>(
      '[data-slot="shortcut-rail-image-card-overlay"]',
    );
    const edge = canvasElement.querySelector<HTMLElement>(
      '[data-slot="shortcut-rail-edge"]',
    );

    if (!root || !firstItem || !firstImage || !firstMedia) {
      throw new Error("Mobile image-card Shortcut Rail did not render");
    }

    const itemRect = firstItem.getBoundingClientRect();
    const imageRect = firstImage.getBoundingClientRect();
    const mediaRect = firstMedia.getBoundingClientRect();

    if (
      root.dataset.presentation !== "image-card" ||
      Math.abs(itemRect.width - 68) > 1 ||
      Math.abs(imageRect.width - 64) > 1 ||
      Math.abs(imageRect.height - 64) > 1 ||
      Math.abs(mediaRect.width - 64) > 1 ||
      Math.abs(mediaRect.height - 64) > 1 ||
      (firstOverlay && getComputedStyle(firstOverlay).display !== "none") ||
      (edge && getComputedStyle(edge).display !== "none")
    ) {
      throw new Error(
        "Mobile image-card shortcuts must use 64px circular imagery inside the existing 68px compact rail without paging controls",
      );
    }
  },
};

export const MobileImageCardCategoriesSeven: Story = {
  ...PcImageCardCategoriesSeven,
  name: "Topic — Mobile · 7 entries",
  globals: {
    viewport: { value: "yamiMobile", isRotated: false },
  },
  play: MobileImageCardCategories.play,
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
