import type { Meta, StoryObj } from "@storybook/react-vite";
import { userEvent } from "storybook/test";

import { ProductDetailPage } from "./ProductDetailPage";
import { createProductDetailPageFixture } from "./fixtures";

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
    locale: "en",
    theme: "light",
    viewport: { value: "yamiDesktopXl", isRotated: false },
  },
  args: createProductDetailPageFixture(),
} satisfies Meta<typeof ProductDetailPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const PDP: Story = {
  name: "Gallery PDP",
  play: async ({ canvasElement, args }) => {
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
    const purchaseSecondarySections =
      purchaseSecondary?.querySelectorAll<HTMLElement>(":scope > div");
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
    const purchaseTags = () =>
      canvasElement.querySelectorAll(
        '#product-purchase-tags [data-slot="tag"]'
      );
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
      !purchaseSecondarySections ||
      purchaseSecondarySections.length !== 3 ||
      !sellerShippingSection ||
      !guaranteeSection ||
      purchaseSecondarySections[0] !== sellerShippingSection ||
      purchaseSecondarySections[1] !== guaranteeSection ||
      purchaseSecondarySections[2] !== purchaseTagsBlock ||
      Array.from(purchaseSecondarySections).some(
        (section, index) =>
          getComputedStyle(section).paddingTop !== "16px" ||
          getComputedStyle(section).paddingRight !== "12px" ||
          getComputedStyle(section).paddingBottom !== "16px" ||
          getComputedStyle(section).paddingLeft !== "12px" ||
          getComputedStyle(section).borderTopWidth !==
            (index === 0 ? "0px" : "1px")
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
      getComputedStyle(purchaseSellerLabel).fontSize !== "14px" ||
      getComputedStyle(purchaseSeller).rowGap !== "8px" ||
      purchaseSeller.querySelector("strong") ||
      !shippingDestination ||
      !shippingBlock ||
      !deliveryEstimate ||
      !deliveryTimes ||
      !shippingLocation ||
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
            ["same-day", "returns", "zipcode"][index]
      ) ||
      !purchaseTagToggle ||
      !purchaseTagsLabel ||
      !purchaseTagsBlock ||
      getComputedStyle(purchaseTagsBlock).rowGap !== "12px" ||
      getComputedStyle(purchaseTagsLabel).fontSize !== "14px" ||
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
      !detailModules ||
      detailModules.length !== 3 ||
      Array.from(detailModules).some(
        (module, index) =>
          module.parentElement !== details ||
          getComputedStyle(module).display !== "flex" ||
          getComputedStyle(module).flexDirection !== "column" ||
          getComputedStyle(module).rowGap !== "12px" ||
          getComputedStyle(module).paddingTop !== "16px" ||
          getComputedStyle(module).paddingBottom !== "16px" ||
          getComputedStyle(module).borderTopWidth !==
            (index === 0 ? "0px" : "1px")
      ) ||
      getComputedStyle(details).borderTopWidth !== "1px" ||
      !specificationRows ||
      specificationRows.length === 0 ||
      getComputedStyle(specificationRows[specificationRows.length - 1]!).borderBottomWidth !==
        "0px" ||
      !detailHeadings ||
      detailHeadings.length !== 2 ||
      Array.from(detailHeadings).some(
        (heading) =>
          getComputedStyle(heading).fontSize !== "16px" ||
          getComputedStyle(heading).fontWeight !== "400"
      ) ||
      !detailSubheading ||
      getComputedStyle(detailSubheading).fontSize !== "16px" ||
      getComputedStyle(detailSubheading).fontWeight !== "500" ||
      getComputedStyle(detailSubheading).marginBottom !== "0px" ||
      getComputedStyle(detailSubheading.parentElement!).rowGap !== "12px" ||
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
      !maskTypeOption ||
      Math.round(maskTypeOption.getBoundingClientRect().height) !== 44 ||
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
      main?.dataset.contentMaxWidth !== expectedContentMaxWidth ||
      getComputedStyle(main).paddingBottom !== "0px" ||
      !content ||
      productListContainers.length !== 2 ||
      getComputedStyle(content).maxWidth !== expectedContentMaxWidth ||
      Array.from(productListContainers).some(
        (container) =>
          getComputedStyle(container).maxWidth !== expectedContentMaxWidth
      ) ||
      getComputedStyle(reviewContainer).maxWidth !== expectedContentMaxWidth ||
      recommendations.getBoundingClientRect().top >=
        reviews.getBoundingClientRect().top ||
      reviews.getBoundingClientRect().top >=
        brandProducts.getBoundingClientRect().top
    ) {
      throw new Error(
        "Product Detail page did not render its complete purchase state"
      );
    }
    await userEvent.click(purchaseTagToggle);
    if (
      purchaseTagToggle.getAttribute("aria-expanded") !== "true" ||
      purchaseTags().length !== 5
    ) {
      throw new Error("PDP purchase tags must disclose the complete tag set");
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
  globals: {
    viewport: { value: "yamiMobile", isRotated: false },
  },
  play: async ({ canvasElement }) => {
    const viewportWidth = canvasElement.ownerDocument.defaultView?.innerWidth;
    if (!viewportWidth) {
      throw new Error("Mobile PDP viewport width must be available");
    }
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
    const purchasePanel = canvasElement.querySelector<HTMLElement>(
      '[data-slot="product-detail-purchase"]'
    );
    const purchaseSticky = canvasElement.querySelector<HTMLElement>(
      '[data-slot="product-detail-purchase-sticky"]'
    );
    const purchaseCheckout = canvasElement.querySelector<HTMLElement>(
      '[data-slot="product-detail-purchase-checkout"]'
    );
    const details = canvasElement.querySelector<HTMLElement>(
      '[data-slot="product-detail-details"]'
    );
    const recommendations = canvasElement.querySelector<HTMLElement>(
      '[data-pdp-module="recommendations"]'
    );
    const brandProducts = canvasElement.querySelector<HTMLElement>(
      '[data-pdp-module="brand-products"]'
    );
    const brandIntro = brandProducts?.querySelector<HTMLElement>(
      '[data-slot="product-list-intro"]'
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
        galleryStage.getBoundingClientRect().width -
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
      !purchasePanel ||
      !purchaseSticky ||
      !purchaseCheckout ||
      getComputedStyle(purchaseCheckout).position !== "fixed" ||
      getComputedStyle(purchaseCheckout).bottom !== "0px" ||
      getComputedStyle(purchaseCheckout).gridTemplateColumns.split(" ")
        .length !== 2 ||
      getComputedStyle(purchaseCheckout).columnGap !== "40px" ||
      getComputedStyle(purchaseCheckout).paddingLeft !== "16px" ||
      getComputedStyle(purchaseCheckout).paddingRight !== "16px" ||
      getComputedStyle(purchaseSticky).position !== "static" ||
      !details ||
      overview.parentElement !== leftContent ||
      productInfoColumn.parentElement !== overview ||
      productInfo.parentElement !== productInfoColumn ||
      details.parentElement !== productInfoColumn ||
      getComputedStyle(productInfoColumn).paddingTop !== "8px" ||
      getComputedStyle(productInfoColumn).paddingBottom !== "8px" ||
      getComputedStyle(leftContent).display !== "contents" ||
      getComputedStyle(purchasePanel).position !== "static" ||
      Math.round(productInfo.getBoundingClientRect().left) !== 8 ||
      Math.abs(productInfo.getBoundingClientRect().width - (viewportWidth - 16)) >
        1 ||
      getComputedStyle(productInfo).padding !== "12px" ||
      overview.getBoundingClientRect().top >=
        details.getBoundingClientRect().top ||
      Math.abs(
        Math.abs(
          details.getBoundingClientRect().top -
            productInfo.getBoundingClientRect().bottom
        ) - 8
      ) > 1 ||
      details.getBoundingClientRect().bottom >=
        purchasePanel.getBoundingClientRect().top ||
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
      !reviewGrid ||
      !utilityRow ||
      !breadcrumb ||
      !shareGroup ||
      getComputedStyle(utilityRow).display !== "none" ||
      breadcrumb.parentElement !== utilityRow ||
      shareGroup.parentElement !== utilityRow ||
      !mobileSummaryActions ||
      getComputedStyle(mobileSummaryActions).display !== "flex" ||
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
      rating.getBoundingClientRect().top >= ranking.getBoundingClientRect().top ||
      ranking.getBoundingClientRect().top >= price.getBoundingClientRect().top ||
      purchasePanelShareButtons?.length !== 0 ||
      brandIntro.getBoundingClientRect().top >=
        brandItems.getBoundingClientRect().top ||
      getComputedStyle(reviewGrid).gridTemplateColumns.split(" ").length !==
        (viewportWidth < 768 ? 1 : 2) ||
      document.documentElement.scrollWidth >
        document.documentElement.clientWidth
    ) {
      throw new Error(
        "Mobile PDP must match the Figma full-bleed gallery, inset info card, and fixed purchase bar without page overflow"
      );
    }
  },
};

export const Tablet: Story = {
  name: "Tablet stable desktop layout",
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
      !thumbnails ||
      !stage ||
      getComputedStyle(overview).gridTemplateColumns.split(" ").length !== 2 ||
      getComputedStyle(gallery).position !== "sticky" ||
      Math.round(purchasePanel.getBoundingClientRect().width) !== 240 ||
      productInfoColumn.getBoundingClientRect().left <=
        gallery.getBoundingClientRect().right ||
      thumbnails.getBoundingClientRect().top <
        stage.getBoundingClientRect().bottom ||
      document.documentElement.scrollWidth >
        document.documentElement.clientWidth
    ) {
      throw new Error(
        "Tablet PDP must preserve the desktop product layout without page overflow"
      );
    }
  },
};

export const DesktopMdBoundary: Story = {
  name: "Desktop-md boundary",
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
      widthContainers.length !== 2 ||
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
