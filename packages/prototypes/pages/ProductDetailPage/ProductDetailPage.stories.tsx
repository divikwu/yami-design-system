import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent } from "storybook/test";

import addIcon from "../../../design-system/assets/icons/system/add.svg?inline";
import minusIcon from "../../../design-system/assets/icons/system/minus.svg?inline";
import { ProductDetailPage } from "./ProductDetailPage";
import { createProductDetailPageFixture } from "./fixtures";

function verifyWriteReviewIcon(canvasElement: HTMLElement) {
  const button = canvasElement.querySelector<HTMLElement>(
    '[data-slot="product-detail-write-review"]'
  );
  const icon = button?.querySelector<HTMLElement>(
    '[data-slot="product-detail-write-review-icon"]'
  );

  if (
    !button ||
    !icon ||
    button.firstElementChild !== icon ||
    icon.getAttribute("aria-hidden") !== "true" ||
    getComputedStyle(button).display !== "flex" ||
    getComputedStyle(button).alignItems !== "center" ||
    getComputedStyle(button).columnGap !== "4px" ||
    getComputedStyle(icon).width !== "16px" ||
    getComputedStyle(icon).height !== "16px" ||
    getComputedStyle(icon).maskImage === "none"
  ) {
    throw new Error(
      "PDP write-review action must lead with the decorative 16px post-drafts icon, centered with a 4px gap"
    );
  }
}

function verifyOptionChipWeights(root: HTMLElement, selectedWeight: "500" | "600") {
  const chips = root.querySelectorAll<HTMLElement>(
    '[data-slot="product-detail-options"] [data-slot="filter-chip"]'
  );
  if (chips.length !== 8 || Array.from(chips).some((chip) =>
    chip.getBoundingClientRect().height !== 40 ||
    getComputedStyle(chip, "::before").height !== "44px" ||
    getComputedStyle(chip).fontWeight !== (chip.getAttribute("aria-pressed") === "true" ? selectedWeight : "400")
  )) {
    throw new Error("PDP options must be 40px high with 44px hit areas; only selected options use language-aware emphasis");
  }
}

async function verifyDetailDisclosures(
  details: HTMLElement,
  expectedContentSpacing: {
    paddingTop: string;
    paddingBottom: string;
    marginBottom: string;
  }
) {
  const modules = Array.from(
    details.querySelectorAll<HTMLElement>("[data-pdp-detail-module]")
  );
  const triggers = Array.from(
    details.querySelectorAll<HTMLButtonElement>(
      '[data-slot="product-detail-disclosure-trigger"]'
    )
  );
  const contents = Array.from(
    details.querySelectorAll<HTMLElement>(
      '[data-slot="product-detail-disclosure-content"]'
    )
  );
  const arrows = Array.from(
    details.querySelectorAll<HTMLElement>(
      '[data-slot="product-detail-disclosure-arrow"]'
    )
  );
  const defaultExpanded = [true, true, false];
  const initialArrowMasks = arrows.map(
    (arrow) => getComputedStyle(arrow).maskImage
  );

  if (
    modules.length !== 3 ||
    triggers.length !== 3 ||
    contents.length !== 3 ||
    arrows.length !== 3 ||
    triggers.some(
      (trigger, index) => {
        const expanded = defaultExpanded[index]!;
        const content = contents[index]!;
        return (
          trigger.getAttribute("aria-expanded") !== String(expanded) ||
          getComputedStyle(trigger).fontSize !== "16px" ||
          getComputedStyle(trigger).fontWeight !== "500" ||
          trigger.getAttribute("aria-controls") !== contents[index]?.id ||
          content.hidden !== !expanded ||
          modules[index]?.dataset.expanded !== String(expanded) ||
          Math.round(trigger.getBoundingClientRect().height) < 44 ||
          Math.abs(
            trigger.getBoundingClientRect().right -
              arrows[index]!.getBoundingClientRect().right
          ) > 1 ||
          Math.round(arrows[index]!.getBoundingClientRect().width) !== 16 ||
          Math.round(arrows[index]!.getBoundingClientRect().height) !== 16 ||
          arrows[index]!.dataset.direction !== (expanded ? "up" : "down") ||
          initialArrowMasks[index] !==
            `url("${expanded ? minusIcon : addIcon}")` ||
          (expanded &&
            (getComputedStyle(content).paddingTop !==
              expectedContentSpacing.paddingTop ||
              getComputedStyle(content).paddingBottom !==
                expectedContentSpacing.paddingBottom ||
              getComputedStyle(content).marginBottom !==
                expectedContentSpacing.marginBottom))
        );
      }
    )
  ) {
    throw new Error(
      "PDP detail modules must initially show highlights and specifications while keeping the disclaimer collapsed"
    );
  }

  for (const [index, trigger] of triggers.entries()) {
    if (defaultExpanded[index]) {
      await userEvent.click(trigger);
    }
  }

  const collapsedArrowMasks = arrows.map(
    (arrow) => getComputedStyle(arrow).maskImage
  );

  if (collapsedArrowMasks.some((mask) => mask !== `url("${addIcon}")`)) {
    throw new Error("Collapsed PDP detail modules must use the system add icon");
  }

  for (const [index, trigger] of triggers.entries()) {
    await userEvent.click(trigger);
    if (
      trigger.getAttribute("aria-expanded") !== "true" ||
      contents[index]?.hidden ||
      modules[index]?.dataset.expanded !== "true" ||
      getComputedStyle(contents[index]!).paddingTop !==
        expectedContentSpacing.paddingTop ||
      getComputedStyle(contents[index]!).paddingBottom !==
        expectedContentSpacing.paddingBottom ||
      getComputedStyle(contents[index]!).marginBottom !==
        expectedContentSpacing.marginBottom ||
      arrows[index]!.dataset.direction !== "up" ||
      getComputedStyle(arrows[index]!).maskImage !== `url("${minusIcon}")` ||
      triggers.some(
        (otherTrigger, otherIndex) =>
          otherIndex !== index &&
          (otherTrigger.getAttribute("aria-expanded") !== "false" ||
            !contents[otherIndex]?.hidden)
      )
    ) {
      throw new Error(
        "Each PDP detail disclosure must expand independently when its title row is clicked"
      );
    }

    trigger.focus();
    await userEvent.keyboard("{Enter}");
    if (
      trigger.getAttribute("aria-expanded") !== "false" ||
      !contents[index]?.hidden ||
      modules[index]?.dataset.expanded !== "false" ||
      getComputedStyle(arrows[index]!).maskImage !== `url("${addIcon}")`
    ) {
      throw new Error(
        "PDP detail disclosure buttons must support keyboard collapse"
      );
    }
  }
}

const meta = {
  title: "YAMI/Pages/Product Detail",
  component: ProductDetailPage,
  parameters: {
    layout: "fullscreen",
    controls: { disable: true },
    docs: {
      description: {
        component:
          "Responsive YAMI PDP based on the live Torriden product information architecture, with the original stacked media stream replaced by ProductMediaGallery's single-window interaction.",
      },
      story: { inline: false, height: "1800px" },
    },
  },
  argTypes: {
    contentMaxWidth: {
      control: { type: "number", min: 320, step: 8 },
      description:
        "Shared maximum width for PDP content containers. Header, full-width section dividers, and Footer are excluded.",
    },
  },
  globals: {
    theme: "light",
  },
  args: createProductDetailPageFixture(),
  render: (args, { globals }) => {
    const locale = globals.locale === "zh" ? "zh" : "en";
    const localizedArgs = createProductDetailPageFixture(locale);

    return (
      <ProductDetailPage
        {...localizedArgs}
        contentMaxWidth={args.contentMaxWidth}
      />
    );
  },
} satisfies Meta<typeof ProductDetailPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const PDP: Story = {
  name: "PC",
};

async function verifySkuAvailability(canvasElement: HTMLElement) {
  const chip = (value: string) => canvasElement.querySelector<HTMLButtonElement>(`[data-option-value="${value}"]`)!;
  const selected = (value: string) => expect(chip(value)).toHaveAttribute("aria-pressed", "true");
  const firming = chip("firming");
  const soldOut = chip("3-packs");
  await selected("hyaluronic");
  await selected("10-sheets");
  await expect(firming).toBeEnabled();
  await expect(firming).toHaveAttribute("data-availability", "other-combination");
  await expect(getComputedStyle(firming).borderTopStyle).toBe("dashed");
  await expect(getComputedStyle(firming).borderTopColor).toMatch(/(?:0\.16|16%)/);
  await expect(getComputedStyle(chip("5-sheets")).borderTopColor).toBe(getComputedStyle(firming).borderTopColor);
  await expect(getComputedStyle(chip("hyaluronic")).borderTopColor).toBe("rgba(0, 0, 0, 0.87)");
  await expect(getComputedStyle(soldOut).borderTopColor).toBe("rgba(0, 0, 0, 0.08)");
  await expect(soldOut).toBeDisabled();
  await expect(soldOut.querySelector('svg[aria-hidden="true"] line')).not.toBeNull();
  await expect(getComputedStyle(soldOut).color).not.toBe(getComputedStyle(firming).color);
  await expect(firming.getBoundingClientRect().height).toBe(40);
  await expect(soldOut.getBoundingClientRect().height).toBe(40);
  await userEvent.click(soldOut);
  await selected("10-sheets");
  await userEvent.click(firming);
  await selected("firming");
  await selected("5-sheets");
  await expect(getComputedStyle(firming).borderTopStyle).toBe("solid");
  await expect(chip("10-sheets")).toHaveAttribute("data-availability", "other-combination");
  // Switching the second group must also choose a compatible first group.
  await userEvent.click(chip("10-sheets"));
  await selected("hyaluronic");
  await selected("10-sheets");
  // When the current packaging is compatible, keep it unchanged.
  await userEvent.click(chip("5-sheets"));
  await expect(firming).toHaveAttribute("data-availability", "available");
  await userEvent.click(firming);
  await selected("5-sheets");
  await expect(canvasElement.querySelector('[data-pdp-add-to-cart]')).not.toHaveAttribute("aria-disabled", "true");
}

export const SkuAvailability: Story = {
  name: "SKU availability",
  globals: { locale: "en", viewport: { value: "yamiDesktop", isRotated: false } },
  play: async ({ canvasElement }) => verifySkuAvailability(canvasElement),
};

export const SkuAvailabilityMobile: Story = {
  ...SkuAvailability,
  name: "SKU availability / Mobile",
  globals: { locale: "zh", viewport: { value: "yamiMobile", isRotated: false } },
};

export const SoldOutOption: Story = {
  name: "SKU availability / All firming sizes sold out",
  render: (_args, { globals }) => {
    const fixture = createProductDetailPageFixture(globals.locale === "zh" ? "zh" : "en");
    return <ProductDetailPage {...fixture} skus={fixture.skus!.map((sku) => ({
      ...sku, available: sku.available && sku.options["mask-type"] !== "firming",
    }))} />;
  },
  play: async ({ canvasElement }) => {
    const firming = canvasElement.querySelector<HTMLButtonElement>('[data-option-value="firming"]')!;
    await expect(firming).toBeDisabled();
    await expect(firming).toHaveAttribute("data-availability", "sold-out");
    await expect(firming.querySelector("svg line")).not.toBeNull();
    await userEvent.click(firming);
    await expect(canvasElement.querySelector('[data-option-value="hyaluronic"]')).toHaveAttribute("aria-pressed", "true");
    await expect(canvasElement.querySelector('[data-pdp-add-to-cart]')).not.toHaveAttribute("aria-disabled", "true");
  },
};

export const SoldOutProduct: Story = {
  name: "SKU availability / Product sold out",
  render: (_args, { globals }) => <ProductDetailPage {...createProductDetailPageFixture(globals.locale === "zh" ? "zh" : "en")} skus={[]} />,
  play: async ({ canvasElement }) => {
    for (const chip of canvasElement.querySelectorAll('[data-option-value]')) {
      await expect(chip).toBeDisabled();
    }
    await expect(canvasElement.querySelector('[data-pdp-add-to-cart]')).toHaveAttribute("aria-disabled", "true");
  },
};

