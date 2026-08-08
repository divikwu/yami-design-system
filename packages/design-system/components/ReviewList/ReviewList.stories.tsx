import type { Meta, StoryObj } from "@storybook/react-vite";

import { ReviewList } from "./ReviewList";
import styles from "./ReviewList.stories.module.css";
import {
  createReviewListProps,
  type ReviewListLocale,
} from "./fixtures";

function localeFromGlobals(value: unknown): ReviewListLocale {
  return value === "zh" ? "zh" : "en";
}

const meta = {
  title: "YAMI/Components/Commerce/Review List",
  component: ReviewList,
  decorators: [
    (Story) => (
      <div className={styles.canvas}>
        <Story />
      </div>
    ),
  ],
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "A responsive review rail that reuses the shared ProductList heading anatomy and renders each customer review with the exported ReviewCard child.",
      },
      source: {
        language: "tsx",
        code: `import { ReviewList } from "@yami/design-system";
import { createReviewListProps } from "@yami/design-system/components/ReviewList/fixtures";

<ReviewList {...createReviewListProps()} />`,
      },
    },
  },
  argTypes: {
    dividerPosition: {
      options: ["top", "bottom", "none"],
      control: { type: "radio" },
      description: "Desktop-only section divider edge; ignored below 1024px.",
    },
    dividerVariant: {
      options: ["gray", "black"],
      control: { type: "radio" },
      description: "Gray renders at 1px; black emphasis renders at 2px.",
    },
  },
  args: {
    ...createReviewListProps(),
    dividerPosition: "top",
    dividerVariant: "gray",
  },
} satisfies Meta<typeof ReviewList>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Showcase: Story = {
  render: (args, { globals }) => (
    <ReviewList
      {...createReviewListProps(localeFromGlobals(globals.locale))}
      dividerPosition={args.dividerPosition}
      dividerVariant={args.dividerVariant}
    />
  ),
  play: async ({ canvasElement }) => {
    const root = canvasElement.querySelector<HTMLElement>(
      '[data-slot="review-list"]',
    );
    const heading = root?.querySelector('[data-slot="review-list-title"]');
    const rail = root?.querySelector<HTMLElement>(
      '[data-slot="review-list-items"]',
    );
    const container = root?.querySelector<HTMLElement>(
      '[data-slot="review-list-container"]',
    );
    const cards = root?.querySelectorAll('[data-slot="review-card"]');
    const railNavigation = root?.querySelector('[data-slot="rail-navigation"]');

    if (
      !root ||
      !heading ||
      !rail ||
      !container ||
      !cards ||
      cards.length !== 3 ||
      railNavigation
    ) {
      throw new Error(
        "ReviewList must render its shared heading, rail and three Figma review cards",
      );
    }

    if (
      !root.textContent?.includes("It feels so gentle") ||
      !root.textContent.includes("Vien L***") ||
      !root.textContent.includes("❤️❤️❤️❤️")
    ) {
      throw new Error("ReviewList is missing the Figma review content");
    }

    const rating = root.querySelector('[data-slot="review-card-rating"]');
    const productImages = root.querySelectorAll("[data-slot=\"review-card-product\"] img");
    if (!rating || rating.getAttribute("aria-label") !== "Rating 4.5 out of 5") {
      throw new Error("ReviewCard must expose its rating to assistive technology");
    }
    const halfStar = rating.querySelector('[data-star-state="half"]');
    if (
      !halfStar ||
      !getComputedStyle(halfStar, "::after").clipPath.includes("50%")
    ) {
      throw new Error("ReviewCard must render the half star from the full icon shape");
    }
    const starStyles = getComputedStyle(halfStar);
    const cardStyles = getComputedStyle(cards[1] as HTMLElement);
    const reviewCopy = root.querySelector<HTMLElement>(
      '[data-slot="review-card-content"]',
    );
    const reviewerCopy = root.querySelector<HTMLElement>(
      '[data-slot="review-card-reviewer"]',
    );
    const productFooter = root.querySelector<HTMLElement>(
      '[data-slot="review-card-product"]',
    );
    const reviewStyles = reviewCopy ? getComputedStyle(reviewCopy) : null;
    const reviewerStyles = reviewerCopy ? getComputedStyle(reviewerCopy) : null;
    const productFooterStyles = productFooter
      ? getComputedStyle(productFooter)
      : null;
    if (
      starStyles.width !== "16px" ||
      starStyles.height !== "16px" ||
      cardStyles.paddingTop !== "12px" ||
      cardStyles.borderRadius !== "8px" ||
      !reviewStyles ||
      reviewStyles.fontSize !== "14px" ||
      reviewStyles.height !== "60px" ||
      reviewStyles.lineHeight !== "20px" ||
      reviewStyles.paddingLeft !== "4px" ||
      reviewStyles.paddingRight !== "4px" ||
      !reviewerStyles ||
      reviewerStyles.paddingLeft !== "4px" ||
      reviewerStyles.paddingRight !== "4px" ||
      !productFooterStyles ||
      productFooterStyles.paddingTop !== "4px" ||
      productFooterStyles.paddingRight !== "8px" ||
      productFooterStyles.paddingBottom !== "4px" ||
      productFooterStyles.paddingLeft !== "4px" ||
      productFooterStyles.borderRadius !== "4px" ||
      getComputedStyle(productImages[0] as HTMLElement).borderRadius !== "2px"
    ) {
      throw new Error(
        "ReviewCard must use the approved card, rating, copy and product-footer spacing",
      );
    }
    if (productImages.length !== 3) {
      throw new Error("ReviewCard must render one product image per review");
    }

    if (window.innerWidth >= 1024) {
      const rootStyles = getComputedStyle(root);
      if (
        rootStyles.borderTopWidth !== "1px" ||
        rootStyles.borderBottomWidth !== "0px"
      ) {
        throw new Error(
          "ReviewList must render its default gray divider on the desktop top edge",
        );
      }
      if (getComputedStyle(container).rowGap !== "16px") {
        throw new Error("ReviewList desktop heading gap must be 16px");
      }
      const firstCard = cards[0] as HTMLElement;
      const gap = Number.parseFloat(getComputedStyle(rail).columnGap);
      const visibleCount = window.innerWidth >= 1920 ? 4 : 3;
      const expected =
        firstCard.getBoundingClientRect().width * visibleCount +
        gap * (visibleCount - 1);
      if (Math.abs(expected - rail.clientWidth) > 2) {
        throw new Error(
          `ReviewList desktop rail must fit ${visibleCount} cards, got ${expected.toFixed(1)}px for a ${rail.clientWidth}px rail`,
        );
      }
    }
  },
};

