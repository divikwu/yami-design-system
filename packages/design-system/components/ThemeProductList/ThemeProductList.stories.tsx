import type { Meta, StoryObj } from "@storybook/react-vite";

import { ThemeProductList } from "./ThemeProductList";
import { createThemeProductListProps } from "./fixtures";

const meta = {
  title: "YAMI/Components/Commerce/Theme Product List",
  component: ThemeProductList,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "A StandardRail-based theme product list. It reserves the first two product-card slots for an image-led content panel with a contrast overlay and description, then continues with the shared ProductList rail.",
      },
      source: {
        language: "tsx",
        code: `import { ThemeProductList } from "@yami/design-system";
import { createThemeProductListProps } from "@yami/design-system/components/ThemeProductList/fixtures";

<ThemeProductList {...createThemeProductListProps()} />`,
      },
    },
  },
  args: createThemeProductListProps(),
} satisfies Meta<typeof ThemeProductList>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Showcase: Story = {
  play: async ({ canvasElement }) => {
    const themeList = canvasElement.querySelector<HTMLElement>(
      '[data-slot="theme-product-list"]',
    );
    const list = themeList?.querySelector<HTMLElement>(
      '[data-slot="product-list-items"]',
    );
    const content = themeList?.querySelector<HTMLElement>(
      '[data-slot="theme-product-list-content"]',
    );
    const image = content?.querySelector<HTMLImageElement>("img");
    const overlay = content?.querySelector<HTMLElement>(
      '[data-slot="theme-product-list-overlay"]',
    );

    if (!themeList || !list || !content || !image || !overlay) {
      throw new Error(
        "ThemeProductList must render its content panel, image, overlay and product rail",
      );
    }
    if (!image.alt.trim() || !overlay.textContent?.includes("Start Fresh")) {
      throw new Error("ThemeProductList content requires meaningful copy and alt text");
    }
    if (list.firstElementChild?.getAttribute("data-slot") !== "product-list-leading-content") {
      throw new Error("ThemeProductList content must reserve the first rail position");
    }

    const productItems = list.querySelectorAll<HTMLElement>(
      '[data-slot="product-list-item"]',
    );
    if (productItems.length === 0) {
      throw new Error("ThemeProductList must continue with ProductList products");
    }

    const productText = list.textContent ?? "";
    if (
      !productText.includes("#10 Most Liked Makeup Remover") ||
      !productText.includes("80+ Sold") ||
      !productText.includes("30+ Sold") ||
      !list.querySelector('[data-slot="product-card-badges"]')
    ) {
      throw new Error(
        "ThemeProductList must expose the live ANUA product signals",
      );
    }

    if (window.innerWidth >= 1024) {
      const card = productItems[0];
      if (!card) throw new Error("ThemeProductList rendered no product card");
      const gap = Number.parseFloat(getComputedStyle(list).columnGap);
      const contentWidth = content.getBoundingClientRect().width;
      const cardWidth = card.getBoundingClientRect().width;
      if (Math.abs(contentWidth - (cardWidth * 2 + gap)) > 2) {
        throw new Error(
          `ThemeProductList content must span two cards plus one gap, got ${contentWidth.toFixed(1)}px for ${cardWidth.toFixed(1)}px cards`,
        );
      }

      const container = themeList.querySelector<HTMLElement>(
        '[data-slot="product-list-container"]',
      );
      if (!container || container.getBoundingClientRect().width > 1441) {
        throw new Error("ThemeProductList desktop content must cap at 1440px");
      }
    }
  },
};

export const Mobile: Story = {
  globals: { viewport: { value: "yamiMobile", isRotated: false } },
};
