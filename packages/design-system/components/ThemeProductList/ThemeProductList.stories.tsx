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
  argTypes: {
    mobileSurface: {
      options: ["card", "plain"],
      control: { type: "radio" },
      description:
        "Mobile section surface. Card preserves the inset rounded panel; plain is full-bleed with 16px content padding and supports dividers.",
    },
    dividerPosition: {
      options: ["top", "bottom", "none"],
      control: { type: "radio" },
      description:
        "Section divider edge. Always supported on desktop; on mobile it is available only for the plain surface.",
    },
    dividerVariant: {
      options: ["gray", "black"],
      control: { type: "radio" },
      description: "Gray renders at 1px; black emphasis renders at 2px.",
    },
  },
  args: {
    ...createThemeProductListProps(),
    mobileSurface: "card",
    dividerPosition: "top",
    dividerVariant: "gray",
  },
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
    const scrim = content?.querySelector<HTMLElement>(
      '[data-slot="theme-product-list-scrim"]',
    );
    const contentTitle = overlay?.querySelector<HTMLElement>("h3");
    const contentDescription = overlay?.querySelector<HTMLElement>("p");

    if (
      !themeList ||
      !list ||
      !content ||
      !image ||
      !overlay ||
      !scrim ||
      !contentTitle ||
      !contentDescription
    ) {
      throw new Error(
        "ThemeProductList must render its content panel, image, overlay and product rail",
      );
    }
    if (!image.alt.trim() || !overlay.textContent?.includes("Start Fresh")) {
      throw new Error("ThemeProductList content requires meaningful copy and alt text");
    }
    const contentStyle = getComputedStyle(content);
    const scrimStyle = getComputedStyle(scrim);
    const scrimBox = scrim.getBoundingClientRect();
    const contentBox = content.getBoundingClientRect();
    if (
      Math.abs(scrimBox.width - contentBox.width) > 1 ||
      Math.abs(scrimBox.height - contentBox.height) > 1 ||
      !scrimStyle.backgroundImage.includes("linear-gradient") ||
      !contentStyle
        .getPropertyValue("--theme-product-list-surface-color")
        .trim() ||
      scrimStyle.backdropFilter !== "blur(16px)" ||
      !scrimStyle.maskImage.includes("linear-gradient")
    ) {
      throw new Error(
        "ThemeProductList scene art must use the same adaptive full-panel 20–50% sampled-color gradient and 16px frosted scrim on PC and mobile",
      );
    }
    if (!content.matches('[data-foreground="light"], [data-foreground="dark"]')) {
      throw new Error(
        "ThemeProductList scene art must expose the sampled foreground contrast",
      );
    }
    const expectedTitleSize = window.innerWidth >= 1440 ? "20px" : "18px";
    if (getComputedStyle(contentTitle).fontSize !== expectedTitleSize) {
      throw new Error(
        `ThemeProductList content title must use heading-md (${expectedTitleSize})`,
      );
    }
    if (getComputedStyle(contentDescription).fontWeight !== "400") {
      throw new Error("ThemeProductList description must remain regular at weight 400");
    }
    if (list.firstElementChild?.getAttribute("data-slot") !== "product-list-leading-content") {
      throw new Error("ThemeProductList content must reserve the first rail position");
    }

    const productItems = list.querySelectorAll<HTMLElement>(
      '[data-slot="product-list-item"]',
    );
    const firstProductCard = productItems[0]?.querySelector<HTMLElement>(
      '[data-slot="product-card"]',
    );
    if (
      productItems.length === 0 ||
      !firstProductCard ||
      list.dataset.surface !== "plain" ||
      firstProductCard.dataset.surface !== "plain" ||
      getComputedStyle(firstProductCard).padding !== "0px"
    ) {
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
        listStyles.paddingRight !== "8px" ||
        listStyles.paddingBottom !== "4px" ||
        listStyles.paddingLeft !== "8px"
      ) {
        throw new Error(
          "ThemeProductList mobile must use a 4px container gap and stack its content panel above a 4px/8px padded product rail",
        );
      }
    }
  },
};

export const Mobile: Story = {
  globals: { viewport: { value: "yamiMobile", isRotated: false } },
  play: Showcase.play,
};

export const MobilePlain: Story = {
  name: "Mobile / Plain",
  globals: { viewport: { value: "yamiMobile", isRotated: false } },
  args: {
    mobileSurface: "plain",
    dividerPosition: "top",
    dividerVariant: "gray",
  },
  play: async ({ canvasElement }) => {
    const themeList = canvasElement.querySelector<HTMLElement>(
      '[data-slot="theme-product-list"]',
    );
    const root = themeList?.querySelector<HTMLElement>(
      '[data-slot="product-list"]',
    );
    const container = root?.querySelector<HTMLElement>(
      '[data-slot="product-list-container"]',
    );
    const tabs = root?.querySelector<HTMLElement>('[role="tablist"]');
    const mobileContent = root?.querySelector<HTMLElement>(
      '[data-slot="product-list-leading-content-mobile"]',
    );
    const list = root?.querySelector<HTMLElement>(
      '[data-slot="product-list-items"]',
    );
    const firstProduct = list?.querySelector<HTMLElement>(
      '[data-slot="product-list-item"]',
    );
    const firstCard = firstProduct?.querySelector<HTMLElement>(
      '[data-slot="product-card"]',
    );
    if (
      !themeList ||
      !root ||
      !container ||
      !tabs ||
      !mobileContent ||
      !list ||
      !firstProduct ||
      !firstCard
    ) {
      throw new Error("Plain mobile ThemeProductList did not render");
    }

    const rootStyle = getComputedStyle(root);
    const containerStyle = getComputedStyle(container);
    const listStyle = getComputedStyle(list);
    const rootRect = root.getBoundingClientRect();
    const listRect = list.getBoundingClientRect();
    if (
      root.dataset.mobileSurface !== "plain" ||
      rootRect.left !== 0 ||
      rootRect.right !== window.innerWidth ||
      rootStyle.marginLeft !== "0px" ||
      rootStyle.marginRight !== "0px" ||
      rootStyle.borderRadius !== "0px" ||
      rootStyle.borderTopWidth !== "1px" ||
      rootStyle.borderBottomWidth !== "0px" ||
      containerStyle.padding !== "16px" ||
      tabs.getBoundingClientRect().left !== 0 ||
      tabs.getBoundingClientRect().right !== window.innerWidth ||
      mobileContent.getBoundingClientRect().left !== 16 ||
      mobileContent.getBoundingClientRect().right !== window.innerWidth - 16 ||
      listRect.left !== 0 ||
      listRect.right !== window.innerWidth ||
      list.dataset.surface !== "plain" ||
      firstProduct.getBoundingClientRect().left !== 16 ||
      listStyle.columnGap !== "8px" ||
      listStyle.marginLeft !== "-16px" ||
      listStyle.marginRight !== "-16px" ||
      listStyle.paddingTop !== "4px" ||
      listStyle.paddingRight !== "16px" ||
      listStyle.paddingBottom !== "4px" ||
      listStyle.paddingLeft !== "16px" ||
      listStyle.scrollPaddingInline !== "16px" ||
      firstCard.dataset.surface !== "plain" ||
      getComputedStyle(firstCard).padding !== "0px" ||
      list.scrollWidth <= list.clientWidth
    ) {
      throw new Error(
        "Plain mobile ThemeProductList must use the shared full-bleed ProductList surface",
      );
    }
  },
};