export const DesktopRegression: Story = {
  name: "Desktop regression",
  tags: ["!dev", "!autodocs"],
  globals: {
    locale: "en",
    viewport: { value: "yamiDesktopXl", isRotated: false },
  },
  play: async ({ canvasElement, args }) => {
    verifyWriteReviewIcon(canvasElement);
    verifyOptionChipWeights(canvasElement, "500");
    if (
      canvasElement.querySelector('[data-slot="product-detail-sales-volume"]')
        ?.textContent?.trim() !== "400+ sold this week"
    ) {
      throw new Error("PDP English sales copy must specify weekly sales");
    }
    const viewportWidth = canvasElement.ownerDocument.defaultView?.innerWidth ?? 0;
    if (viewportWidth < 1024) {
      const mobileHeaderBar = canvasElement.querySelector<HTMLElement>(
        '[data-slot="header-mobile-bar"]'
      );
      const utilityRow = canvasElement.querySelector<HTMLElement>(
        '[data-slot="product-detail-utility-row"]'
      );
      const overview = canvasElement.querySelector<HTMLElement>(
        '[data-slot="product-detail-overview"]'
      );
      const gallery = canvasElement.querySelector<HTMLElement>(
        '[data-slot="product-media-gallery"]'
      );

      if (
        !mobileHeaderBar ||
        getComputedStyle(mobileHeaderBar).display === "none" ||
        !utilityRow ||
        getComputedStyle(utilityRow).display !== "none" ||
        !overview ||
        getComputedStyle(overview).gridTemplateColumns.split(" ").length !== 1 ||
        !gallery ||
        getComputedStyle(gallery).position !== "static" ||
        document.documentElement.scrollWidth >
          document.documentElement.clientWidth
      ) {
        throw new Error(
          "Narrow PDP preview must align its mobile header and single-column content without page overflow"
        );
      }

      return;
    }

    const gallery = canvasElement.querySelector<HTMLElement>(
      '[data-slot="product-media-gallery"]'
    );
    const activeImage = () =>
      canvasElement.querySelector<HTMLImageElement>(
        '[data-slot="product-media-gallery-image"]'
      );
    const next = canvasElement.querySelector<HTMLButtonElement>(
      '[data-slot="product-media-gallery"] [data-rail-navigation-button="true"][data-direction="right"]'
    );
    const previous = canvasElement.querySelector<HTMLButtonElement>(
      '[data-slot="product-media-gallery"] [data-rail-navigation-button="true"][data-direction="left"]'
    );
    const quantity = canvasElement.querySelector("output");
    const quantityRow = canvasElement.querySelector<HTMLElement>(
      '[data-slot="product-detail-quantity-row"]'
    );
    const quantityLabel = quantityRow?.querySelector<HTMLElement>(":scope > span");
    const increase = canvasElement.querySelector<HTMLButtonElement>(
      'button[aria-label="Increase quantity"]'
    );
    const decrease = canvasElement.querySelector<HTMLButtonElement>(
      'button[aria-label="Decrease quantity"]'
    );
    const increaseIcon = increase?.querySelector<HTMLElement>(
      '[data-slot="product-detail-stepper-icon"]'
    );
    const decreaseIcon = decrease?.querySelector<HTMLElement>(
      '[data-slot="product-detail-stepper-icon"]'
    );
    const addToCart = canvasElement.querySelector<HTMLButtonElement>(
      '[data-pdp-add-to-cart="true"]'
    );
    const purchaseCard = canvasElement.querySelector<HTMLElement>(
      'aside[aria-label="Add to Cart"] [data-slot="card"]'
    );
    const purchaseCardContent = purchaseCard?.querySelector<HTMLElement>(
      '[data-slot="card-content"]'
    );
    const purchaseFavorite = canvasElement.querySelector<HTMLButtonElement>(
      '[data-pdp-purchase-action="favorite"]'
    );
    const purchaseActions = purchaseFavorite?.parentElement;
    const purchaseShareButtons = canvasElement.querySelectorAll<HTMLButtonElement>(
      "[data-pdp-share-action]"
    );
    const utilityRow = canvasElement.querySelector<HTMLElement>(
      '[data-slot="product-detail-utility-row"]'
    );
    const breadcrumb = canvasElement.querySelector<HTMLElement>(
      'nav[aria-label="Breadcrumb"]'
    );
    const shareGroup = canvasElement.querySelector<HTMLElement>(
      '[role="group"][aria-label="Share product"]'
    );
    const purchasePrimary = canvasElement.querySelector<HTMLElement>(
      '[data-slot="product-detail-purchase-primary"]'
    );
    const purchaseSticky = canvasElement.querySelector<HTMLElement>(
      '[data-slot="product-detail-purchase-sticky"]'
    );
    const purchaseCheckout = canvasElement.querySelector<HTMLElement>(
      '[data-slot="product-detail-purchase-checkout"]'
    );
    const purchaseSecondary = canvasElement.querySelector<HTMLElement>(
      '[data-slot="product-detail-purchase-secondary"]'
    );
    const purchaseFulfillment = canvasElement.querySelector<HTMLElement>(
      '[data-slot="product-detail-purchase-fulfillment"]'
    );
    const purchaseSecondarySections =
      purchaseSecondary?.querySelectorAll<HTMLElement>(
        ':scope > [data-slot="product-detail-purchase-fulfillment"], :scope > [data-slot="product-detail-purchase-metadata"] > div'
      );
    const purchaseFulfillmentSections =
      purchaseFulfillment?.querySelectorAll<HTMLElement>(":scope > div");
    const sellerShippingSection = canvasElement.querySelector<HTMLElement>(
      '[data-slot="product-detail-seller-shipping-section"]'
    );
    const guaranteeSection = canvasElement.querySelector<HTMLElement>(
      '[data-slot="product-detail-guarantee-section"]'
    );
    const purchaseSeller = canvasElement.querySelector<HTMLElement>(
      '[data-slot="product-detail-seller"]'
    );
    const purchaseSellerLogo = canvasElement.querySelector<HTMLImageElement>(
      '[data-slot="product-detail-seller-logo"]'
    );
    const purchaseSellerLabel = canvasElement.querySelector<HTMLElement>(
      '[data-slot="product-detail-seller-label"]'
    );
    const shippingDestination = canvasElement.querySelector<HTMLElement>(
      '[data-slot="product-detail-shipping-destination"]'
    );
    const shippingBlock = canvasElement.querySelector<HTMLElement>(
      '[data-slot="product-detail-shipping"]'
    );
    const deliveryEstimate = shippingBlock?.querySelector<HTMLParagraphElement>("p");
    const deliveryTimes = shippingBlock?.querySelectorAll<HTMLElement>(
      '[data-slot="product-detail-delivery-time"]'
    );
    const shippingLocation = canvasElement.querySelector<HTMLElement>(
      '[data-slot="product-detail-shipping-location"]'
    );
    const shippingDivider = sellerShippingSection?.querySelector<HTMLElement>(
      ':scope > [data-slot="divider"]'
    );
    const fulfillmentDivider = purchaseFulfillment?.querySelector<HTMLElement>(
      ':scope > [data-slot="divider"]'
    );
    const purchaseDetails = canvasElement.querySelector<HTMLAnchorElement>(
      '[data-slot="product-detail-purchase-details"]'
    );
    const guaranteeItems = canvasElement.querySelectorAll<HTMLElement>(
      '[data-slot="product-detail-guarantees"] li'
    );
    const guaranteeList = canvasElement.querySelector<HTMLElement>(
      '[data-slot="product-detail-guarantees"]'
    );
    const guaranteeIcons = canvasElement.querySelectorAll<HTMLElement>(
      '[data-slot="product-detail-guarantee-icon"]'
    );
    const purchaseTagToggle = canvasElement.querySelector<HTMLButtonElement>(
      'button[aria-controls="product-purchase-tags"]'
    );
    const purchaseTagsLabel = canvasElement.querySelector<HTMLElement>(
      '[data-slot="product-detail-tags-label"]'
    );
    const purchaseTagsBlock = canvasElement.querySelector<HTMLElement>(
      '[data-slot="product-detail-tags-block"]'
    );
    const purchaseRegion = canvasElement.querySelector<HTMLElement>(
      '[data-slot="product-detail-region"]'
    );
    const purchaseRegionLabel = purchaseRegion?.querySelector<HTMLElement>(
      '[data-slot="product-detail-region-label"]'
    );
    const purchaseRegionValue = purchaseRegion?.querySelector<HTMLElement>(
      '[data-slot="product-detail-region-value"]'
    );
    const purchaseRegionIcon = purchaseRegion?.querySelector<HTMLImageElement>(
      '[data-slot="product-detail-region-icon"]'
    );
    const purchaseTags = () =>
      Array.from(canvasElement.querySelectorAll(
        '#product-purchase-tags [data-slot="tag"]'
      )).filter((tag) => getComputedStyle(tag.parentElement!).display !== "none");
    const overview = canvasElement.querySelector<HTMLElement>(
      '[data-slot="product-detail-overview"]'
    );
    const leftContent = canvasElement.querySelector<HTMLElement>(
      '[data-slot="product-detail-left-content"]'
    );
    const productInfo = canvasElement.querySelector<HTMLElement>(
      '[data-slot="product-detail-info"]'
    );
    const productInfoColumn = canvasElement.querySelector<HTMLElement>(
      '[data-slot="product-detail-info-column"]'
    );
    const productSummary = canvasElement.querySelector<HTMLElement>(
      '[data-slot="product-detail-summary"]'
    );
    const productTitle = productSummary?.querySelector<HTMLElement>(
      "#product-title"
    );
    const productRanking = productSummary?.querySelector<HTMLElement>(
      '[data-slot="product-detail-ranking"]'
    );
    const productRankingBadge =
      productRanking?.querySelector<HTMLElement>('[data-slot="badge"]');
    const productRating = productSummary?.querySelector<HTMLElement>(
      '[data-slot="product-detail-rating"]'
    );
    const productPrice = productSummary?.querySelector<HTMLElement>(
      '[data-slot="product-detail-price"]'
    );
    const productCurrentPrice = productPrice?.querySelector<HTMLElement>(
      "strong"
    );
    const productDiscount = productSummary?.querySelector<HTMLElement>(
      '[data-slot="product-detail-discount"]'
    );
    const bestBefore = canvasElement.querySelector<HTMLElement>(
      '[data-slot="product-detail-best-before"]'
    );
    const purchasePanel = canvasElement.querySelector<HTMLElement>(
      '[data-slot="product-detail-purchase"]'
    );
    const details = canvasElement.querySelector<HTMLElement>(
      '[data-slot="product-detail-details"]'
    );
    const detailHeadings = details?.querySelectorAll<HTMLElement>("h2");
    const detailSubheading = details?.querySelector<HTMLElement>("h3");
    const infoModules = productInfo?.querySelectorAll<HTMLElement>(
      ":scope > [data-pdp-info-module]"
    );
    const optionsModule = productInfo?.querySelector<HTMLElement>(
      ':scope > [data-pdp-info-module="options"]'
    );
    const detailModules = details?.querySelectorAll<HTMLElement>(
      ":scope > [data-pdp-detail-module]"
    );
    const specificationRows = details?.querySelectorAll<HTMLElement>(
      '[data-pdp-detail-module="specifications"] dl > div'
    );
    const highlightList = details?.querySelector<HTMLElement>("ul");
    const selectedOptions = canvasElement.querySelectorAll(
      'article[aria-labelledby="product-title"] [data-slot="filter-chip"][aria-pressed="true"]'
    );
    const packagingOptions = canvasElement.querySelector<HTMLElement>(
      '[data-pdp-option-group="packaging"]'
    );
    const maskTypeOption = canvasElement.querySelector<HTMLElement>(
      '[data-pdp-option-group="mask-type"] [data-slot="filter-chip"]'
    );
    const optionStack = canvasElement.querySelector<HTMLElement>(
      '[data-slot="product-detail-options"]'
    );
    const optionLegends = optionStack?.querySelectorAll<HTMLElement>("legend");
    const optionGroupArrows = optionStack?.querySelectorAll<HTMLElement>(
      '[data-slot="product-detail-option-group-arrow"]'
    );
    const packagingButtons = packagingOptions?.querySelectorAll("button");
    const headerCategories = canvasElement.querySelectorAll(
      '[data-slot="header-category"]'
    );
    const headerCategoryImages = canvasElement.querySelectorAll(
      '[data-slot="header-category"] img'
    );
    const headerAllIcon = canvasElement.querySelector(
      '[data-slot="header-all-icon"]'
    );
    const recommendations = canvasElement.querySelector<HTMLElement>(
      '[data-pdp-module="recommendations"]'
    );
    const recommendationItems = recommendations?.querySelectorAll(
      '[data-slot="product-list-item"]'
    );
    const brandProducts = canvasElement.querySelector<HTMLElement>(
      '[data-pdp-module="brand-products"]'
    );
    const recentlyViewed = canvasElement.querySelector<HTMLElement>(
      '[data-pdp-module="recently-viewed"]'
    );
    const recentlyViewedItems = recentlyViewed?.querySelectorAll(
      '[data-slot="product-list-item"]'
    );
    const reviews = canvasElement.querySelector<HTMLElement>(
      '[data-pdp-module="reviews"]'
    );
    const reviewContainer = reviews?.querySelector<HTMLElement>(
      '[data-slot="product-review-section-container"]'
    );
    const reviewCards = reviews?.querySelectorAll(
      '[data-slot="product-review-card"]'
    );
    const ratingMeters = reviews?.querySelectorAll('[role="meter"]');
    const reviewSort = reviews?.querySelector<HTMLElement>(
      '[data-product-review-sort="true"]'
    );
    const reviewSortTrigger = reviewSort?.querySelector<HTMLButtonElement>(
      '[data-slot="filter-chip"]'
    );
    const brandIntro = brandProducts?.querySelector<HTMLElement>(
      '[data-slot="product-list-intro"]'
    );
    const brandItems = brandProducts?.querySelectorAll(
      '[data-slot="product-list-item"]'
    );
    const brandHeading = brandProducts?.querySelector<HTMLElement>(
      '[data-slot="product-list-heading"]'
    );
    const brandLogo = brandProducts?.querySelector<HTMLImageElement>(
      '[data-slot="product-detail-brand-logo"]'
    );
    const brandLogoStyle = brandLogo ? getComputedStyle(brandLogo) : null;
    const brandHeadingRect = brandHeading?.getBoundingClientRect();
    const brandLogoRect = brandLogo?.getBoundingClientRect();
    if (
      !brandHeading ||
      !brandLogo ||
      !brandHeadingRect ||
      !brandLogoRect ||
      brandLogo.alt !== "" ||
      brandLogo.getAttribute("width") !== "120" ||
      brandLogo.getAttribute("height") !== "60" ||
      brandLogoRect.width !== 120 ||
      brandLogoRect.height !== 60 ||
      brandLogoStyle?.boxSizing !== "border-box" ||
      brandLogoStyle.borderTopStyle !== "solid" ||
      brandLogoStyle.borderTopWidth !== "1px" ||
      brandLogoStyle.borderTopColor !== "rgba(0, 0, 0, 0.08)" ||
      Math.abs(
        brandLogoRect.left +
          brandLogoRect.width / 2 -
          (brandHeadingRect.left + brandHeadingRect.width / 2)
      ) > 1
    ) {
      throw new Error(
        "PDP brand logo must stay centered at 120x60 with a 1px gray semantic border"
      );
    }
    const main = canvasElement.querySelector<HTMLElement>(
      '[data-slot="product-detail-main"]'
    );
    const content = canvasElement.querySelector<HTMLElement>(
      '[data-slot="product-detail-content"]'
    );
    const productListContainers = canvasElement.querySelectorAll<HTMLElement>(
      '[data-slot="product-list-container"]'
    );
    const expectedContentMaxWidth =
      typeof args.contentMaxWidth === "number"
        ? `${args.contentMaxWidth}px`
        : args.contentMaxWidth ?? "1920px";

    if (
      !gallery ||
      !activeImage() ||
      !next ||
      !previous ||
      !quantity ||
      !quantityRow ||
      !quantityLabel ||
      !increase ||
      !decrease ||
      !increaseIcon ||
      !decreaseIcon ||
      !addToCart ||
      !purchaseCard ||
      !purchaseCardContent ||
      getComputedStyle(purchaseCard).overflow !== "visible" ||
      Math.round(purchaseCard.getBoundingClientRect().height) !==
        Math.round(purchasePanel.getBoundingClientRect().height) ||
      Math.round(purchaseCardContent.getBoundingClientRect().height) !==
        Math.round(purchasePanel.getBoundingClientRect().height) ||
      !purchaseFavorite ||
      getComputedStyle(purchaseFavorite).columnGap !== "8px" ||
      getComputedStyle(purchaseFavorite).fontWeight !== "400" ||
      getComputedStyle(purchaseFavorite).color !== "rgba(0, 0, 0, 0.55)" ||
      !purchaseActions ||
      getComputedStyle(purchaseActions).paddingBottom !== "96px" ||
      purchaseShareButtons.length !== 4 ||
      !utilityRow ||
      !content ||
      getComputedStyle(content).paddingTop !== "12px" ||
      getComputedStyle(content).paddingBottom !== "32px" ||
      getComputedStyle(utilityRow).marginBottom !== "12px" ||
      !breadcrumb ||
      !shareGroup ||
      !purchasePrimary ||
      !purchaseSticky ||
      !purchaseCheckout ||
      getComputedStyle(purchaseCheckout).paddingTop !== "0px" ||
      !purchaseSecondary ||
      !purchaseFulfillment ||
      !purchaseSecondarySections ||
      purchaseSecondarySections.length !== 3 ||
      !purchaseFulfillmentSections ||
      purchaseFulfillmentSections.length !== 2 ||
      !sellerShippingSection ||
      !guaranteeSection ||
      purchaseSecondarySections[0] !== purchaseFulfillment ||
      purchaseSecondarySections[1] !== purchaseTagsBlock ||
      purchaseSecondarySections[2] !== purchaseRegion ||
      purchaseFulfillmentSections[0] !== sellerShippingSection ||
      purchaseFulfillmentSections[1] !== guaranteeSection ||
      [
        sellerShippingSection,
        guaranteeSection,
        purchaseTagsBlock,
        purchaseRegion,
      ].some(
        (section, index) =>
          !section ||
          getComputedStyle(section).paddingTop !== "16px" ||
          getComputedStyle(section).paddingRight !== "12px" ||
          getComputedStyle(section).paddingBottom !== "16px" ||
          getComputedStyle(section).paddingLeft !== "12px" ||
          getComputedStyle(section).borderTopWidth !==
            (index >= 2 ? "1px" : "0px")
      ) ||
      getComputedStyle(sellerShippingSection).rowGap !== "12px" ||
      getComputedStyle(sellerShippingSection).columnGap !== "12px" ||
      getComputedStyle(guaranteeSection).rowGap !== "12px" ||
      getComputedStyle(guaranteeSection).columnGap !== "12px" ||
      !purchaseSeller ||
      !purchaseSellerLogo ||
      purchaseSellerLogo.alt !== "YAMI" ||
      Math.abs(purchaseSellerLogo.getBoundingClientRect().width - 95.4) > 0.1 ||
      Math.round(purchaseSellerLogo.getBoundingClientRect().height) !== 40 ||
      !purchaseSellerLabel ||
      purchaseSellerLabel.textContent?.trim() !== "Sold & Shipped by Yami" ||
      getComputedStyle(purchaseSellerLabel).fontSize !== "14px" ||
      getComputedStyle(purchaseSeller).rowGap !== "8px" ||
      purchaseSeller.querySelector("strong") ||
      !shippingDestination ||
      !shippingBlock ||
      !deliveryEstimate ||
      !deliveryTimes ||
      !shippingLocation ||
      !shippingDivider ||
      Math.round(shippingDivider.getBoundingClientRect().height) !== 1 ||
      getComputedStyle(shippingDivider).backgroundColor !==
        "rgba(0, 0, 0, 0.08)" ||
      shippingDivider.getBoundingClientRect().top <
        purchaseSeller.getBoundingClientRect().bottom ||
      shippingDivider.getBoundingClientRect().bottom >
        shippingBlock.getBoundingClientRect().top ||
      !fulfillmentDivider ||
      Math.round(fulfillmentDivider.getBoundingClientRect().height) !== 1 ||
      getComputedStyle(fulfillmentDivider).backgroundColor !==
        "rgba(0, 0, 0, 0.08)" ||
      Math.abs(
        fulfillmentDivider.getBoundingClientRect().left -
          shippingDivider.getBoundingClientRect().left
      ) > 1 ||
      Math.abs(
        fulfillmentDivider.getBoundingClientRect().right -
          shippingDivider.getBoundingClientRect().right
      ) > 1 ||
      fulfillmentDivider.getBoundingClientRect().top <
        sellerShippingSection.getBoundingClientRect().bottom ||
      fulfillmentDivider.getBoundingClientRect().bottom >
        guaranteeSection.getBoundingClientRect().top ||
      getComputedStyle(shippingBlock).fontSize !== "14px" ||
      getComputedStyle(deliveryEstimate).color !== "rgba(0, 0, 0, 0.87)" ||
      deliveryTimes.length !== 4 ||
      Array.from(deliveryTimes).some(
        (deliveryTime) => getComputedStyle(deliveryTime).color !== "rgb(224, 0, 0)"
      ) ||
      Array.from(deliveryTimes)
        .map((deliveryTime) => deliveryTime.textContent)
        .join("|") !== "tomorrow|Aug 21|1:30 AM|tomorrow" ||
      deliveryEstimate.textContent !== args.copy.deliveryEstimate ||
      shippingDestination.textContent?.trim() !== "Ship toBrea 92821" ||
      shippingDestination.querySelector("strong") ||
      getComputedStyle(shippingDestination).display !== "flex" ||
      getComputedStyle(shippingDestination).fontWeight !== "400" ||
      getComputedStyle(shippingDestination).whiteSpace !== "nowrap" ||
      getComputedStyle(shippingLocation).textDecorationLine !== "underline" ||
      !purchaseDetails ||
      getComputedStyle(purchaseDetails).fontSize !== "14px" ||
      getComputedStyle(purchaseDetails).lineHeight !== "20px" ||
      Math.round(purchaseDetails.getBoundingClientRect().height) !== 20 ||
      !guaranteeList ||
      getComputedStyle(guaranteeList).rowGap !== "12px" ||
      guaranteeItems.length !== 3 ||
      Array.from(guaranteeItems)
        .map((item) => item.textContent?.trim())
        .join("|") !==
        "Free shipping over $49|Ships from the United States|Easy returns" ||
      Array.from(guaranteeItems).some(
        (item) =>
          getComputedStyle(item).minHeight !== "auto" ||
          getComputedStyle(item).alignItems !== "flex-start" ||
          getComputedStyle(item).color !== "rgba(0, 0, 0, 0.87)"
      ) ||
      guaranteeIcons.length !== 3 ||
      Array.from(guaranteeIcons).some(
        (icon, index) =>
          icon.getBoundingClientRect().width !== 20 ||
          icon.getBoundingClientRect().height !== 20 ||
          getComputedStyle(icon).backgroundColor !== "rgba(0, 0, 0, 0.87)" ||
          getComputedStyle(icon).maskImage === "none" ||
          icon.dataset.iconName !==
            ["same-day", "zipcode", "returns"][index]
      ) ||
      !purchaseTagToggle ||
      !purchaseTagsLabel ||
      !purchaseTagsBlock ||
      getComputedStyle(purchaseTagsBlock).rowGap !== "12px" ||
      getComputedStyle(purchaseTagsBlock).borderTopColor !==
        "rgba(0, 0, 0, 0.08)" ||
      getComputedStyle(purchaseTagsLabel).fontSize !== "14px" ||
      !purchaseRegion ||
      !purchaseRegionLabel ||
      !purchaseRegionValue ||
      !purchaseRegionIcon ||
      purchaseRegionLabel.textContent?.trim() !== "Region" ||
      purchaseRegionValue.textContent?.trim() !== "Korea" ||
      purchaseRegionIcon.alt !== "" ||
      Math.round(purchaseRegionIcon.getBoundingClientRect().width) !== 40 ||
      Math.round(purchaseRegionIcon.getBoundingClientRect().height) !== 40 ||
      getComputedStyle(purchaseRegion).rowGap !== "8px" ||
      getComputedStyle(purchaseRegionValue).flexDirection !== "row" ||
      getComputedStyle(purchaseRegionValue).alignItems !== "center" ||
      getComputedStyle(purchaseRegionValue).columnGap !== "8px" ||
      getComputedStyle(purchaseRegion).borderTopColor !==
        "rgba(0, 0, 0, 0.08)" ||
      !sellerShippingSection.contains(purchaseSeller) ||
      !sellerShippingSection.contains(shippingBlock) ||
      !guaranteeSection.contains(guaranteeItems[0]!) ||
      !guaranteeSection.contains(purchaseDetails) ||
      purchaseTagToggle.dataset.slot !== "product-detail-tags-toggle" ||
      getComputedStyle(purchaseTagToggle).fontSize !==
        getComputedStyle(purchaseDetails).fontSize ||
      getComputedStyle(purchaseTagToggle).lineHeight !==
        getComputedStyle(purchaseDetails).lineHeight ||
      getComputedStyle(purchaseTagToggle).color !==
        getComputedStyle(purchaseDetails).color ||
      getComputedStyle(purchaseTagToggle).textDecorationLine !==
        getComputedStyle(purchaseDetails).textDecorationLine ||
      Math.round(purchaseTagToggle.getBoundingClientRect().height) !== 20 ||
      canvasElement.textContent?.includes("Clip coupon") ||
      canvasElement.textContent?.includes("20% off") ||
      !purchaseCard.contains(purchaseFavorite) ||
      Array.from(purchaseShareButtons).some(
        (button) =>
          !shareGroup.contains(button) || purchaseCard.contains(button)
      ) ||
      breadcrumb.parentElement !== utilityRow ||
      shareGroup.parentElement !== utilityRow ||
      getComputedStyle(utilityRow).display !== "flex" ||
      breadcrumb.getBoundingClientRect().right >
      shareGroup.getBoundingClientRect().left ||
      purchasePrimary.parentElement !== purchaseCardContent ||
      getComputedStyle(purchasePrimary).display !== "contents" ||
      !purchasePrimary.contains(purchaseFavorite) ||
      purchaseSticky.parentElement !== purchasePrimary ||
      purchaseCheckout.parentElement !== purchaseSticky ||
      purchaseSecondary.parentElement !== purchaseSticky ||
      purchaseSticky.previousElementSibling !== purchaseActions ||
      !purchaseCheckout.contains(quantity) ||
      !purchaseCheckout.contains(addToCart) ||
      getComputedStyle(purchaseCheckout).borderTopWidth !== "0px" ||
      Math.round(decrease.getBoundingClientRect().width) !== 28 ||
      Math.round(decrease.getBoundingClientRect().height) !== 28 ||
      Math.round(increase.getBoundingClientRect().width) !== 28 ||
      Math.round(increase.getBoundingClientRect().height) !== 28 ||
      Math.round(decreaseIcon.getBoundingClientRect().width) !== 16 ||
      Math.round(decreaseIcon.getBoundingClientRect().height) !== 16 ||
      Math.round(increaseIcon.getBoundingClientRect().width) !== 16 ||
      Math.round(increaseIcon.getBoundingClientRect().height) !== 16 ||
      getComputedStyle(decrease).borderTopWidth !== "2px" ||
      getComputedStyle(decrease).borderTopStyle !== "solid" ||
      getComputedStyle(decrease).borderTopColor !==
        getComputedStyle(decrease).color ||
      getComputedStyle(increase).borderTopWidth !== "2px" ||
      getComputedStyle(increase).borderTopStyle !== "solid" ||
      getComputedStyle(increase).borderTopColor !== "rgb(224, 0, 0)" ||
      getComputedStyle(decrease).backgroundColor !== "rgb(255, 255, 255)" ||
      getComputedStyle(increase).backgroundColor !== "rgb(255, 255, 255)" ||
      getComputedStyle(decrease).color !==
        getComputedStyle(decreaseIcon).backgroundColor ||
      getComputedStyle(increase).color !==
        getComputedStyle(increaseIcon).backgroundColor ||
      getComputedStyle(decreaseIcon).backgroundColor ===
        getComputedStyle(increaseIcon).backgroundColor ||
      getComputedStyle(quantityRow).fontSize !== "14px" ||
      getComputedStyle(quantityLabel).fontSize !== "16px" ||
      getComputedStyle(addToCart).height !== "56px" ||
      getComputedStyle(addToCart).fontSize !== "18px" ||
      getComputedStyle(quantity).fontSize !== "20px" ||
      Array.from(purchaseShareButtons).some(
        (button) => purchasePrimary.contains(button)
      ) ||
      !purchasePrimary.contains(addToCart) ||
      addToCart.querySelector("img") ||
      purchaseSecondary.contains(addToCart) ||
      !purchaseSecondary.contains(purchaseSeller) ||
      !purchaseSecondary.contains(purchaseDetails) ||
      !purchaseSecondary.contains(purchaseTagToggle) ||
      purchaseTags().length !== 3 ||
      Array.from(purchaseTags()).some(
        (tag) =>
          Math.round(tag.getBoundingClientRect().height) !== 32 ||
          getComputedStyle(tag).borderTopWidth !== "2px" ||
          getComputedStyle(tag).fontWeight !== "500" ||
          getComputedStyle(tag).color !== "rgb(224, 0, 0)" ||
          getComputedStyle(tag).borderTopColor !== "rgb(224, 0, 0)"
      ) ||
      productInfo.contains(purchaseFavorite) ||
      Array.from(purchaseShareButtons).some((button) =>
        productInfo.contains(button)
      ) ||
      !overview ||
      !leftContent ||
      !productInfo ||
      !productInfoColumn ||
      !productSummary ||
      getComputedStyle(productSummary).paddingBottom !== "16px" ||
      !purchasePanel ||
      !details ||
      !infoModules ||
      infoModules.length !== 2 ||
      !optionsModule ||
      getComputedStyle(optionsModule).paddingTop !== "16px" ||
      getComputedStyle(optionsModule).paddingBottom !== "16px" ||
      getComputedStyle(optionsModule).borderTopWidth !== "1px" ||
      getComputedStyle(optionsModule).borderTopColor !==
        "rgba(0, 0, 0, 0.08)" ||
      !detailModules ||
      detailModules.length !== 3 ||
      Array.from(detailModules).some(
        (module, index) =>
          module.parentElement !== details ||
          getComputedStyle(module).display !== "flex" ||
          getComputedStyle(module).flexDirection !== "column" ||
          getComputedStyle(module).rowGap !== "normal" ||
          getComputedStyle(module).paddingTop !== "4px" ||
          getComputedStyle(module).paddingBottom !== "4px" ||
          getComputedStyle(module).borderTopWidth !==
            (index === 0 ? "0px" : "1px") ||
          (index > 0 &&
            getComputedStyle(module).borderTopColor !==
              "rgba(0, 0, 0, 0.08)")
      ) ||
      getComputedStyle(details).borderTopWidth !== "1px" ||
      getComputedStyle(details).borderTopColor !== "rgba(0, 0, 0, 0.08)" ||
      !specificationRows ||
      specificationRows.length === 0 ||
      Array.from(specificationRows)
        .slice(0, -1)
        .some(
          (row) =>
            getComputedStyle(row).borderBottomColor !==
            "rgba(0, 0, 0, 0.08)"
        ) ||
      getComputedStyle(specificationRows[specificationRows.length - 1]!).borderBottomWidth !==
        "0px" ||
      !detailHeadings ||
      detailHeadings.length !== 2 ||
      Array.from(detailHeadings).some(
        (heading) =>
          getComputedStyle(heading).fontSize !== "16px" ||
          getComputedStyle(heading).fontWeight !== "500"
      ) ||
      !detailSubheading ||
      getComputedStyle(detailSubheading).fontSize !== "16px" ||
      getComputedStyle(detailSubheading).fontWeight !== "500" ||
      getComputedStyle(detailSubheading).marginBottom !== "0px" ||
      getComputedStyle(detailSubheading.parentElement!).rowGap !== "normal" ||
      !highlightList ||
      getComputedStyle(highlightList).rowGap !== "8px" ||
      Math.abs(
        gallery.getBoundingClientRect().width /
          overview.getBoundingClientRect().width -
          0.4
      ) > 0.01 ||
      getComputedStyle(gallery).position !== "sticky" ||
      getComputedStyle(gallery).top !== "24px" ||
      overview.parentElement !== leftContent ||
      productInfoColumn.parentElement !== overview ||
      details.parentElement !== productInfoColumn ||
      leftContent.parentElement !== purchasePanel.parentElement ||
      gallery.parentElement !== overview ||
      productInfo.parentElement !== productInfoColumn ||
      Math.abs(
        details.getBoundingClientRect().top -
          productInfo.getBoundingClientRect().bottom
      ) > 1 ||
      Math.abs(
        details.getBoundingClientRect().width -
          productInfo.getBoundingClientRect().width
      ) > 1 ||
      productSummary.parentElement !== productInfo ||
      !productTitle ||
      getComputedStyle(productTitle).fontWeight !== "400" ||
      getComputedStyle(productTitle).fontSize !== "32px" ||
      getComputedStyle(productSummary).rowGap !== "12px" ||
      !productRanking ||
      productTitle.nextElementSibling !== productRanking ||
      !productRankingBadge ||
      productRankingBadge.dataset.size !== "md" ||
      productRankingBadge.dataset.color !== "yellow" ||
      productRankingBadge.dataset.emphasis !== "secondary" ||
      productRankingBadge.textContent?.trim() !== "#3 Most Liked Masks" ||
      !productRating ||
      Math.round(productRating.getBoundingClientRect().height) !== 24 ||
      !productPrice ||
      getComputedStyle(productPrice).columnGap !== "8px" ||
      !productCurrentPrice ||
      getComputedStyle(productCurrentPrice).fontSize !== "24px" ||
      !productDiscount ||
      productDiscount.textContent?.trim() !== "22% off" ||
      getComputedStyle(productDiscount).backgroundColor !==
        "rgba(0, 0, 0, 0)" ||
      !bestBefore ||
      getComputedStyle(bestBefore).color !== "rgb(224, 0, 0)" ||
      Array.from(bestBefore.children).some(
        (child) => getComputedStyle(child).color !== "rgb(224, 0, 0)"
      ) ||
      !productSummary.textContent?.includes("Torriden") ||
      !productSummary.textContent.includes("4.7") ||
      !productSummary.textContent.includes("$16.29") ||
      productSummary.contains(packagingOptions) ||
      !optionStack ||
      getComputedStyle(optionStack).rowGap !== "24px" ||
      !optionLegends ||
      optionLegends.length !== 2 ||
      Array.from(optionLegends).some(
        (legend) =>
          getComputedStyle(legend).fontWeight !== "400" ||
          getComputedStyle(legend).color !== "rgba(0, 0, 0, 0.55)"
      ) ||
      !optionGroupArrows ||
      optionGroupArrows.length !== 2 ||
      Array.from(optionGroupArrows).some(
        (arrow) => getComputedStyle(arrow).display !== "none"
      ) ||
      !maskTypeOption ||
      Math.round(maskTypeOption.getBoundingClientRect().height) !== 40 ||
      getComputedStyle(maskTypeOption).borderRadius !== "8px" ||
      getComputedStyle(purchasePanel).position !== "static" ||
      getComputedStyle(purchasePanel).alignSelf !== "stretch" ||
      getComputedStyle(purchaseSticky).position !== "sticky" ||
      getComputedStyle(purchaseSticky).top !== "24px" ||
      getComputedStyle(purchaseCheckout).position !== "static" ||
      Math.round(purchasePanel.getBoundingClientRect().width) !== 240 ||
      overview.getBoundingClientRect().right >
        purchasePanel.getBoundingClientRect().left ||
      details.getBoundingClientRect().right >
        purchasePanel.getBoundingClientRect().left ||
      details.getBoundingClientRect().top <=
        overview.getBoundingClientRect().top ||
      selectedOptions.length !== 2 ||
      Array.from(selectedOptions).some((option) => {
        const style = getComputedStyle(option);

        return (
          style.borderTopWidth !== "2px" ||
          style.borderTopColor !== "rgba(0, 0, 0, 0.87)" ||
          style.boxShadow !== "none"
        );
      }) ||
      !packagingOptions ||
      packagingButtons?.length !== 5 ||
      getComputedStyle(packagingOptions).flexWrap !== "wrap" ||
      getComputedStyle(packagingOptions).overflowX !== "visible" ||
      packagingOptions.scrollWidth > packagingOptions.clientWidth ||
      Array.from(packagingButtons).some(
        (button) =>
          button.getBoundingClientRect().right >
          packagingOptions.getBoundingClientRect().right + 1
      ) ||
      headerCategories.length === 0 ||
      !headerAllIcon ||
      headerCategoryImages.length !== headerCategories.length - 1 ||
      recommendations?.dataset.layout !== "rail" ||
      recommendations.dataset.mobileSurface !== "card" ||
      getComputedStyle(recommendations).marginTop !== "0px" ||
      getComputedStyle(recommendations).borderTopColor !==
        "rgba(0, 0, 0, 0.08)" ||
      recommendations.querySelector('[data-slot="product-list-view-all"]') ||
      recommendations.querySelector(
        '[data-slot="product-list-view-all-mobile"]'
      ) ||
      recommendationItems?.length !== 8 ||
      !reviews ||
      getComputedStyle(reviews).marginTop !== "0px" ||
      reviews.dataset.activeFilter !== "all" ||
      !reviews.textContent?.includes("Reviews (10)") ||
      reviewCards?.length !== 6 ||
      ratingMeters?.length !== 5 ||
      !reviewSortTrigger ||
      !reviewContainer ||
      brandProducts?.dataset.layout !== "rail" ||
      getComputedStyle(brandProducts).marginTop !== "0px" ||
      !brandIntro ||
      !brandIntro.textContent?.includes("About the brand") ||
      !brandIntro.textContent.includes("5D-Complex") ||
      brandProducts.id !== "torriden-products" ||
      brandProducts.querySelector<HTMLAnchorElement>(
        '[data-slot="product-list-view-all"]'
      )?.hash !== "#torriden-products" ||
      brandItems?.length !== 8 ||
      brandProducts.querySelector(
        '[data-slot="product-list-leading-content"]'
      ) ||
      recentlyViewed?.dataset.layout !== "rail" ||
      recentlyViewed.dataset.mobileSurface !== "card" ||
      getComputedStyle(recentlyViewed).marginTop !== "0px" ||
      !recentlyViewed.textContent?.includes("You've Recently Viewed") ||
      recentlyViewedItems?.length !== 8 ||
      !recentlyViewed.querySelector(
        'a[href="#recent-elegance-face-powder"]'
      ) ||
      !recentlyViewed.querySelector(
        'a[href="#recent-anua-cleansing-oil"]'
      ) ||
      main?.dataset.contentMaxWidth !== expectedContentMaxWidth ||
      getComputedStyle(main).paddingBottom !== "0px" ||
      !content ||
      productListContainers.length !== 3 ||
      getComputedStyle(content).maxWidth !== expectedContentMaxWidth ||
      Array.from(productListContainers).some(
        (container) =>
          getComputedStyle(container).maxWidth !== expectedContentMaxWidth
      ) ||
      getComputedStyle(reviewContainer).maxWidth !== expectedContentMaxWidth ||
      recommendations.getBoundingClientRect().top >=
        reviews.getBoundingClientRect().top ||
      reviews.getBoundingClientRect().top >=
        brandProducts.getBoundingClientRect().top ||
      brandProducts.getBoundingClientRect().top >=
        recentlyViewed.getBoundingClientRect().top
    ) {
      throw new Error(
        "Product Detail page did not render its complete purchase state"
      );
    }
    await verifyDetailDisclosures(details, {
      paddingTop: "0px",
      paddingBottom: "12px",
      marginBottom: "0px",
    });
    await userEvent.click(purchaseTagToggle);
    if (
      purchaseTagToggle.getAttribute("aria-expanded") !== "true" ||
      purchaseTags().length !== 5
    ) {
      throw new Error("PDP purchase tags must disclose the complete tag set");
    }
    await userEvent.click(purchaseTagToggle);
    if (purchaseTags().length !== 3) {
      throw new Error("Desktop PDP purchase tags must collapse back to three tags");
    }
    const initialFirstReviewer = reviews.querySelector(
      '[data-slot="product-review-card"] strong'
    )?.textContent;
    const selectReviewSort = async (label: string) => {
      await userEvent.click(reviewSortTrigger);
      const option = Array.from(
        canvasElement.ownerDocument.querySelectorAll<HTMLLabelElement>(
          '[data-filter-chip-menu-options="true"] label'
        )
      ).find((item) => item.textContent?.includes(label));
      if (!option) {
        throw new Error(`PDP review sort option did not render: ${label}`);
      }
      await userEvent.click(option);
    };
    await selectReviewSort("Most recent");
    const recentFirstReviewer = reviews.querySelector(
      '[data-slot="product-review-card"] strong'
    )?.textContent;
    if (
      initialFirstReviewer === recentFirstReviewer ||
      recentFirstReviewer !== "Daren***"
    ) {
      throw new Error("PDP review sort must move the most recent review first");
    }
    await selectReviewSort("Default");
    if (
      canvasElement.querySelectorAll(
        '[data-slot="product-media-gallery-image"]'
      ).length !== 1
    ) {
      throw new Error(
        "PDP must render one active gallery image instead of a stacked image stream"
      );
    }
    const firstAlt = activeImage()?.alt;
    gallery.focus();
    await userEvent.click(next);
    if (
      activeImage()?.alt === firstAlt ||
      gallery.dataset.activeIndex !== "1"
    ) {
      throw new Error("PDP gallery next control must switch the visible image");
    }
    await userEvent.click(previous);
    if (
      activeImage()?.alt !== firstAlt ||
      gallery.dataset.activeIndex !== "0"
    ) {
      throw new Error(
        "PDP gallery previous control must restore the first image"
      );
    }
    await userEvent.click(increase);
    if (quantity.textContent !== "2") {
      throw new Error("PDP quantity control must increment independently");
    }
    await userEvent.click(decrease);
    if (quantity.textContent !== "1") {
      throw new Error("PDP quantity control must restore its initial value");
    }
    decrease.blur();
    if (getComputedStyle(addToCart).backgroundColor !== "rgb(224, 0, 0)") {
      throw new Error(
        "PDP must retain one operational-red Add to Cart emphasis CTA"
      );
    }
    const purchaseCardStyle = getComputedStyle(purchaseCard);
    const purchaseSecondaryStyle = getComputedStyle(purchaseSecondary);
    if (
      purchaseCardStyle.paddingTop !== "0px" ||
      purchaseCardStyle.paddingRight !== "0px" ||
      purchaseCardStyle.paddingBottom !== "0px" ||
      purchaseCardStyle.paddingLeft !== "0px" ||
      purchaseCardStyle.borderRadius !== "0px" ||
      purchaseCardStyle.backgroundColor !== "rgba(0, 0, 0, 0)" ||
      purchaseCardStyle.borderTopWidth !== "0px" ||
      purchaseSecondaryStyle.paddingTop !== "0px" ||
      purchaseSecondaryStyle.paddingRight !== "0px" ||
      purchaseSecondaryStyle.paddingBottom !== "0px" ||
      purchaseSecondaryStyle.paddingLeft !== "0px" ||
      purchaseSecondaryStyle.borderTopStyle !== "solid" ||
      purchaseSecondaryStyle.borderTopWidth !== "2px" ||
      purchaseSecondaryStyle.borderRadius !== "8px" ||
      purchaseSecondaryStyle.borderTopColor !== purchaseSecondaryStyle.color
    ) {
      throw new Error(
        "PDP purchase card must keep a transparent, square, unpadded surface while its secondary group owns the rounded 2px black border and delegates padding to three internal sections"
      );
    }
    const overweightEmphasis = Array.from(
      canvasElement.querySelectorAll<HTMLElement>(
        '[data-slot="product-detail-page"] *'
      )
    ).filter((element) => {
      const style = getComputedStyle(element);

      return (
        element.getClientRects().length > 0 &&
        style.fontFamily.includes("GT Walsheim") &&
        /[A-Za-z0-9]/.test(element.textContent ?? "") &&
        Number.parseInt(style.fontWeight, 10) > 500 &&
        Boolean(
          element.textContent?.trim() || element.getAttribute("aria-label")
        )
      );
    });
    if (overweightEmphasis.length > 0) {
      throw new Error(
        `PDP GT Walsheim English emphasis must use weight 500; found ${overweightEmphasis
          .map(
            (element) =>
              `${element.tagName.toLowerCase()}=${
                getComputedStyle(element).fontWeight
              }`
          )
          .join(", ")}`
      );
    }
  },
};

