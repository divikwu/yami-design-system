import type { Meta, StoryObj } from "@storybook/react-vite";
import { useEffect, useState } from "react";
import { userEvent, waitFor } from "storybook/test";

import { SearchResultsPage } from "./SearchResultsPage";
import { createSearchResultsFixture } from "./fixtures";
import type { SearchResultsLocale } from "./SearchResultsPage.types";

function localeFromGlobals(value: unknown): SearchResultsLocale {
  return value === "en" ? "en" : "zh";
}

const meta = {
  title: "YAMI/Pages/Search Results",
  component: SearchResultsPage,
  parameters: {
    layout: "fullscreen",
    controls: { disable: true },
    docs: {
      description: {
        component:
          "Responsive YAMI search-results template with controlled header search, quick filters, sorting, a waterfall product grid, and an empty state.",
      },
      story: { inline: false, height: "1600px" },
    },
  },
  globals: {
    locale: "en",
    theme: "light",
    viewport: { value: "yamiDesktopXl", isRotated: false },
  },
  args: createSearchResultsFixture("en"),
} satisfies Meta<typeof SearchResultsPage>;

export default meta;
type Story = StoryObj<typeof meta>;

function ecommerceHomeStoryHref(locale: SearchResultsLocale) {
  return `/iframe.html?id=yami-pages-ecommerce-home--pc&viewMode=story&globals=locale:${locale}`;
}

function mobileSearchStoryHref(locale: SearchResultsLocale) {
  return `/?path=/story/yami-pages-search--mobile-discovery&globals=locale%3A${locale}`;
}

function createSearchResultsStoryFixture(locale: SearchResultsLocale) {
  const fixture = createSearchResultsFixture(locale);
  return {
    ...fixture,
    mobileBackHref: mobileSearchStoryHref(locale),
    header: {
      ...fixture.header,
      homeHref: ecommerceHomeStoryHref(locale),
    },
  };
}

const renderResults: NonNullable<Story["render"]> = (_args, { globals }) => (
  <SearchResultsPage
    {...createSearchResultsStoryFixture(localeFromGlobals(globals.locale))}
  />
);

function SimulatedFilterLoading({ locale }: { locale: SearchResultsLocale }) {
  const shouldSimulate = import.meta.env.MODE !== "test";
  const [filtersLoading, setFiltersLoading] = useState(shouldSimulate);

  useEffect(() => {
    if (!shouldSimulate) return;
    const timeout = window.setTimeout(() => setFiltersLoading(false), 1200);
    return () => window.clearTimeout(timeout);
  }, [shouldSimulate]);

  return (
    <SearchResultsPage
      {...createSearchResultsStoryFixture(locale)}
      filtersLoading={filtersLoading}
    />
  );
}

const renderSimulatedFilterLoading: NonNullable<Story["render"]> = (
  _args,
  { globals }
) => <SimulatedFilterLoading locale={localeFromGlobals(globals.locale)} />;

export const Results: Story = {
  name: "PC",
  render: renderResults,
  play: async ({ canvasElement, globals }) => {
    const document = canvasElement.ownerDocument;
    const homeLink = canvasElement.querySelector<HTMLAnchorElement>(
      '[data-slot="header-brand"]'
    );
    const categoryButton = [...canvasElement.querySelectorAll("button")].find(
      (button) => button.textContent?.trim() === "Category"
    );
    const productCards = canvasElement.querySelectorAll<HTMLElement>(
      '[data-slot="product-card"]'
    );
    const firstProducts = Array.from(productCards)
      .slice(0, 3)
      .map((card) => card.textContent ?? "");
    const expectedFixture = createSearchResultsFixture(
      localeFromGlobals(globals.locale)
    );
    const expectedFirstProducts = expectedFixture.products.slice(0, 3);
    const normalizedText = (value: string) => value.replace(/\s+/g, " ").trim();
    if (
      homeLink?.getAttribute("href") !==
      ecommerceHomeStoryHref(localeFromGlobals(globals.locale))
    ) {
      throw new Error("Search results logo must link to Ecommerce Home");
    }
    if (
      !categoryButton ||
      categoryButton.getAttribute("aria-expanded") === "true" ||
      document.querySelector('[data-slot="filter-chip-category-menu"]') ||
      productCards.length !== expectedFixture.products.length ||
      expectedFirstProducts.some((product, index) =>
        !normalizedText(firstProducts[index] ?? "").includes(
          normalizedText(product.title)
        ) ||
        !firstProducts[index]?.includes(String(product.priceCurrent))
      )
    ) {
      throw new Error(
        "Search results must open with the current Yami matcha powder product snapshot"
      );
    }

    const searchPanel = createSearchResultsFixture(
      localeFromGlobals(globals.locale)
    ).header.searchPanel;
    const recentMatcha = searchPanel?.recent[0];
    const popularMatcha = searchPanel?.popular[0];
    if (
      typeof recentMatcha === "string" ||
      recentMatcha?.label !== "matcha powder" ||
      !recentMatcha.href?.includes("search-results--results") ||
      popularMatcha?.label !== "matcha" ||
      !popularMatcha.href?.includes("topic-landing-page-topic")
    ) {
      throw new Error(
        "Search results discovery data must match Ecommerce Home"
      );
    }
  },
};

