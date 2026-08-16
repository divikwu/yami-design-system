import type { Meta, StoryObj } from "@storybook/react-vite";
import { userEvent } from "storybook/test";

import { MobileSearchPage } from "./MobileSearchPage";

const meta = {
  title: "YAMI/Pages/Mobile Search",
  component: MobileSearchPage,
  parameters: { layout: "fullscreen", controls: { disable: true } },
  globals: {
    theme: "light",
    viewport: { value: "yamiMobile", isRotated: false },
  },
  args: {
    backHref:
      "/?path=/story/yami-pages-ecommerce-home--mobile&globals=locale%3Aen",
  },
} satisfies Meta<typeof MobileSearchPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = {
  name: "Empty",
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
    const searchResultLinks = [
      ...(recentLinks ?? []),
      ...(popularLinks ?? []),
    ];
    if (
      page?.dataset.state !== "discovery" ||
      backLink?.getAttribute("href") !==
        "/?path=/story/yami-pages-ecommerce-home--mobile&globals=locale%3Aen" ||
      backLink.getAttribute("target") !== "_top" ||
      document.activeElement !== field ||
      !page.textContent?.includes("Recent Searches") ||
      !page.textContent.includes("Popular Searches") ||
      !page.textContent.includes("Hot Deals") ||
      recentLinks?.length !== 7 ||
      popularLinks?.length !== 10 ||
      hotDealLinks?.length !== 6 ||
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

export const WithQuery: Story = {
  name: "With Query",
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