export const Mobile: Story = {
  name: "Mobile",
};

export const ChineseRegression: Story = {
  name: "Chinese regression",
  tags: ["!dev", "!autodocs"],
  globals: {
    locale: "zh",
    viewport: { value: "yamiMobile", isRotated: false },
  },
  play: async ({ canvasElement }) => {
    const page = canvasElement.querySelector<HTMLElement>(
      '[data-slot="product-detail-page"]'
    );
    const title = canvasElement.querySelector<HTMLElement>("#product-title");
    const addToCart = canvasElement.querySelector<HTMLButtonElement>(
      '[data-pdp-add-to-cart="true"]'
    );
    const salesVolume = canvasElement.querySelector<HTMLElement>(
      '[data-slot="product-detail-sales-volume"]'
    );
    const discount = canvasElement.querySelector<HTMLElement>(
      '[data-slot="product-detail-discount"]'
    );
    const bestBefore = canvasElement.querySelector<HTMLElement>(
      '[data-slot="product-detail-best-before"]'
    );
    const serviceGuarantees = Array.from(
      canvasElement.querySelectorAll<HTMLElement>(
        '[data-slot="product-detail-guarantees"] li'
      ),
      (item) => item.textContent?.trim()
    );
    const optionLabels = Array.from(
      canvasElement.querySelectorAll<HTMLElement>(
        '[data-slot="product-detail-options"] legend'
      ),
      (legend) => legend.textContent?.trim()
    );

    if (
      page?.lang !== "zh" ||
      canvasElement.querySelector('[data-slot="product-detail-ranking"]')
        ?.textContent?.trim() !== "面膜人气榜 No.3" ||
      title?.textContent?.trim() !==
        "Torriden DIVE IN 低分子玻尿酸补水面膜 10片" ||
      addToCart?.textContent?.trim() !== "加入购物车" ||
      salesVolume?.textContent?.trim() !== "周销量 400+" ||
      discount?.textContent?.trim() !== "78折" ||
      bestBefore?.textContent?.trim() !== "商品有效期至 2028年9月15日" ||
      serviceGuarantees.join("|") !== "满 $49 免运费|从美国发货|无忧退换" ||
      optionLabels.join("|") !== "面膜类型|规格"
    ) {
      throw new Error(
        "PDP Chinese locale must update the document language and visible purchase content"
      );
    }

    const chineseHeadings = canvasElement.querySelectorAll<HTMLElement>(
      '[data-slot="product-detail-seller-label"], [data-pdp-module="recommendations"] [data-slot="product-list-title"], [data-slot="product-review-section-title"], [data-pdp-module="recently-viewed"] [data-slot="product-list-title"], [data-slot="product-detail-disclosure-trigger"]'
    );
    const englishBrandName = canvasElement.querySelector<HTMLElement>(
      '[data-pdp-module="brand-products"] [data-slot="product-list-title"] > span'
    );
    const chineseSelections = canvasElement.querySelectorAll<HTMLElement>(
      '[data-slot="product-detail-options"] strong'
    );
    verifyOptionChipWeights(canvasElement, "600");
    if (
      chineseSelections.length !== 2 ||
      Array.from(chineseSelections).some((selection) => getComputedStyle(selection).fontWeight !== "600") ||
      chineseHeadings.length !== 7 ||
      Array.from(chineseHeadings).some((heading) =>
        getComputedStyle(heading).fontSize !== "16px" ||
        getComputedStyle(heading).fontWeight !== "600"
      ) ||
      !englishBrandName ||
      englishBrandName.lang !== "en" ||
      getComputedStyle(englishBrandName).fontSize !== "16px" ||
      getComputedStyle(englishBrandName).fontWeight !== "500"
    ) {
      throw new Error("Mobile PDP headings must use 600 for Chinese and 500 for the English brand name");
    }

    const deliveryEstimate = canvasElement.querySelector<HTMLParagraphElement>(
      '[data-slot="product-detail-shipping"] p'
    );
    const deliveryTimes = Array.from(
      deliveryEstimate?.querySelectorAll<HTMLElement>(
        '[data-slot="product-detail-delivery-time"]'
      ) ?? []
    );

    if (
      deliveryEstimate?.textContent !==
        "明天 1:30 AM 前下单，预计明天（8月28日 星期五）送达。" ||
      deliveryTimes.map((time) => time.textContent).join("|") !==
        "明天|1:30 AM|明天|8月28日 星期五" ||
      deliveryTimes.some(
        (time) => getComputedStyle(time).color !== "rgb(224, 0, 0)"
      )
    ) {
      throw new Error(
        "PDP Chinese delivery copy must put the cutoff before arrival and emphasize the time, date, and weekday"
      );
    }
  },
};

