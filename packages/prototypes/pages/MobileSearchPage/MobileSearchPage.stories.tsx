import type { Meta, StoryObj } from "@storybook/react-vite";
import { userEvent } from "storybook/test";

import { createPopularSearchImagePanel } from "@yami/design-system/components/Header/fixtures";

import { EcommerceHomeTemplate } from "../EcommerceHome/EcommerceHome";
import { createEcommerceHomeFixture } from "../EcommerceHome/fixtures";
import { popularSearchProductTags } from "../EcommerceHome/popular-search-products.fixture";
import { MobileSearchPage } from "./MobileSearchPage";

const mobileBackHref =
  "/?path=/story/yami-pages-ecommerce-home--mobile&globals=locale%3Aen";

function createPcDiscoveryFixture() {
  const fixture = createEcommerceHomeFixture("en");
  const searchPanel = fixture.header.searchPanel;
  if (!searchPanel) return fixture;
  return {
    ...fixture,
    header: {
      ...fixture.header,
      searchPanel: createPopularSearchImagePanel(
        searchPanel,
        popularSearchProductTags,
      ),
    },
  };
}

const meta = {
  title: "YAMI/Pages/Search",
  parameters: {
    layout: "fullscreen",
    controls: { disable: true },
    docs: {
      description: {
        component:
          "YAMI search experience grouped by device and state. PC search opens as a header overlay; Mobile search opens as a dedicated full-screen page.",
      },
    },
  },
  globals: {
    theme: "light",
    viewport: { value: "yamiMobile", isRotated: false },
  },
} satisfies Meta;

export default meta;
type Story = StoryObj;

export const PcDiscovery: Story = {
  name: "PC — Discovery",
  globals: {
    locale: "en",
    viewport: { value: "yamiDesktopXl", isRotated: false },
  },
  render: () => <EcommerceHomeTemplate {...createPcDiscoveryFixture()} />,
  play: async ({ canvasElement }) => {
    const field = canvasElement.querySelector<HTMLInputElement>(
      '[data-slot="header-search"][data-variant="pc"] [data-slot="header-search-field"]',
    );
    if (!field) throw new Error("PC search field did not render");

    await userEvent.click(field);

    const panel = canvasElement.querySelector<HTMLElement>(
      '[data-slot="header-search-panel"]',
    );
    const popularGroup = panel?.querySelector<HTMLElement>(
      '[data-search-group="popular"]',
    );
    const hotDealsGroup = panel?.querySelector<HTMLElement>(
      '[data-search-group="hot-deals"]',
    );
    const imageSlots = popularGroup?.querySelectorAll<HTMLElement>(
      '[data-slot="header-search-tag-image"]',
    );
    const popularLabels = popularGroup
      ? Array.from(popularGroup.querySelectorAll("button, a"), (tag) =>
          tag.textContent?.trim(),
        )
      : [];
    if (
      panel?.dataset.state !== "discovery" ||
      !popularGroup ||
      !imageSlots ||
      imageSlots.length !== 10 ||
      popularLabels.join("|") !==
        popularSearchProductTags.map((tag) => tag.label).join("|") ||
      hotDealsGroup?.querySelector('[data-slot="header-search-tag-image"]') ||
      Array.from(imageSlots).some((slot) => {
        const image = slot.querySelector<HTMLImageElement>("img");
        const tag = slot.parentElement;
        const style = getComputedStyle(slot);
        const tagStyle = tag ? getComputedStyle(tag) : null;
        const imageStyle = image ? getComputedStyle(image) : null;
        return (
          !image ||
          !imageStyle ||
          !tagStyle ||
          image.alt !== "" ||
          style.width !== "32px" ||
          style.height !== "32px" ||
          style.backgroundColor !== "rgb(255, 255, 255)" ||
          style.alignItems !== "center" ||
          style.justifyContent !== "center" ||
          style.borderRadius !== "9999px" ||
          imageStyle.width !== "28px" ||
          imageStyle.height !== "28px" ||
          tagStyle.paddingTop !== "2px" ||
          tagStyle.paddingRight !== "12px" ||
          tagStyle.paddingBottom !== "2px" ||
          tagStyle.paddingLeft !== "2px"
        );
      })
    ) {
      throw new Error(
        "PC discovery must show ten product-backed Popular Searches with centered images",
      );
    }
  },
};

export const PcWithQuery: Story = {
  name: "PC — With Query",
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
      throw new Error("Typed PC search must match the keyword state");
    }
  },
};

export const MobileDiscovery: Story = {
  name: "Mobile — Discovery",
  render: () => <MobileSearchPage backHref={mobileBackHref} />,
  play: async ({ canvasElement }) => {
    const page = canvasElement.querySelector<HTMLElement>('[data-slot="mobile-search-page"]');
    const field = canvasElement.querySelector<HTMLInputElement>('input[type="search"]');
    const backLink = canvasElement.querySelector<HTMLAnchorElement>(
      '[data-slot="mobile-search-back"]'
    );
    const sections = page?.querySelectorAll("main > section");
    const recentLinks = sections?.item(0).querySelectorAll("a");
    const popularLinks = sections?.item(1).querySelectorAll("a");
    const hotDealLinks = sections?.item(2).querySelectorAll("a");
    const hotDealsList = sections?.item(2).querySelector("ul");
    const hotDealsListStyle = hotDealsList && getComputedStyle(hotDealsList);
    const hotDealRow = hotDealLinks?.item(0).firstElementChild;
    const hotDealRowStyle = hotDealRow && getComputedStyle(hotDealRow);
    const searchResultLinks = [
      ...(recentLinks ?? []),
      ...(popularLinks ?? []),
    ];
    if (
      page?.dataset.state !== "discovery" ||
      backLink?.getAttribute("href") !== mobileBackHref ||
      backLink.getAttribute("target") !== "_top" ||
      document.activeElement !== field ||
      !page.textContent?.includes("Recent Searches") ||
      !page.textContent.includes("Popular Searches") ||
      !page.textContent.includes("Hot Deals") ||
      !recentLinks?.length ||
      new Set(Array.from(recentLinks, (link) => link.offsetTop)).size > 2 ||
      popularLinks?.length !== 10 ||
      hotDealLinks?.length !== 6 ||
      hotDealsListStyle?.paddingTop !== "4px" ||
      hotDealsListStyle.paddingBottom !== "4px" ||
      hotDealRowStyle?.paddingRight !== "2px" ||
      searchResultLinks.some(
        (link) =>
          link.getAttribute("href") !==
            "/?path=/story/yami-pages-search-results--mobile&globals=locale%3Aen" ||
          link.getAttribute("target") !== "_top"
      )
    ) {
      throw new Error(
        "Mobile search must open focused with linked discovery destinations"
      );
    }
  },
};

export const MobileWithQuery: Story = {
  name: "Mobile — With Query",
  render: () => <MobileSearchPage backHref={mobileBackHref} />,
  play: async ({ canvasElement }) => {
    const page = canvasElement.querySelector<HTMLElement>('[data-slot="mobile-search-page"]');
    const field = canvasElement.querySelector<HTMLInputElement>('input[type="search"]');
    if (!field) throw new Error("Mobile search field did not render");
    await userEvent.type(field, "Coffee");
    const suggestions = page?.querySelectorAll<HTMLButtonElement>('[data-slot="mobile-search-suggestions"] > button');
    if (
      field.value !== "Coffee" ||
      page?.dataset.state !== "suggestions" ||
      suggestions?.length !== 8 ||
      suggestions.item(0).textContent?.trim() !== "coffee"
    ) {
      throw new Error("Mobile search query must show the Figma Coffee suggestions");
    }
  },
};
