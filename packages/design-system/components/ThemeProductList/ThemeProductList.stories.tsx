import type { Meta, StoryObj } from "@storybook/react-vite";

import { ThemeProductList } from "./ThemeProductList";
import { createThemeProductListProps } from "./fixtures";
import storyStyles from "./ThemeProductList.stories.module.css";

const meta = {
  title: "YAMI/Components/Commerce/Theme Product List",
  component: ThemeProductList,
  decorators: [
    (Story) => (
      <div className={storyStyles.canvas}>
        <Story />
      </div>
    ),
  ],
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
    const desktopContent = list?.querySelector<HTMLElement>(
      '[data-slot="theme-product-list-content"]',
    );
    const mobileContent = themeList?.querySelector<HTMLElement>(
      '[data-slot="product-list-leading-content-mobile"] [data-slot="theme-product-list-content"]',
    );
    const content = window.innerWidth < 1024 ? mobileContent : desktopContent;
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
      if (getComputedStyle(list).scrollSnapType !== "none") {
        throw new Error(
          "ThemeProductList desktop must keep its image-led start stable during resize",
        );
      }
    } else {
      const canvas = themeList.parentElement;
      const canvasStyles = canvas ? getComputedStyle(canvas) : null;
      const mobileWrapper = themeList.querySelector<HTMLElement>(
        '[data-slot="product-list-leading-content-mobile"]',
      );
      const desktopWrapper = list.querySelector<HTMLElement>(
        '[data-slot="product-list-leading-content"]',
      );
      const firstProduct = list.querySelector<HTMLElement>(
        '[data-slot="product-list-item"]',
      );
      const container = themeList.querySelector<HTMLElement>(
        '[data-slot="product-list-container"]',
      );
      const listStyles = getComputedStyle(list);
      if (
        !mobileWrapper ||
        !desktopWrapper ||
        !firstProduct ||
        !container ||
        !canvasStyles ||
        canvasStyles.backgroundColor !== "rgb(245, 245, 245)" ||
        getComputedStyle(container).rowGap !== "4px" ||
        getComputedStyle(mobileWrapper).display === "none" ||
        getComputedStyle(desktopWrapper).display !== "none" ||
        mobileWrapper.getBoundingClientRect().bottom >
          firstProduct.getBoundingClientRect().top ||
        listStyles.paddingTop !== "4px" ||
        listStyles.paddingRight !== "6px" ||
        listStyles.paddingBottom !== "4px" ||
        listStyles.paddingLeft !== "6px"
      ) {
        throw new Error(
          "ThemeProductList mobile must use a 4px container gap and stack its content panel above a 4px/6px padded product rail",
        );
      }
    }
  },
};

export const Mobile: Story = {
  globals: { viewport: { value: "yamiMobile", isRotated: false } },
  play: Showcase.play,
};