export const MobileRegression: Story = {
  name: "Mobile regression",
  tags: ["!dev", "!autodocs"],
  globals: {
    locale: "en",
    viewport: { value: "yamiMobile", isRotated: false },
  },
  play: async ({ canvasElement }) => {
    verifyWriteReviewIcon(canvasElement);
    verifyOptionChipWeights(canvasElement, "500");
    const viewportWidth = canvasElement.ownerDocument.defaultView?.innerWidth;
    if (!viewportWidth) {
      throw new Error("Mobile PDP viewport width must be available");
    }
    const main = canvasElement.querySelector<HTMLElement>(
      '[data-slot="product-detail-main"]'
    );
    const gallery = canvasElement.querySelector<HTMLElement>(
      '[aria-label="Product image gallery"]'
    );
    const galleryStage = gallery?.querySelector<HTMLElement>(
      '[data-slot="product-media-gallery-stage"]'
    );
    const galleryThumbnails = gallery?.querySelector<HTMLElement>(
      '[data-slot="product-media-gallery-thumbnails"]'
    );
    const galleryNavigationButtons = gallery?.querySelectorAll<HTMLElement>(
      '[data-rail-navigation-button="true"]'
    );
    const mobileHeaderBar = canvasElement.querySelector<HTMLElement>(
      '[data-slot="header-mobile-bar"]'
    );
    const mobileHeader = mobileHeaderBar?.closest<HTMLElement>(
      '[data-slot="header"]'
    );
    const mobileHeaderPdpActions = canvasElement.querySelector<HTMLElement>(
      '[data-slot="header-mobile-pdp-actions"]'
    );
    const mobileHeaderSearch = canvasElement.querySelector<HTMLElement>(
      '[data-slot="header-mobile-search-action"]'
    );
    const mobileHeaderCart = canvasElement.querySelector<HTMLElement>(
      '[data-slot="header-mobile-cart"]'
    );
    const mobileHeaderSearchRow = canvasElement.querySelector<HTMLElement>(
      '[data-slot="header-mobile-search-row"]'
    );
    const leftContent = canvasElement.querySelector<HTMLElement>(
      '[data-slot="product-detail-left-content"]'
    );
    const overview = canvasElement.querySelector<HTMLElement>(
      '[data-slot="product-detail-overview"]'
    );
    const productInfo = canvasElement.querySelector<HTMLElement>(
      '[data-slot="product-detail-info"]'
    );
    const productInfoColumn = canvasElement.querySelector<HTMLElement>(
      '[data-slot="product-detail-info-column"]'
    );
    const mobileSummary = canvasElement.querySelector<HTMLElement>(
      '[data-slot="product-detail-summary"]'
    );
    const mobileOptionsModule = productInfo?.querySelector<HTMLElement>(
      ':scope > [data-pdp-info-module="options"]'
    );
    const mobileOptionStack = canvasElement.querySelector<HTMLElement>(
      '[data-slot="product-detail-options"]'
    );
    const mobilePackagingOptions = canvasElement.querySelector<HTMLElement>(
      '[data-pdp-option-group="packaging"]'
    );
    const mobilePackagingButtons =
      mobilePackagingOptions?.querySelectorAll("button");
    const mobileMaskTypeOption = canvasElement.querySelector<HTMLElement>(
      '[data-pdp-option-group="mask-type"] [data-slot="filter-chip"]'
    );
    const mobileOptionChips = canvasElement.querySelectorAll<HTMLElement>(
      '[data-slot="product-detail-options"] [data-slot="filter-chip"]'
    );
    const mobileOptionGroupArrows =
      mobileOptionStack?.querySelectorAll<HTMLElement>(
        '[data-slot="product-detail-option-group-arrow"]'
      );
    const mobileOptionGroupHeadings =
      mobileOptionStack?.querySelectorAll<HTMLElement>(
        '[data-slot="product-detail-option-group-heading"]'
      );
    const mobileOptionGroupSelections =
      mobileOptionStack?.querySelectorAll<HTMLElement>(
        '[data-slot="product-detail-option-group-heading"] strong'
      );
    const mobileOptionLegends =
      mobileOptionStack?.querySelectorAll<HTMLElement>("legend");
    const mobileMaskTypeHitArea = mobileMaskTypeOption
      ? getComputedStyle(mobileMaskTypeOption, "::before")
      : null;
    const purchasePanel = canvasElement.querySelector<HTMLElement>(
      '[data-slot="product-detail-purchase"]'
    );
    const purchaseSticky = canvasElement.querySelector<HTMLElement>(
      '[data-slot="product-detail-purchase-sticky"]'
    );
    const purchaseCheckout = canvasElement.querySelector<HTMLElement>(
      '[data-slot="product-detail-purchase-checkout"]'
    );
    const purchaseSecondary = canvasElement.querySelector<HTMLElement>(
      '[data-slot="product-detail-purchase-secondary"]'
    );
    const purchaseFulfillment = canvasElement.querySelector<HTMLElement>(
      '[data-slot="product-detail-purchase-fulfillment"]'
    );
    const purchaseSellerLogo = purchaseFulfillment?.querySelector<HTMLImageElement>(
      '[data-slot="product-detail-seller-logo"]'
    );
    const purchaseSeller = purchaseFulfillment?.querySelector<HTMLElement>(
      '[data-slot="product-detail-seller"]'
    );
    const purchaseSellerLabel = purchaseSeller?.querySelector<HTMLElement>(
      '[data-slot="product-detail-seller-label"]'
    );
    const mobileSellerShippingSection =
      purchaseFulfillment?.querySelector<HTMLElement>(
        '[data-slot="product-detail-seller-shipping-section"]'
      );
    const mobileShippingBlock = purchaseFulfillment?.querySelector<HTMLElement>(
      '[data-slot="product-detail-shipping"]'
    );
    const mobileShippingDivider =
      mobileSellerShippingSection?.querySelector<HTMLElement>(
        ':scope > [data-slot="divider"]'
      );
    const mobileFulfillmentDivider =
      purchaseFulfillment?.querySelector<HTMLElement>(
        ':scope > [data-slot="divider"]'
      );
    const mobileGuaranteeSection =
      purchaseFulfillment?.querySelector<HTMLElement>(
        '[data-slot="product-detail-guarantee-section"]'
      );
    const mobileGuaranteeItems = purchaseFulfillment?.querySelectorAll<HTMLElement>(
      '[data-slot="product-detail-guarantees"] li'
    );
    const purchaseMetadata = canvasElement.querySelector<HTMLElement>(
      '[data-slot="product-detail-purchase-metadata"]'
    );
    const purchaseMetadataDivider = purchaseMetadata?.querySelector<HTMLElement>(
      ':scope > [data-slot="divider"]'
    );
    const purchaseTagsBlock = canvasElement.querySelector<HTMLElement>(
      '[data-slot="product-detail-tags-block"]'
    );
    const purchaseRegion = canvasElement.querySelector<HTMLElement>(
      '[data-slot="product-detail-region"]'
    );
    const purchaseRegionIcon = purchaseRegion?.querySelector<HTMLImageElement>(
      '[data-slot="product-detail-region-icon"]'
    );
    const details = canvasElement.querySelector<HTMLElement>(
      '[data-slot="product-detail-details"]'
    );
    const detailModules = details?.querySelectorAll<HTMLElement>(
      '[data-pdp-detail-module]'
    );
    const recommendations = canvasElement.querySelector<HTMLElement>(
      '[data-pdp-module="recommendations"]'
    );
    const brandProducts = canvasElement.querySelector<HTMLElement>(
      '[data-pdp-module="brand-products"]'
    );
    const recentlyViewed = canvasElement.querySelector<HTMLElement>(
      '[data-pdp-module="recently-viewed"]'
    );
    const brandIntro = brandProducts?.querySelector<HTMLElement>(
      '[data-slot="product-list-intro"] > div'
    );
    const brandItems = brandProducts?.querySelector<HTMLElement>(
      '[data-slot="product-list-items"]'
    );
    const reviews = canvasElement.querySelector<HTMLElement>(
      '[data-pdp-module="reviews"]'
    );
    const reviewGrid = reviews?.querySelector<HTMLElement>(
      '[data-slot="product-review-grid"]'
    );
    const reviewCards = reviewGrid?.querySelectorAll<HTMLElement>(
      '[data-slot="product-review-card"]'
    );
    const reviewContainer = reviews?.querySelector<HTMLElement>(
      '[data-slot="product-review-section-container"]'
    );
    const moduleHeadingPairs = [
      [recommendations, "product-list"],
      [reviews, "product-review-section"],
      [brandProducts, "product-list"],
      [recentlyViewed, "product-list"],
    ] as const;
    const moduleHeadings = moduleHeadingPairs.map(([module, slot]) => ({
      row: module?.querySelector<HTMLElement>(`[data-slot="${slot}-heading"]`),
      title: module?.querySelector<HTMLElement>(`[data-slot="${slot}-title"]`),
    }));
    const brandHeading = brandProducts?.querySelector<HTMLElement>(
      '[data-slot="product-list-heading"]'
    );
    const brandLogo = brandProducts?.querySelector<HTMLImageElement>(
      '[data-slot="product-detail-brand-logo"]'
    );
    const brandActions = brandProducts?.querySelector<HTMLElement>(
      '[data-slot="product-list-actions"]'
    );
    if (
      !brandHeading ||
      !brandLogo ||
      !brandActions ||
      getComputedStyle(brandActions).display !== "none" ||
      brandLogo.getBoundingClientRect().width !== 96 ||
      brandLogo.getBoundingClientRect().height !== 48 ||
      getComputedStyle(brandLogo).borderRadius !== "4px" ||
      Math.abs(
        brandHeading.getBoundingClientRect().right -
          brandLogo.getBoundingClientRect().right -
          parseFloat(getComputedStyle(brandHeading).paddingRight)
      ) > 1
    ) {
      throw new Error(
        "Mobile PDP brand header must hide its actions and align the 96x48 logo with a 4px radius to the right content edge"
      );
    }
    const utilityRow = canvasElement.querySelector<HTMLElement>(
      '[data-slot="product-detail-utility-row"]'
    );
    const breadcrumb = canvasElement.querySelector<HTMLElement>(
      'nav[aria-label="Breadcrumb"]'
    );
    const shareGroup = canvasElement.querySelector<HTMLElement>(
      '[role="group"][aria-label="Share product"]'
    );
    const mobileSummaryActions = canvasElement.querySelector<HTMLElement>(
      '[data-slot="product-detail-mobile-summary-actions"]'
    );
    const mobileSummaryButtons = mobileSummaryActions?.querySelectorAll(
      "[data-pdp-mobile-action]"
    );
    const purchaseFavorite = purchasePanel?.querySelector<HTMLElement>(
      '[data-pdp-purchase-action="favorite"]'
    );
    const purchaseActions = purchaseFavorite?.parentElement;
    const quantityLabel = purchaseCheckout?.querySelector<HTMLElement>(
      '[data-slot="product-detail-quantity-row"] > span'
    );
    const title = canvasElement.querySelector<HTMLElement>("#product-title");
    const rating = canvasElement.querySelector<HTMLElement>(
      '[data-slot="product-detail-rating"]'
    );
    const ranking = canvasElement.querySelector<HTMLElement>(
      '[data-slot="product-detail-ranking"]'
    );
    const price = canvasElement.querySelector<HTMLElement>(
      '[data-slot="product-detail-price"]'
    );
    const purchasePanelShareButtons = purchasePanel?.querySelectorAll(
      "[data-pdp-share-action]"
    );
    if (
      !main ||
      getComputedStyle(main).display !== "flex" ||
      getComputedStyle(main).flexDirection !== "column" ||
      getComputedStyle(main).rowGap !== "8px" ||
      !brandProducts ||
      !brandIntro ||
      !brandItems ||
      !gallery ||
      !galleryStage ||
      !galleryThumbnails ||
      !mobileHeader ||
      getComputedStyle(mobileHeader).position !== "sticky" ||
      getComputedStyle(mobileHeader).top !== "0px" ||
      !mobileHeaderBar ||
      Math.round(mobileHeaderBar.getBoundingClientRect().height) !== 56 ||
      !mobileHeaderPdpActions ||
      getComputedStyle(mobileHeaderPdpActions).display !== "flex" ||
      !mobileHeaderSearch ||
      Math.round(mobileHeaderSearch.getBoundingClientRect().width) !== 40 ||
      !mobileHeaderCart ||
      Math.round(mobileHeaderCart.getBoundingClientRect().width) !== 40 ||
      !mobileHeaderSearchRow ||
      getComputedStyle(mobileHeaderSearchRow).display !== "none" ||
      Math.abs(
        gallery.getBoundingClientRect().top -
          mobileHeaderBar.getBoundingClientRect().bottom
      ) > 1 ||
      getComputedStyle(gallery).position !== "static" ||
      Math.abs(gallery.getBoundingClientRect().width - viewportWidth) > 1 ||
      Math.abs(galleryStage.getBoundingClientRect().width - viewportWidth) > 1 ||
      Math.abs(
        (viewportWidth > 440 ? Math.min(galleryStage.getBoundingClientRect().width - 48, 440) : galleryStage.getBoundingClientRect().width) -
          galleryStage.getBoundingClientRect().height
      ) > 1 ||
      getComputedStyle(galleryThumbnails).display !== "none" ||
      galleryNavigationButtons?.length !== 2 ||
      Array.from(galleryNavigationButtons).some(
        (button) => getComputedStyle(button).display !== "none"
      ) ||
      !leftContent ||
      !overview ||
      !productInfo ||
      !productInfoColumn ||
      !mobileSummary ||
      !mobileOptionsModule ||
      getComputedStyle(mobileOptionsModule).paddingTop !== "0px" ||
      getComputedStyle(mobileOptionsModule).paddingBottom !== "0px" ||
      getComputedStyle(mobileOptionsModule).paddingLeft !== "12px" ||
      getComputedStyle(mobileOptionsModule).paddingRight !== "12px" ||
      getComputedStyle(mobileOptionsModule).borderTopWidth !== "0px" ||
      getComputedStyle(mobileOptionsModule).backgroundColor !==
        "rgb(255, 255, 255)" ||
      !mobileOptionStack ||
      getComputedStyle(mobileOptionStack).paddingTop !== "16px" ||
      getComputedStyle(mobileOptionStack).paddingBottom !== "0px" ||
      getComputedStyle(mobileOptionStack).rowGap !== "16px" ||
      !mobileOptionGroupHeadings ||
      mobileOptionGroupHeadings.length !== 2 ||
      !mobileOptionGroupSelections ||
      mobileOptionGroupSelections.length !== 2 ||
      Array.from(mobileOptionGroupHeadings)
        .map((heading) => heading.textContent?.trim())
        .join("|") !==
        "Mask Type: Hyaluronic|Standard Packaging: 10 sheets" ||
      Array.from(mobileOptionGroupSelections).some(
        (selection) => getComputedStyle(selection).fontWeight !== "500"
      ) ||
      Array.from(mobileOptionGroupHeadings).some(
        (heading) =>
          getComputedStyle(heading).display !== "flex" ||
          getComputedStyle(heading).height !== "24px" ||
          getComputedStyle(heading).color !== "rgba(0, 0, 0, 0.87)" ||
          getComputedStyle(heading).justifyContent !== "space-between"
      ) ||
      !mobileOptionLegends ||
      mobileOptionLegends.length !== 2 ||
      Array.from(mobileOptionLegends).some(
        (legend) =>
          getComputedStyle(legend).position !== "absolute" ||
          getComputedStyle(legend).width !== "1px" ||
          getComputedStyle(legend).height !== "1px"
      ) ||
      !mobileOptionGroupArrows ||
      mobileOptionGroupArrows.length !== 2 ||
      Array.from(mobileOptionGroupArrows).some((arrow) => {
        const icon = arrow.querySelector<HTMLElement>("span");
        const arrowStyle = getComputedStyle(arrow);
        const iconStyle = icon ? getComputedStyle(icon) : null;
        const iconRect = icon?.getBoundingClientRect();
        const arrowRect = arrow.getBoundingClientRect();
        const headingRect = arrow.parentElement?.getBoundingClientRect();
        return (
          arrow.tagName !== "DIV" ||
          arrowStyle.display !== "flex" ||
          arrowStyle.position !== "static" ||
          arrow.parentElement?.dataset.slot !==
            "product-detail-option-group-heading" ||
          !headingRect ||
          Math.abs(headingRect.right - arrowRect.right) > 1 ||
          !icon ||
          icon.getAttribute("aria-hidden") !== "true" ||
          iconStyle?.backgroundColor !== "rgba(0, 0, 0, 0.55)" ||
          iconStyle?.maskImage === "none" ||
          Math.round(iconRect?.width ?? 0) !== 16 ||
          Math.round(iconRect?.height ?? 0) !== 16
        );
      }) ||
      !mobilePackagingOptions ||
      getComputedStyle(mobilePackagingOptions).flexWrap !== "nowrap" ||
      getComputedStyle(mobilePackagingOptions).overflowX !== "auto" ||
      mobilePackagingOptions.scrollWidth <=
        mobilePackagingOptions.clientWidth ||
      Array.from(mobilePackagingButtons ?? []).some(
        (button) =>
          Math.abs(
            button.getBoundingClientRect().top -
              mobilePackagingButtons![0].getBoundingClientRect().top
          ) > 1
      ) ||
      !mobileMaskTypeOption ||
      Math.round(mobileMaskTypeOption.getBoundingClientRect().height) !== 40 ||
      mobileOptionChips.length !== 8 ||
      Array.from(mobileOptionChips).some(
        (chip) =>
          getComputedStyle(chip).paddingLeft !== "8px" ||
          getComputedStyle(chip).paddingRight !== "8px"
      ) ||
      mobileMaskTypeHitArea?.position !== "absolute" ||
      mobileMaskTypeHitArea.height !== "44px" ||
      !purchasePanel ||
      !purchaseSticky ||
      !purchaseCheckout ||
      !purchaseSecondary ||
      !purchaseFulfillment ||
      !purchaseSellerLogo ||
      !purchaseSeller ||
      !purchaseSellerLabel ||
      !mobileShippingBlock ||
      !mobileShippingDivider ||
      Math.round(mobileShippingDivider.getBoundingClientRect().height) !== 1 ||
      mobileShippingDivider.getBoundingClientRect().top <
        purchaseSeller.getBoundingClientRect().bottom ||
      mobileShippingDivider.getBoundingClientRect().bottom >
        mobileShippingBlock.getBoundingClientRect().top ||
      !mobileFulfillmentDivider ||
      !mobileGuaranteeSection ||
      Math.round(mobileFulfillmentDivider.getBoundingClientRect().height) !== 1 ||
      Math.abs(
        mobileFulfillmentDivider.getBoundingClientRect().left -
          mobileShippingDivider.getBoundingClientRect().left
      ) > 1 ||
      Math.abs(
        mobileFulfillmentDivider.getBoundingClientRect().right -
          mobileShippingDivider.getBoundingClientRect().right
      ) > 1 ||
      mobileFulfillmentDivider.getBoundingClientRect().top <
        mobileSellerShippingSection.getBoundingClientRect().bottom ||
      mobileFulfillmentDivider.getBoundingClientRect().bottom >
        mobileGuaranteeSection.getBoundingClientRect().top ||
      purchaseSellerLabel.textContent?.trim() !== "Sold & Shipped by Yami" ||
      getComputedStyle(purchaseSeller).flexDirection !== "row" ||
      getComputedStyle(purchaseSeller).alignItems !== "center" ||
      getComputedStyle(purchaseSellerLabel).flexGrow !== "1" ||
      getComputedStyle(purchaseSellerLabel).minWidth !== "0px" ||
      getComputedStyle(purchaseSellerLabel).fontSize !== "16px" ||
      getComputedStyle(purchaseSellerLabel).fontWeight !== "500" ||
      getComputedStyle(purchaseSellerLabel).color !== "rgba(0, 0, 0, 0.87)" ||
      Math.abs(
        purchaseSeller.getBoundingClientRect().right -
          purchaseSellerLogo.getBoundingClientRect().right
      ) > 1 ||
      purchaseSellerLogo.currentSrc === purchaseSellerLogo.src ||
      purchaseSellerLogo.naturalWidth !== 84 ||
      purchaseSellerLogo.naturalHeight !== 32 ||
      Math.round(purchaseSellerLogo.getBoundingClientRect().width) !== 84 ||
      Math.round(purchaseSellerLogo.getBoundingClientRect().height) !== 32 ||
      !mobileGuaranteeItems ||
      mobileGuaranteeItems.length !== 3 ||
      Array.from(mobileGuaranteeItems)
        .map((item) => item.textContent?.trim())
        .join("|") !==
        "Free shipping over $49|Ships from the United States|Easy returns" ||
      !purchaseMetadata ||
      !purchaseMetadataDivider ||
      !purchaseTagsBlock ||
      !purchaseRegion ||
      !purchaseRegionIcon ||
      purchaseRegion.textContent?.replace(/\s/g, "") !== "RegionKorea" ||
      purchaseRegionIcon.alt !== "" ||
      Math.round(purchaseRegionIcon.getBoundingClientRect().width) !== 40 ||
      Math.round(purchaseRegionIcon.getBoundingClientRect().height) !== 40 ||
      getComputedStyle(purchaseRegionIcon.parentElement!).flexDirection !==
        "row" ||
      getComputedStyle(purchaseRegionIcon.parentElement!).alignItems !==
        "center" ||
      getComputedStyle(purchaseRegionIcon.parentElement!).columnGap !== "8px" ||
      getComputedStyle(purchaseSecondary).borderTopWidth !== "0px" ||
      getComputedStyle(purchaseSecondary).borderRightWidth !== "0px" ||
      getComputedStyle(purchaseSecondary).borderBottomWidth !== "0px" ||
      getComputedStyle(purchaseSecondary).borderLeftWidth !== "0px" ||
      getComputedStyle(purchaseSecondary).backgroundColor !==
        "rgba(0, 0, 0, 0)" ||
      getComputedStyle(purchaseSecondary).rowGap !== "8px" ||
      getComputedStyle(purchaseFulfillment).backgroundColor !==
        "rgb(255, 255, 255)" ||
      getComputedStyle(purchaseMetadata).backgroundColor !==
        "rgb(255, 255, 255)" ||
      purchaseTagsBlock.parentElement !== purchaseMetadata ||
      purchaseRegion.parentElement !== purchaseMetadata ||
      purchaseMetadataDivider.getBoundingClientRect().height !== 1 ||
      getComputedStyle(purchaseMetadataDivider).backgroundColor !==
        "rgba(0, 0, 0, 0.08)" ||
      getComputedStyle(purchaseMetadataDivider).marginLeft !== "12px" ||
      getComputedStyle(purchaseMetadataDivider).marginRight !== "12px" ||
      getComputedStyle(purchaseTagsBlock).backgroundColor !==
        "rgba(0, 0, 0, 0)" ||
      getComputedStyle(purchaseTagsBlock).borderTopWidth !== "0px" ||
      getComputedStyle(purchaseRegion).backgroundColor !==
        "rgba(0, 0, 0, 0)" ||
      getComputedStyle(purchaseRegion).borderTopWidth !== "0px" ||
      Math.abs(
        purchaseTagsBlock.getBoundingClientRect().top -
          details.getBoundingClientRect().bottom -
          8
      ) > 1 ||
      Math.abs(
        purchaseRegion.getBoundingClientRect().top -
          purchaseTagsBlock.getBoundingClientRect().bottom -
          1
      ) > 1 ||
      getComputedStyle(purchaseCheckout).position !== "fixed" ||
      getComputedStyle(purchaseCheckout).bottom !== "0px" ||
      getComputedStyle(purchaseCheckout).gridTemplateColumns.split(" ")
        .length !== 2 ||
      getComputedStyle(purchaseCheckout).columnGap !== "40px" ||
      getComputedStyle(purchaseCheckout).paddingLeft !== "16px" ||
      getComputedStyle(purchaseCheckout).paddingRight !== "16px" ||
      getComputedStyle(purchaseSticky).position !== "static" ||
      !details ||
      !detailModules ||
      detailModules.length !== 3 ||
      getComputedStyle(details).rowGap !== "4px" ||
      getComputedStyle(details).borderTopWidth !== "0px" ||
      getComputedStyle(details).paddingTop !== "4px" ||
      getComputedStyle(details).paddingBottom !== "4px" ||
      getComputedStyle(details).paddingLeft !== "12px" ||
      getComputedStyle(details).paddingRight !== "12px" ||
      Array.from(detailModules).some(
        (module, index) =>
          getComputedStyle(module).rowGap !== "normal" ||
          getComputedStyle(module).paddingTop !==
            (index === 0 ? "0px" : "4px") ||
          getComputedStyle(module).borderTopWidth !==
            (index === 0 ? "0px" : "1px") ||
          getComputedStyle(module).paddingBottom !== "0px"
      ) ||
      overview.parentElement !== leftContent ||
      productInfoColumn.parentElement !== overview ||
      productInfo.parentElement !== productInfoColumn ||
      details.parentElement !== productInfoColumn ||
      getComputedStyle(overview).display !== "contents" ||
      getComputedStyle(productInfoColumn).display !== "contents" ||
      getComputedStyle(leftContent).display !== "contents" ||
      getComputedStyle(purchasePanel).position !== "static" ||
      getComputedStyle(productInfo).display !== "contents" ||
      Math.round(mobileSummary.getBoundingClientRect().left) !== 8 ||
      Math.abs(
        mobileSummary.getBoundingClientRect().width - (viewportWidth - 16)
      ) > 1 ||
      getComputedStyle(mobileSummary).padding !== "8px 12px 12px" ||
      getComputedStyle(mobileSummary).backgroundColor !== "rgb(255, 255, 255)" ||
      Math.round(mobileOptionsModule.getBoundingClientRect().left) !== 8 ||
      Math.abs(
        mobileOptionsModule.getBoundingClientRect().width - (viewportWidth - 16)
      ) >
        1 ||
      Math.abs(
        mobileOptionsModule.getBoundingClientRect().top -
          mobileSummary.getBoundingClientRect().bottom -
          8
      ) > 1 ||
      Math.abs(
        purchaseFulfillment.getBoundingClientRect().top -
          mobileOptionsModule.getBoundingClientRect().bottom -
          8
      ) > 1 ||
      Math.abs(
        details.getBoundingClientRect().top -
          purchaseFulfillment.getBoundingClientRect().bottom -
          8
      ) > 1 ||
      !recommendations ||
      getComputedStyle(recommendations).marginTop !== "0px" ||
      recommendations.querySelector('[data-slot="product-list-view-all"]') ||
      recommendations.querySelector(
        '[data-slot="product-list-view-all-mobile"]'
      ) ||
      !reviews ||
      getComputedStyle(reviews).marginTop !== "0px" ||
      !brandProducts ||
      getComputedStyle(brandProducts).marginTop !== "0px" ||
      !recentlyViewed ||
      recentlyViewed.dataset.layout !== "rail" ||
      recentlyViewed.querySelectorAll('[data-slot="product-list-item"]')
        .length !== 8 ||
      getComputedStyle(recentlyViewed).marginTop !== "0px" ||
      brandProducts.getBoundingClientRect().top >=
        recentlyViewed.getBoundingClientRect().top ||
      !reviewGrid ||
      !reviewContainer ||
      moduleHeadings.some(({ row, title: moduleTitle }) => {
        if (!row || !moduleTitle) return true;
        const titleStyle = getComputedStyle(moduleTitle);
        return (
          getComputedStyle(row).paddingLeft !== "4px" ||
          titleStyle.fontSize !== "16px" ||
          titleStyle.fontWeight !== "500" ||
          titleStyle.lineHeight !== "20px"
        );
      }) ||
      !utilityRow ||
      !breadcrumb ||
      !shareGroup ||
      getComputedStyle(utilityRow).display !== "none" ||
      breadcrumb.parentElement !== utilityRow ||
      shareGroup.parentElement !== utilityRow ||
      !mobileSummaryActions ||
      getComputedStyle(mobileSummaryActions).display !== "flex" ||
      getComputedStyle(mobileSummaryActions).columnGap !== "8px" ||
      mobileSummaryButtons?.length !== 2 ||
      !purchaseFavorite ||
      !purchaseActions ||
      getComputedStyle(purchaseActions).display !== "none" ||
      !quantityLabel ||
      getComputedStyle(quantityLabel).display !== "none" ||
      !title ||
      getComputedStyle(title).fontSize !== "16px" ||
      getComputedStyle(title).lineHeight !== "20px" ||
      !rating ||
      !ranking ||
      !price ||
      getComputedStyle(price).paddingTop !== "4px" ||
      getComputedStyle(price).paddingBottom !== "4px" ||
      getComputedStyle(price).marginTop !== "4px" ||
      rating.getBoundingClientRect().top >= ranking.getBoundingClientRect().top ||
      ranking.getBoundingClientRect().top >= price.getBoundingClientRect().top ||
      purchasePanelShareButtons?.length !== 0 ||
      getComputedStyle(brandIntro).paddingLeft !== "4px" ||
      getComputedStyle(brandIntro).paddingRight !== "4px" ||
      getComputedStyle(brandIntro).marginBottom !== "8px" ||
      getComputedStyle(brandIntro).rowGap !== "4px" ||
      getComputedStyle(brandIntro.querySelector("h3")!).display !== "none" ||
      getComputedStyle(brandIntro.querySelector("p")!).display === "none" ||
      brandIntro.getBoundingClientRect().top >=
        brandItems.getBoundingClientRect().top ||
      getComputedStyle(reviewGrid).gridAutoFlow !== "column" ||
      getComputedStyle(reviewGrid).overflowX !== "auto" ||
      reviewGrid.scrollWidth <= reviewGrid.clientWidth ||
      !reviewCards ||
      reviewCards.length === 0 ||
      Array.from(reviewCards).some(
        (card) => Math.round(card.getBoundingClientRect().height) !== 200
      ) ||
      document.documentElement.scrollWidth >
        document.documentElement.clientWidth
    ) {
      throw new Error(
        "Mobile PDP must match the Figma full-bleed gallery, inset info card, and fixed purchase bar without page overflow"
      );
    }

    const mobileTags = purchaseTagsBlock.querySelector("ul");
    const mobileTagsToggle = purchaseTagsBlock.querySelector("button");
    if (
      !mobileTags ||
      !mobileTagsToggle ||
      getComputedStyle(mobileTags).display !== "flex" ||
      getComputedStyle(mobileTags).flexWrap !== "wrap" ||
      mobileTags.children.length !== 5 ||
      Array.from(mobileTags.children).some((tag) => getComputedStyle(tag).display === "none") ||
      getComputedStyle(mobileTagsToggle).display !== "none"
    ) {
      throw new Error("Mobile PDP must show all purchase tags in a wrapping row without a disclosure button");
    }

    const mobileQuantity = canvasElement.querySelector("output");
    if (
      !mobileQuantity ||
      mobileQuantity.getBoundingClientRect().width !== 48 ||
      [recommendations, brandProducts, recentlyViewed].some((module) => {
        const container = module.querySelector<HTMLElement>(
          '[data-slot="product-list-container"]'
        );
        return !container || getComputedStyle(container).rowGap !== "8px";
      })
    ) {
      throw new Error(
        "Mobile PDP product lists must use 8px row gaps and the quantity value must occupy 48px"
      );
    }

    const mobileCardSequence = [
      mobileSummary,
      mobileOptionsModule,
      purchaseFulfillment,
      details,
      purchaseMetadata,
      recommendations,
      reviewContainer,
      brandProducts,
      recentlyViewed,
    ];
    const mobileCardRects = mobileCardSequence.map((card) =>
      card.getBoundingClientRect()
    );
    if (
      getComputedStyle(purchasePanel).paddingBottom !== "0px" ||
      mobileCardSequence.some((card) => {
        const rect = card.getBoundingClientRect();
        return (
          Math.round(rect.left) !== 8 ||
          Math.abs(rect.width - (viewportWidth - 16)) > 1 ||
          getComputedStyle(card).borderRadius !== "12px"
        );
      }) ||
      mobileCardRects.slice(1).some(
        (rect, index) =>
          Math.abs(rect.top - mobileCardRects[index].bottom - 8) > 1
      )
    ) {
      throw new Error(
        "Mobile PDP cards must match the homepage 8px page inset, 12px surface radius, and 8px vertical rhythm"
      );
    }

    await verifyDetailDisclosures(details, {
      paddingTop: "0px",
      paddingBottom: "0px",
      marginBottom: "12px",
    });

    const cicaOption = Array.from(
      canvasElement.querySelectorAll<HTMLButtonElement>(
        '[data-pdp-option-group="mask-type"] button'
      )
    ).find((option) => option.textContent?.trim() === "Cica");
    if (!cicaOption) throw new Error("Cica product option did not render");
    await userEvent.click(cicaOption);
    verifyOptionChipWeights(canvasElement, "500");
    if (mobileOptionGroupSelections[0]?.textContent?.trim() !== "Cica") {
      throw new Error("Mobile option heading must reflect the selected value");
    }
  },
};