export const ResultsInteractions: Story = {
  name: "PC interaction tests",
  tags: ["!dev"],
  render: renderSimulatedFilterLoading,
  play: async ({ canvasElement }) => {
    if (import.meta.env.MODE !== "test") return;

    const document = canvasElement.ownerDocument;
    const page = canvasElement.querySelector(
      '[data-slot="search-results-page"]'
    );
    const main = canvasElement.querySelector<HTMLElement>(
      '[data-slot="search-results-main"]'
    );
    const widthConsumers = [
      canvasElement.querySelector<HTMLElement>(
        '[data-slot="search-results-toolbar"]'
      ),
      canvasElement.querySelector<HTMLElement>(
        '[data-slot="product-list-container"]'
      ),
      canvasElement.querySelector<HTMLElement>(
        '[data-slot="search-results-pagination"]'
      ),
    ];
    const results = canvasElement.querySelectorAll(
      '[data-slot="product-list-item"]'
    );
    const filters = canvasElement.querySelectorAll("button[aria-pressed]");
    const controls = canvasElement.querySelector<HTMLElement>(
      '[data-slot="search-results-controls"]'
    );
    const controlList = canvasElement.querySelector<HTMLElement>(
      '[data-search-results-control-list="true"]'
    );
    const productList = canvasElement.querySelector<HTMLElement>(
      '[data-slot="product-list"]'
    );
    const sortButton = [
      ...(controlList?.querySelectorAll("button") ?? []),
    ].find((button) => button.textContent?.trim() === "Sort by");
    const filterIcon = canvasElement.querySelector<HTMLImageElement>(
      '[data-search-results-filter-button="true"] img'
    );
    const allFiltersButton = filterIcon?.closest<HTMLButtonElement>("button");
    const fulfilledLogo = canvasElement.querySelector<HTMLImageElement>(
      '[data-slot="search-results-fulfilled-logo"]'
    );
    const dropdownIcons = canvasElement.querySelectorAll<HTMLImageElement>(
      '[data-slot="search-results-dropdown-icon"]'
    );
    const sortDropdownIcon = dropdownIcons.item(0);
    const categoryButton = [
      ...(controlList?.querySelectorAll("button") ?? []),
    ].find((button) => button.textContent?.trim() === "Category");
    const popularFilters = canvasElement.querySelectorAll<HTMLButtonElement>(
      '[data-search-results-popular-filter="true"]'
    );
    const popularFilter = popularFilters.item(0);
    const secondPopularFilter = popularFilters.item(1);
    if (
      !page ||
      !main ||
      !controls ||
      !controlList ||
      !productList ||
      !sortButton ||
      !filterIcon ||
      !allFiltersButton ||
      !fulfilledLogo ||
      !popularFilter ||
      !secondPopularFilter ||
      !sortDropdownIcon ||
      !categoryButton ||
      widthConsumers.some((element) => !element) ||
      results.length < 12 ||
      filters.length < 10
    ) {
      throw new Error(
        "Search results page did not render its full results state"
      );
    }
    if (
      main.dataset.contentMaxWidth !== "1440px" ||
      widthConsumers.some(
        (element) =>
          getComputedStyle(element as HTMLElement).maxWidth !== "1440px"
      )
    ) {
      throw new Error(
        "Search results content does not share its page-level width"
      );
    }
    const controlsStyle = getComputedStyle(controls);
    const controlListStyle = getComputedStyle(controlList);
    const sortStyle = getComputedStyle(sortButton);
    const sortDropdownContainer = sortDropdownIcon.closest<HTMLElement>(
      '[data-slot="filter-chip-right-icon"]'
    );
    const sortDropdownStyle = sortDropdownContainer
      ? getComputedStyle(sortDropdownContainer)
      : null;
    const categoryStyle = getComputedStyle(categoryButton);
    if (
      controlsStyle.paddingTop !== "0px" ||
      controlsStyle.paddingBottom !== "0px" ||
      controlListStyle.paddingTop !== "16px" ||
      controlListStyle.paddingBottom !== "16px" ||
      controlsStyle.borderTopWidth !== "1px" ||
      controlsStyle.borderTopStyle !== "solid" ||
      sortStyle.paddingLeft !== "12px" ||
      sortStyle.paddingRight !== "12px" ||
      sortDropdownStyle?.position !== "static" ||
      categoryStyle.paddingLeft !== "12px" ||
      categoryStyle.paddingRight !== "12px" ||
      categoryStyle.gap !== "4px" ||
      filterIcon.width !== 16 ||
      filterIcon.height !== 16 ||
      filterIcon.naturalWidth !== 24 ||
      filterIcon.naturalHeight !== 24 ||
      fulfilledLogo.width !== 16 ||
      fulfilledLogo.height !== 16 ||
      fulfilledLogo.naturalWidth !== 64 ||
      fulfilledLogo.naturalHeight !== 64 ||
      dropdownIcons.length !== 8 ||
      [...dropdownIcons].some(
        (icon) =>
          icon.width !== 12 ||
          icon.height !== 12 ||
          icon.naturalWidth !== 16 ||
          icon.naturalHeight !== 16
      ) ||
      controls.querySelectorAll("svg").length > 0 ||
      productList.dataset.dividerPosition !== "none" ||
      getComputedStyle(productList).borderTopWidth !== "0px"
    ) {
      throw new Error(
        "Search results control spacing does not match its owner"
      );
    }

    await userEvent.click(popularFilter);
    await userEvent.unhover(popularFilter);
    await waitFor(() => {
      const selectedStyle = getComputedStyle(popularFilter);
      if (
        popularFilter.getAttribute("aria-pressed") !== "true" ||
        selectedStyle.backgroundColor !== "rgb(255, 255, 255)" ||
        selectedStyle.borderColor !== "rgba(0, 0, 0, 0)" ||
        selectedStyle.borderWidth !== "1px" ||
        selectedStyle.borderStyle !== "solid" ||
        selectedStyle.boxShadow !==
          "rgba(0, 0, 0, 0.87) 0px 0px 0px 1px inset" ||
        popularFilter.querySelector("svg")
      ) {
        throw new Error("Popular filter selected state is not outlined");
      }
    });

    await userEvent.click(secondPopularFilter);
    await waitFor(() => {
      if (
        popularFilter.getAttribute("aria-pressed") !== "false" ||
        secondPopularFilter.getAttribute("aria-pressed") !== "true"
      ) {
        throw new Error("Popular filters must allow only one selection");
      }
    });
    await userEvent.click(popularFilter);

    await userEvent.click(categoryButton);
    const categoryPopup = await waitFor(() => {
      const popup = document.querySelector<HTMLElement>(
        '[data-slot="filter-chip-category-menu"]'
      );
      if (!popup || getComputedStyle(popup).width !== "360px") {
        throw new Error("Category filter popup does not match the Figma width");
      }
      return popup;
    });

    const beverageOption = [...categoryPopup.querySelectorAll("label")].find(
      (label) => label.textContent?.trim() === "Beverage"
    );
    if (!beverageOption) throw new Error("Category root branch did not render");
    const categoryList = beverageOption.closest('[role="radiogroup"]');
    const beverageRow = beverageOption.parentElement;
    if (
      !categoryList ||
      !beverageRow ||
      getComputedStyle(categoryList).padding !== "8px" ||
      getComputedStyle(beverageRow).height !== "36px" ||
      getComputedStyle(beverageRow).padding !== "4px" ||
      getComputedStyle(beverageRow).gap !== "0px" ||
      getComputedStyle(beverageOption).padding !== "0px"
    ) {
      throw new Error("Category row padding does not match the Figma item");
    }
    await userEvent.click(beverageOption);

    const beverageToggle = await waitFor(() => {
      const toggle = categoryPopup.querySelector<HTMLButtonElement>(
        'button[aria-label="Collapse Beverage"]'
      );
      if (
        !toggle ||
        getComputedStyle(toggle).width !== "28px" ||
        getComputedStyle(toggle).height !== "28px"
      ) {
        throw new Error("Category expand control is not 28 by 28 pixels");
      }
      return toggle;
    });

    await userEvent.click(beverageToggle);
    await waitFor(() => {
      if (
        categoryPopup.querySelector('button[aria-label="Expand Beverage"]') ===
          null ||
        beverageOption
          .querySelector('[role="radio"]')
          ?.getAttribute("aria-checked") !== "true"
      ) {
        throw new Error("Expand control changed the selected category");
      }
    });
    await userEvent.click(
      categoryPopup.querySelector<HTMLButtonElement>(
        'button[aria-label="Expand Beverage"]'
      )!
    );

    const teaOption = await waitFor(() => {
      const option = [...categoryPopup.querySelectorAll("label")].find(
        (label) => label.textContent?.trim() === "Tea"
      );
      if (!option) throw new Error("Category second level did not expand");
      return option;
    });
    await userEvent.click(teaOption);

    await waitFor(() => {
      const toggle = categoryPopup.querySelector<HTMLButtonElement>(
        'button[aria-label="Collapse Tea"]'
      );
      if (
        !toggle ||
        getComputedStyle(toggle).width !== "28px" ||
        getComputedStyle(toggle).height !== "28px"
      ) {
        throw new Error("Selecting a second-level category did not expand it");
      }
    });

    const popupTop = categoryPopup.getBoundingClientRect().top;
    const triggerBottom = categoryButton.getBoundingClientRect().bottom;
    const categoryListStyle = getComputedStyle(categoryList);
    const popupMaxHeight = Number.parseFloat(
      getComputedStyle(categoryPopup).maxHeight
    );
    if (
      Math.abs(popupTop - triggerBottom - 4) > 1 ||
      categoryListStyle.overflowY !== "auto" ||
      (popupMaxHeight < 800 &&
        categoryList.scrollHeight <= categoryList.clientHeight)
    ) {
      throw new Error("Category popup moved away from its bottom anchor");
    }

    const teaDrinks = await waitFor(() => {
      const option = [...categoryPopup.querySelectorAll("label")].find(
        (label) => label.textContent?.trim() === "Tea Drinks"
      );
      if (!option) throw new Error("Category third level did not expand");
      return option;
    });
    await userEvent.click(teaDrinks);

    const applyCategory = [...categoryPopup.querySelectorAll("button")].find(
      (button) => button.textContent?.includes("Show")
    );
    if (!applyCategory || getComputedStyle(applyCategory).height !== "40px") {
      throw new Error("Category footer action does not match the Figma size");
    }
    await userEvent.click(applyCategory);
    await waitFor(() => {
      if (
        categoryButton.getAttribute("aria-pressed") !== "true" ||
        getComputedStyle(categoryButton).boxShadow !==
          "rgba(0, 0, 0, 0.87) 0px 0px 0px 1px inset"
      ) {
        throw new Error("Applied category is not reflected by the trigger");
      }
    });

    await userEvent.click(allFiltersButton);
    const allFiltersDialog = await waitFor(() => {
      const dialog = document.querySelector<HTMLElement>(
        '[data-slot="all-filters-dialog"]'
      );
      if (
        !dialog ||
        getComputedStyle(dialog).width !== "560px" ||
        dialog.getAttribute("aria-modal") !== "true"
      ) {
        throw new Error("All filters dialog did not match the Figma shell");
      }
      return dialog;
    });
    const allFiltersBody =
      allFiltersDialog.querySelector<HTMLElement>('[class*="_body_"]');
    if (
      !allFiltersBody ||
      getComputedStyle(allFiltersBody).paddingLeft !== "0px" ||
      getComputedStyle(allFiltersBody).paddingRight !== "0px"
    ) {
      throw new Error("All filters body padding is incorrect");
    }

    const firstFilterSection = allFiltersBody.querySelector("section");
    if (
      !firstFilterSection ||
      getComputedStyle(firstFilterSection).paddingTop !== "12px" ||
      getComputedStyle(firstFilterSection).paddingRight !== "16px" ||
      getComputedStyle(firstFilterSection).paddingBottom !== "12px" ||
      getComputedStyle(firstFilterSection).paddingLeft !== "16px"
    ) {
      throw new Error("All filters section padding is incorrect");
    }

    const sectionLabels = [
      "Sort by",
      "Category",
      "Fulfilled by Yami",
      "In Stock",
      "Offers",
      "Brand",
      "Region",
      "Price",
      "Tags",
      "Seller",
    ];
    if (
      sectionLabels.some(
        (label) => !allFiltersDialog.textContent?.includes(label)
      )
    ) {
      throw new Error("All filters dialog is missing a filter section");
    }

    const sortSectionButton = [
      ...allFiltersDialog.querySelectorAll("button"),
    ].find(
      (button) =>
        button.querySelector("strong")?.textContent?.trim() === "Sort by"
    );
    if (
      !sortSectionButton ||
      getComputedStyle(sortSectionButton).paddingLeft !== "8px" ||
      getComputedStyle(sortSectionButton).paddingRight !== "8px" ||
      getComputedStyle(sortSectionButton).minHeight !== "44px"
    )
      throw new Error("All filters sort section is missing");

    const sortSectionIcon = sortSectionButton.querySelector<HTMLElement>(
      '[class*="_sectionIcon_"]'
    );
    const sortSectionIconImage = sortSectionIcon?.querySelector("img");
    if (
      !sortSectionIcon ||
      !sortSectionIconImage ||
      getComputedStyle(sortSectionIcon).width !== "28px" ||
      getComputedStyle(sortSectionIcon).height !== "28px" ||
      getComputedStyle(sortSectionIconImage).width !== "16px" ||
      getComputedStyle(sortSectionIconImage).height !== "16px"
    ) {
      throw new Error("All filters section toggle size is incorrect");
    }
    await userEvent.click(sortSectionButton);
    await waitFor(() => {
      const sortGroup = allFiltersDialog.querySelector(
        '[role="radiogroup"][aria-label="Sort by"]'
      );
      if (
        !sortGroup ||
        sortGroup.querySelectorAll('[role="radio"]').length !== 8
      ) {
        throw new Error("All filters sort data is incomplete");
      }
      if (
        getComputedStyle(sortGroup).columnGap !== "2px" ||
        getComputedStyle(sortGroup).rowGap !== "4px"
      ) {
        throw new Error("All filters option grid gap is incorrect");
      }
      const firstSortOption = sortGroup.querySelector("label");
      if (
        !firstSortOption ||
        getComputedStyle(firstSortOption).paddingLeft !== "8px" ||
        getComputedStyle(firstSortOption).paddingRight !== "8px"
      ) {
        throw new Error("All filters child option padding is incorrect");
      }
      const sectionContent = sortGroup.parentElement;
      if (
        !sectionContent ||
        getComputedStyle(sectionContent).paddingLeft !== "0px" ||
        getComputedStyle(sectionContent).paddingRight !== "0px"
      ) {
        throw new Error("All filters section content padding is incorrect");
      }
    });

    const fulfilledSwitch = allFiltersDialog.querySelector<HTMLButtonElement>(
      '[role="switch"][aria-checked="false"]'
    );
    if (
      !fulfilledSwitch ||
      !fulfilledSwitch.textContent?.includes("Fulfilled by Yami")
    ) {
      throw new Error("All filters fulfilled row switch is missing");
    }
    await userEvent.click(fulfilledSwitch);
    if (fulfilledSwitch.getAttribute("aria-checked") !== "true") {
      throw new Error("Clicking the full switch row did not toggle it");
    }

    const selectedFilterTag = allFiltersDialog.querySelector<HTMLElement>(
      '[aria-label="Selected filters"] > span'
    );
    if (
      !selectedFilterTag ||
      getComputedStyle(selectedFilterTag).height !== "32px" ||
      getComputedStyle(selectedFilterTag).fontSize !== "14px"
    ) {
      throw new Error("All filters selected tag size is incorrect");
    }
    const removeSelectedFilter =
      selectedFilterTag.querySelector<HTMLButtonElement>(
        'button[aria-label="Remove Tea Drinks filter"]'
      );
    if (!removeSelectedFilter) {
      throw new Error("All filters selected tag remove action is missing");
    }
    const removeSelectedFilterIcon =
      removeSelectedFilter.querySelector<HTMLImageElement>("img");
    if (
      !removeSelectedFilterIcon ||
      removeSelectedFilterIcon.width !== 16 ||
      !decodeURIComponent(removeSelectedFilterIcon.src).includes(
        "viewBox='0 0 16 16'"
      )
    ) {
      throw new Error("All filters selected tag close icon is incorrect");
    }
    await userEvent.click(removeSelectedFilter);
    if (
      allFiltersDialog.querySelector(
        'button[aria-label="Remove Tea Drinks filter"]'
      )
    ) {
      throw new Error("All filters selected tag was not removed");
    }

    const showResultsButton = [
      ...allFiltersDialog.querySelectorAll("button"),
    ].find((button) => /^Show [\d,]+ results$/.test(button.textContent?.trim() ?? ""));
    const allFiltersFooter = showResultsButton?.closest("footer");
    if (
      !showResultsButton ||
      !allFiltersFooter ||
      getComputedStyle(showResultsButton).flexGrow !== "0" ||
      getComputedStyle(allFiltersFooter).justifyContent !== "space-between"
    ) {
      throw new Error("All filters apply action is not content-sized");
    }

    const closeFilters = allFiltersDialog.querySelector<HTMLButtonElement>(
      'button[aria-label="Close filters"]'
    );
    if (!closeFilters) throw new Error("All filters close action is missing");
    await userEvent.click(closeFilters);
    await waitFor(() => {
      if (document.querySelector('[data-slot="all-filters-dialog"]')) {
        throw new Error("All filters dialog did not close");
      }
    });
  },
};