export const BlackBottomDivider: Story = {
  tags: ["!dev", "!autodocs"],
  args: {
    dividerPosition: "bottom",
    dividerVariant: "black",
  },
  render: Showcase.render,
  play: async ({ canvasElement }) => {
    const root = canvasElement.querySelector<HTMLElement>(
      '[data-slot="review-list"]',
    );
    if (!root) throw new Error("ReviewList did not render");
    const style = getComputedStyle(root);
    if (style.borderBottomWidth !== "2px" || style.borderTopWidth !== "0px") {
      throw new Error(
        "ReviewList black divider must render 2px on the bottom edge only",
      );
    }
  },
};

export const Mobile: Story = {
  globals: { viewport: { value: "yamiMobile", isRotated: false } },
  render: (_args, { globals }) => (
    <ReviewList {...createReviewListProps(localeFromGlobals(globals.locale))} />
  ),
  play: async ({ canvasElement }) => {
    const root = canvasElement.querySelector<HTMLElement>(
      '[data-slot="review-list"]',
    );
    const rail = canvasElement.querySelector<HTMLElement>(
      '[data-slot="review-list-items"]',
    );
    const container = canvasElement.querySelector<HTMLElement>(
      '[data-slot="review-list-container"]',
    );
    const viewAll = canvasElement.querySelector(
      '[data-slot="review-list-view-all-mobile"]',
    );
    const railNavigation = canvasElement.querySelector<HTMLElement>(
      '[data-slot="rail-navigation"]',
    );
    const firstItem = rail?.querySelector<HTMLElement>("li");

    if (
      !root ||
      !rail ||
      !container ||
      !railNavigation ||
      !firstItem
    ) {
      throw new Error("ReviewList mobile rail did not render");
    }

    const rootStyles = getComputedStyle(root);
    const containerStyles = getComputedStyle(container);
    const railStyles = getComputedStyle(rail);
    const railNavigationStyles = getComputedStyle(railNavigation);
    const canvas = root.parentElement;
    const canvasStyles = canvas ? getComputedStyle(canvas) : null;
    const cardStyles = getComputedStyle(
      firstItem.querySelector<HTMLElement>('[data-slot="review-card"]')!,
    );
    const itemWidth = firstItem.getBoundingClientRect().width;
    if (
      rootStyles.marginLeft !== "8px" ||
      rootStyles.marginRight !== "8px" ||
      rootStyles.borderTopWidth !== "0px" ||
      rootStyles.borderBottomWidth !== "0px" ||
      !canvasStyles ||
      canvasStyles.paddingTop !== "8px" ||
      canvasStyles.backgroundColor !== "rgb(245, 245, 245)" ||
      containerStyles.rowGap !== "12px" ||
      itemWidth !== 344 ||
      cardStyles.borderRadius !== "8px" ||
      viewAll !== null ||
      railNavigationStyles.display !== "none" ||
      railStyles.paddingLeft !== "8px" ||
      railStyles.paddingRight !== "8px"
    ) {
      throw new Error(
        "ReviewList mobile must use the shared mobile heading, gray canvas, and 344px cards",
      );
    }
  },
};