export const Tablet: Story = {
  name: "Tablet aligned mobile layout",
  tags: ["!dev", "!autodocs"],
  globals: {
    viewport: { value: "yamiTablet", isRotated: false },
  },
  play: async ({ canvasElement }) => {
    const overview = canvasElement.querySelector<HTMLElement>(
      '[data-slot="product-detail-overview"]'
    );
    const gallery = canvasElement.querySelector<HTMLElement>(
      '[data-slot="product-media-gallery"]'
    );
    const productInfoColumn = canvasElement.querySelector<HTMLElement>(
      '[data-slot="product-detail-info-column"]'
    );
    const purchasePanel = canvasElement.querySelector<HTMLElement>(
      '[data-slot="product-detail-purchase"]'
    );
    const options = canvasElement.querySelector<HTMLElement>(
      '[data-pdp-info-module="options"]'
    );
    const purchaseFulfillment = canvasElement.querySelector<HTMLElement>(
      '[data-slot="product-detail-purchase-fulfillment"]'
    );
    const details = canvasElement.querySelector<HTMLElement>(
      '[data-slot="product-detail-details"]'
    );
    const utilityRow = canvasElement.querySelector<HTMLElement>(
      '[data-slot="product-detail-utility-row"]'
    );
    const mobileHeaderBar = canvasElement.querySelector<HTMLElement>(
      '[data-slot="header-mobile-bar"]'
    );
    const mobileHeader = mobileHeaderBar?.closest<HTMLElement>(
      '[data-slot="header"]'
    );
    const mobileHeaderBand = canvasElement.querySelector<HTMLElement>(
      '[data-slot="header-mobile"]'
    );
    const mobileHeaderPdpActions = canvasElement.querySelector<HTMLElement>(
      '[data-slot="header-mobile-pdp-actions"]'
    );
    const mobileHeaderSearchRow = canvasElement.querySelector<HTMLElement>(
      '[data-slot="header-mobile-search-row"]'
    );
    const thumbnails = gallery?.querySelector<HTMLElement>(
      '[data-slot="product-media-gallery-thumbnails"]'
    );
    const stage = gallery?.querySelector<HTMLElement>(
      '[data-slot="product-media-gallery-stage"]'
    );
    const galleryNavigationButtons = gallery?.querySelectorAll<HTMLElement>(
      '[data-rail-navigation-button="true"]'
    );

    if (
      !overview ||
      !gallery ||
      !productInfoColumn ||
      !purchasePanel ||
      !options ||
      !purchaseFulfillment ||
      !details ||
      !utilityRow ||
      !mobileHeader ||
      getComputedStyle(mobileHeader).position !== "sticky" ||
      getComputedStyle(mobileHeader).top !== "0px" ||
      !mobileHeaderBand ||
      mobileHeaderBand.dataset.mobileVariant !== "pdp" ||
      !mobileHeaderBar ||
      Math.round(mobileHeaderBar.getBoundingClientRect().height) !== 56 ||
      !mobileHeaderPdpActions ||
      getComputedStyle(mobileHeaderPdpActions).display !== "flex" ||
      !mobileHeaderSearchRow ||
      getComputedStyle(mobileHeaderSearchRow).display !== "none" ||
      !thumbnails ||
      !stage ||
      getComputedStyle(mobileHeaderBar).display === "none" ||
      getComputedStyle(utilityRow).display !== "none" ||
      getComputedStyle(overview).display !== "contents" ||
      getComputedStyle(productInfoColumn).display !== "contents" ||
      getComputedStyle(gallery).position !== "static" ||
      getComputedStyle(thumbnails).display !== "none" ||
      galleryNavigationButtons?.length !== 2 ||
      Array.from(galleryNavigationButtons).some(
        (button) => getComputedStyle(button).display !== "none"
      ) ||
      purchaseFulfillment.getBoundingClientRect().top <=
        options.getBoundingClientRect().bottom ||
      details.getBoundingClientRect().top <=
        purchaseFulfillment.getBoundingClientRect().bottom ||
      document.documentElement.scrollWidth >
        document.documentElement.clientWidth
    ) {
      throw new Error(
        "Tablet PDP must align its mobile header and single-column content without page overflow"
      );
    }
  },
};