function assertMobilePopularRail(canvasElement: HTMLElement) {
  const popularList = canvasElement.querySelector<HTMLElement>(
    '[data-search-results-popular-list="true"]'
  );
  const productListContainer = canvasElement.querySelector<HTMLElement>(
    '[data-slot="product-list-container"]'
  );
  const pagination = canvasElement.querySelector<HTMLElement>(
    '[data-slot="search-results-pagination"]'
  );
  const clearFilters = canvasElement.querySelector<HTMLElement>(
    '[data-slot="search-results-clear-filters"]'
  );
  if (!popularList || !productListContainer || !pagination) {
    throw new Error("Mobile search results layout is incomplete");
  }
  const style = getComputedStyle(popularList);
  if (
    style.boxSizing !== "border-box" ||
    style.paddingLeft !== "12px" ||
    style.paddingRight !== "12px" ||
    style.scrollPaddingLeft !== "12px" ||
    style.scrollPaddingRight !== "12px" ||
    getComputedStyle(productListContainer).paddingTop !== "0px" ||
    getComputedStyle(pagination).display !== "none" ||
    (clearFilters && getComputedStyle(clearFilters).display !== "none")
  ) {
    throw new Error("Mobile search results spacing is incorrect");
  }
}

export const Mobile: Story = {
  globals: {
    viewport: { value: "yamiMobile", isRotated: false },
  },
  render: (_args, { globals }) => (
    <SearchResultsPage
      {...createSearchResultsStoryFixture(localeFromGlobals(globals.locale))}
    />
  ),
  play: async ({ canvasElement }) => {
    assertMobilePopularRail(canvasElement);
    const backLink = canvasElement.querySelector<HTMLAnchorElement>(
      '[data-slot="search-results-mobile-back"]'
    );
    const layoutToggle = canvasElement.querySelector<HTMLButtonElement>(
      '[data-slot="search-results-layout-toggle"]'
    );
    if (
      backLink?.getAttribute("href") !==
        "/?path=/story/yami-pages-search--mobile-discovery&globals=locale%3Aen" ||
      backLink.getAttribute("target") !== "_top" ||
      layoutToggle?.getAttribute("aria-pressed") !== "false" ||
      layoutToggle.getAttribute("aria-label") !== "Switch to list view"
    ) {
      throw new Error("Mobile search results must open in grid view");
    }
  },
};