export const DesktopMdBoundary: Story = {
  name: "Desktop-md boundary",
  tags: ["!dev", "!autodocs"],
  globals: {
    viewport: { value: "yamiDesktopMd", isRotated: false },
  },
  play: async ({ canvasElement }) => {
    const overview = canvasElement.querySelector<HTMLElement>(
      '[data-slot="product-detail-overview"]'
    );
    const gallery = canvasElement.querySelector<HTMLElement>(
      '[data-slot="product-media-gallery"]'
    );
    const productInfoColumn = canvasElement.querySelector<HTMLElement>(
      '[data-slot="product-detail-info-column"]'
    );
    const thumbnails = gallery?.querySelector<HTMLElement>(
      '[data-slot="product-media-gallery-thumbnails"]'
    );
    const stage = gallery?.querySelector<HTMLElement>(
      '[data-slot="product-media-gallery-stage"]'
    );

    if (
      !overview ||
      !gallery ||
      !productInfoColumn ||
      !thumbnails ||
      !stage ||
      getComputedStyle(overview).gridTemplateColumns.split(" ").length !== 2 ||
      getComputedStyle(gallery).position !== "sticky" ||
      productInfoColumn.getBoundingClientRect().left <=
        gallery.getBoundingClientRect().right ||
      thumbnails.getBoundingClientRect().top <
        stage.getBoundingClientRect().bottom
    ) {
      throw new Error(
        "PDP must switch to the side-by-side overview at the 1280px desktop-md boundary"
      );
    }
  },
};

export const NarrowDesktop: Story = {
  name: "Narrow desktop stable layout",
  tags: ["!dev", "!autodocs"],
  globals: {
    viewport: { value: "yamiDesktop", isRotated: false },
  },
  play: async ({ canvasElement }) => {
    const overview = canvasElement.querySelector<HTMLElement>(
      '[data-slot="product-detail-overview"]'
    );
    const gallery = canvasElement.querySelector<HTMLElement>(
      '[data-slot="product-media-gallery"]'
    );
    const productInfoColumn = canvasElement.querySelector<HTMLElement>(
      '[data-slot="product-detail-info-column"]'
    );
    const purchasePanel = canvasElement.querySelector<HTMLElement>(
      '[data-slot="product-detail-purchase"]'
    );
    const purchaseSticky = canvasElement.querySelector<HTMLElement>(
      '[data-slot="product-detail-purchase-sticky"]'
    );
    const purchaseCheckout = canvasElement.querySelector<HTMLElement>(
      '[data-slot="product-detail-purchase-checkout"]'
    );
    const thumbnails = gallery?.querySelector<HTMLElement>(
      '[data-slot="product-media-gallery-thumbnails"]'
    );
    const stage = gallery?.querySelector<HTMLElement>(
      '[data-slot="product-media-gallery-stage"]'
    );

    if (
      !overview ||
      !gallery ||
      !productInfoColumn ||
      !purchasePanel ||
      !purchaseSticky ||
      !purchaseCheckout ||
      !thumbnails ||
      !stage ||
      getComputedStyle(overview).gridTemplateColumns.split(" ").length !== 2 ||
      getComputedStyle(gallery).position !== "sticky" ||
      getComputedStyle(purchasePanel).position !== "static" ||
      getComputedStyle(purchasePanel).alignSelf !== "stretch" ||
      getComputedStyle(purchaseSticky).position !== "sticky" ||
      getComputedStyle(purchaseSticky).top !== "24px" ||
      getComputedStyle(purchaseCheckout).position !== "static" ||
      Math.round(purchasePanel.getBoundingClientRect().width) !== 240 ||
      productInfoColumn.getBoundingClientRect().left <=
        gallery.getBoundingClientRect().right ||
      thumbnails.getBoundingClientRect().top <
        stage.getBoundingClientRect().bottom
    ) {
      throw new Error(
        "PDP must preserve the desktop layout between the 1024px and 1280px boundaries"
      );
    }
  },
};

export const CustomContentWidth: Story = {
  name: "Custom content width",
  tags: ["!dev", "!autodocs"],
  args: {
    contentMaxWidth: 1200,
  },
  play: async ({ canvasElement }) => {
    const main = canvasElement.querySelector<HTMLElement>(
      '[data-slot="product-detail-main"]'
    );
    const content = canvasElement.querySelector<HTMLElement>(
      '[data-slot="product-detail-content"]'
    );
    const widthContainers = canvasElement.querySelectorAll<HTMLElement>(
      '[data-slot="product-list-container"]'
    );
    const reviewContainer = canvasElement.querySelector<HTMLElement>(
      '[data-slot="product-review-section-container"]'
    );
    if (
      main?.dataset.contentMaxWidth !== "1200px" ||
      !content ||
      widthContainers.length !== 3 ||
      !reviewContainer ||
      getComputedStyle(content).maxWidth !== "1200px" ||
      Array.from(widthContainers).some(
        (container) => getComputedStyle(container).maxWidth !== "1200px"
      ) ||
      getComputedStyle(reviewContainer).maxWidth !== "1200px"
    ) {
      throw new Error(
        "PDP custom content width must reach every page content container"
      );
    }
  },
};