export const MobileInteractions: Story = {
  name: "Mobile interaction tests",
  tags: ["!dev"],
  globals: {
    viewport: { value: "yamiMobile", isRotated: false },
  },
  render: (_args, { globals }) => (
    <SearchResultsPage
      {...createSearchResultsStoryFixture(localeFromGlobals(globals.locale))}
    />
  ),
  play: async ({ canvasElement }) => {
    if (import.meta.env.MODE !== "test") return;

    assertMobilePopularRail(canvasElement);

    const document = canvasElement.ownerDocument;
    const viewport = document.defaultView;
    const layoutToggle = canvasElement.querySelector<HTMLButtonElement>(
      '[data-slot="search-results-layout-toggle"]'
    );
    const productList = canvasElement.querySelector<HTMLElement>(
      '[data-slot="product-list"]'
    );
    const productItems = canvasElement.querySelector<HTMLElement>(
      '[data-slot="product-list-items"]'
    );
    const popularFilter = canvasElement.querySelector<HTMLButtonElement>(
      '[data-search-results-popular-filter="true"]'
    );
    if (!layoutToggle || !productList || !productItems || !popularFilter) {
      throw new Error("Mobile product layout toggle did not render");
    }

    await userEvent.click(popularFilter);
    await waitFor(() => {
      const clearFilters = canvasElement.querySelector<HTMLElement>(
        '[data-slot="search-results-clear-filters"]'
      );
      if (!clearFilters || getComputedStyle(clearFilters).display !== "none") {
        throw new Error("Mobile clear filters action must stay hidden");
      }
    });
    await userEvent.click(popularFilter);

    await userEvent.click(layoutToggle);
    await waitFor(() => {
      const firstCard = productItems.querySelector<HTMLElement>(
        '[data-slot="product-card"]'
      );
      const media = firstCard?.querySelector<HTMLElement>(
        '[data-slot="product-card-media"]'
      );
      const content = firstCard?.querySelector<HTMLElement>(
        '[data-slot="product-card-content"]'
      );
      const priceActionRow = firstCard?.querySelector<HTMLElement>(
        '[data-slot="product-card-price-action-row"]'
      );
      const mediaRect = media?.getBoundingClientRect();
      const contentStyle = content ? getComputedStyle(content) : undefined;
      if (
        layoutToggle.getAttribute("aria-pressed") !== "true" ||
        layoutToggle.getAttribute("aria-label") !== "Switch to grid view" ||
        productList.dataset.view !== "list" ||
        firstCard?.dataset.presentation !== "compact" ||
        !content ||
        !priceActionRow ||
        mediaRect?.width !== 132 ||
        mediaRect.height !== 132 ||
        getComputedStyle(productItems).rowGap !== "16px" ||
        contentStyle?.flexGrow !== "1" ||
        contentStyle.paddingTop !== "0px" ||
        contentStyle.paddingRight !== "0px" ||
        contentStyle.paddingBottom !== "0px" ||
        contentStyle.paddingLeft !== "0px" ||
        getComputedStyle(priceActionRow).display !== "flex"
      ) {
        throw new Error("Mobile product list did not switch to horizontal cards");
      }
    });

    await userEvent.click(layoutToggle);
    await waitFor(() => {
      const firstCard = productItems.querySelector<HTMLElement>(
        '[data-slot="product-card"]'
      );
      if (
        layoutToggle.getAttribute("aria-pressed") !== "false" ||
        layoutToggle.getAttribute("aria-label") !== "Switch to list view" ||
        productList.dataset.view !== "grid" ||
        firstCard?.dataset.presentation !== "rich"
      ) {
        throw new Error("Mobile product list did not return to grid cards");
      }
    });

    const controlList = canvasElement.querySelector<HTMLElement>(
      '[data-search-results-control-list="true"]'
    );
    const findControl = (label: string) =>
      [...(controlList?.querySelectorAll("button") ?? [])].find(
        (button) => button.textContent?.trim() === label
      );

    const assertChipBottomSheet = async (
      slot: string,
      expectedTitle: string
    ) => {
      await waitFor(() => {
        const nextPopup = document.querySelector<HTMLElement>(
          `[data-slot="${slot}"]`
        );
        if (!nextPopup) throw new Error(`${slot} did not open`);
        const title = nextPopup.querySelector<HTMLElement>(
          '[data-slot="filter-chip-menu-title"]'
        );
        const closeButton = title?.querySelector<HTMLButtonElement>("button");
        const heading = title?.querySelector<HTMLElement>("h2");
        const positioner = nextPopup.parentElement;
        const backdrop = document.querySelector<HTMLElement>(
          '[data-slot="filter-chip-menu-backdrop"]'
        );
        const popupRect = nextPopup.getBoundingClientRect();
        if (
          !viewport ||
          !positioner ||
          !backdrop ||
          !title ||
          !closeButton ||
          !heading ||
          title.textContent?.trim() !== expectedTitle ||
          getComputedStyle(title).display === "none" ||
          getComputedStyle(title).rowGap !== "4px" ||
          getComputedStyle(title).minHeight !== "0px" ||
          getComputedStyle(title).paddingTop !== "12px" ||
          getComputedStyle(title).paddingBottom !== "12px" ||
          getComputedStyle(heading).fontSize !== "20px" ||
          getComputedStyle(closeButton).position !== "static" ||
          getComputedStyle(closeButton).justifySelf !== "end" ||
          getComputedStyle(positioner).position !== "fixed" ||
          getComputedStyle(positioner).bottom !== "0px" ||
          getComputedStyle(backdrop).position !== "fixed" ||
          Math.abs(popupRect.width - viewport.innerWidth) > 1 ||
          Math.abs(popupRect.bottom - viewport.innerHeight) > 1 ||
          getComputedStyle(nextPopup).borderBottomLeftRadius !== "0px" ||
          getComputedStyle(nextPopup).borderBottomRightRadius !== "0px"
        ) {
          throw new Error(`${slot} is not a mobile bottom sheet`);
        }
      });
    };

    const sortButton = findControl("Sort by");
    const categoryButton = findControl("Category");
    const offersButton = findControl("Offers");
    const allFiltersButton = canvasElement.querySelector<HTMLButtonElement>(
      '[data-search-results-filter-button="true"]'
    );
    if (
      !sortButton ||
      !categoryButton ||
      !offersButton ||
      !allFiltersButton
    ) {
      throw new Error("Mobile filter controls are incomplete");
    }

    await userEvent.click(sortButton);
    await assertChipBottomSheet("filter-chip-menu", "Sort by");
    await userEvent.keyboard("{Escape}");
    await waitFor(() => {
      if (document.querySelector('[data-slot="filter-chip-menu"]')) {
        throw new Error("Sort bottom sheet did not close");
      }
    });

    await userEvent.click(categoryButton);
    await assertChipBottomSheet("filter-chip-category-menu", "Category");
    await userEvent.keyboard("{Escape}");
    await waitFor(() => {
      if (document.querySelector('[data-slot="filter-chip-category-menu"]')) {
        throw new Error("Category bottom sheet did not close");
      }
    });

    await userEvent.click(offersButton);
    await assertChipBottomSheet("filter-chip-menu", "Offers");
    await userEvent.keyboard("{Escape}");
    await waitFor(() => {
      if (document.querySelector('[data-slot="filter-chip-menu"]')) {
        throw new Error("Multiple-choice bottom sheet did not close");
      }
    });

    await userEvent.click(allFiltersButton);
    const allFiltersDialog = await waitFor(() => {
      const dialog = document.querySelector<HTMLElement>(
        '[data-slot="all-filters-dialog"]'
      );
      if (!dialog) throw new Error("All filters dialog did not open");
      return dialog;
    });
    const overlay = allFiltersDialog.parentElement;
    const dialogRect = allFiltersDialog.getBoundingClientRect();
    const mobileSections = allFiltersDialog.querySelectorAll<HTMLElement>(
      "section"
    );
    const firstMobileSectionAction = mobileSections[0]?.querySelector<HTMLElement>(
      ":scope > button"
    );
    const mobileSectionLabels = allFiltersDialog.querySelectorAll<HTMLElement>(
      "section > button > strong"
    );
    if (!firstMobileSectionAction) {
      throw new Error("All filters dialog is missing a mobile section action");
    }
    await userEvent.hover(firstMobileSectionAction);
    if (
      !viewport ||
      !overlay ||
      allFiltersDialog.querySelector("h2")?.textContent?.trim() !== "Filters" ||
      getComputedStyle(allFiltersDialog.querySelector("h2")!).fontSize !==
        "20px" ||
      getComputedStyle(allFiltersDialog.querySelector("header")!).rowGap !==
        "4px" ||
      getComputedStyle(allFiltersDialog.querySelector("header")!).paddingTop !==
        "12px" ||
      getComputedStyle(allFiltersDialog.querySelector("header")!)
        .paddingBottom !== "12px" ||
      getComputedStyle(overlay).alignItems !== "end" ||
      Math.abs(dialogRect.width - viewport.innerWidth) > 1 ||
      Math.abs(dialogRect.bottom - viewport.innerHeight) > 1 ||
      dialogRect.height + 1 < viewport.innerHeight * 0.5 ||
      getComputedStyle(allFiltersDialog).borderBottomLeftRadius !== "0px" ||
      getComputedStyle(allFiltersDialog).borderBottomRightRadius !== "0px" ||
      [...mobileSections].some(
        (section) =>
          getComputedStyle(section).paddingTop !== "4px" ||
          getComputedStyle(section).paddingBottom !== "4px" ||
          getComputedStyle(section).paddingLeft !== "8px" ||
          getComputedStyle(section).paddingRight !== "8px" ||
          getComputedStyle(section, "::after").left !== "8px" ||
          getComputedStyle(section, "::after").right !== "8px"
      ) ||
      [...mobileSectionLabels].some(
        (label) =>
          getComputedStyle(label).fontSize !== "14px" ||
          getComputedStyle(label).fontWeight !== "500"
      ) ||
      getComputedStyle(firstMobileSectionAction).backgroundColor !==
        "rgba(0, 0, 0, 0)"
    ) {
      throw new Error("All filters dialog is not a mobile bottom sheet");
    }

    const expandableSections = [
      ["Sort by", "sort"],
      ["Category", "category"],
      ["Offers", "offers"],
      ["Brand", "brand"],
      ["Region", "region"],
      ["Price", "price"],
      ["Tags", "tags"],
      ["Seller", "seller"],
    ] as const;

    for (const [label, section] of expandableSections) {
      const sectionButton = [
        ...allFiltersDialog.querySelectorAll<HTMLButtonElement>(
          "section > button"
        ),
      ].find((button) =>
        button.querySelector("strong")?.textContent?.trim() === label
      );
      if (!sectionButton) {
        throw new Error(`${label} mobile section action is missing`);
      }

      const sectionArrow = sectionButton.querySelector<HTMLImageElement>(
        '[class*="_mobileSectionIcon_"]'
      );
      if (
        !sectionArrow ||
        getComputedStyle(sectionArrow).display === "none" ||
        getComputedStyle(sectionArrow).width !== "16px" ||
        getComputedStyle(sectionArrow).height !== "16px"
      ) {
        throw new Error(`${label} mobile section action is missing its arrow`);
      }

      await userEvent.click(sectionButton);
      const subdialog = await waitFor(() => {
        const nextSubdialog = allFiltersDialog.querySelector<HTMLElement>(
          `[data-slot="all-filters-subdialog"][data-section="${section}"]`
        );
        if (!nextSubdialog) {
          throw new Error(`${label} did not open in a mobile child dialog`);
        }
        return nextSubdialog;
      });
      const subdialogStyle = getComputedStyle(subdialog);
      const subdialogHeader = allFiltersDialog.querySelector<HTMLElement>(
        "header"
      );
      const subdialogCloseButton = allFiltersDialog.querySelector(
        'button[aria-label="Close filters"]'
      );
      if (
        allFiltersDialog.querySelector("h2")?.textContent?.trim() !== label ||
        !subdialogHeader ||
        getComputedStyle(subdialogHeader).rowGap !== "8px" ||
        subdialogCloseButton ||
        allFiltersDialog.getBoundingClientRect().height + 1 <
          viewport.innerHeight * 0.5 ||
        subdialogStyle.paddingLeft !== "8px" ||
        subdialogStyle.paddingRight !== "8px" ||
        subdialogStyle.fontSize !== "14px"
      ) {
        throw new Error(`${label} child dialog layout is incorrect`);
      }

      const mobileOptions = subdialog.querySelectorAll<HTMLElement>(
        '[class*="_optionRow_"], [class*="_categoryChoice_"]'
      );
      if (
        [...mobileOptions].some(
          (option) => getComputedStyle(option).columnGap !== "8px"
        )
      ) {
        throw new Error(`${label} mobile option spacing is incorrect`);
      }

      if (section === "category") {
        const categoryExpandButton = allFiltersDialog.querySelector(
          '[class*="_expandButton_"]'
        );
        const visibleCategoryIcons = [
          ...(categoryExpandButton?.querySelectorAll("img") ?? []),
        ].filter((icon) => getComputedStyle(icon).display !== "none");
        if (
          visibleCategoryIcons.length !== 1 ||
          visibleCategoryIcons[0]?.className.includes("mobileSectionIcon")
        ) {
          throw new Error(
            "Category expand control must only show its add or minus icon"
          );
        }
      }

      const backButton = allFiltersDialog.querySelector<HTMLButtonElement>(
        'button[aria-label="Back to all filters"]'
      );
      if (!backButton) {
        throw new Error(`${label} child dialog is missing its back action`);
      }
      await userEvent.click(backButton);
      await waitFor(() => {
        if (
          allFiltersDialog.querySelector(
            '[data-slot="all-filters-subdialog"]'
          ) ||
          allFiltersDialog.querySelector("h2")?.textContent?.trim() !==
            "Filters"
        ) {
          throw new Error(`${label} child dialog did not return to filters`);
        }
      });
    }

    const closeButton = allFiltersDialog.querySelector<HTMLButtonElement>(
      'button[aria-label="Close filters"]'
    );
    if (!closeButton) throw new Error("All filters close action is missing");
    await userEvent.click(closeButton);
  },
};

export const FiltersLoading: Story = {
  name: "Filters loading",
  render: (_args, { globals }) => (
    <SearchResultsPage
      {...createSearchResultsStoryFixture(localeFromGlobals(globals.locale))}
      filtersLoading
    />
  ),
  play: async ({ canvasElement }) => {
    const busySections = canvasElement.querySelectorAll('[aria-busy="true"]');
    const skeletonLists = canvasElement.querySelectorAll(
      '[data-slot="search-results-filter-skeleton"]'
    );
    const skeletonChips = [...skeletonLists].flatMap((list) => [
      ...list.children,
    ]);
    if (busySections.length !== 2 || skeletonChips.length !== 20) {
      throw new Error("Filter loading skeleton is incomplete");
    }
    const firstChip = skeletonChips[0];
    if (!(firstChip instanceof HTMLElement) || firstChip.offsetHeight !== 36) {
      throw new Error("Filter loading skeleton does not preserve chip height");
    }
  },
};

export const Empty: Story = {
  render: (_args, { globals }) => {
    const fixture = createSearchResultsStoryFixture(
      localeFromGlobals(globals.locale)
    );
    return <SearchResultsPage {...fixture} products={[]} />;
  },
};
