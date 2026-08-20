import type { Meta, StoryObj } from "@storybook/react-vite";
import { userEvent, waitFor } from "storybook/test";

import { ProductReviewSection } from "./ProductReviewSection";
import type {
  ProductReviewItem,
  ProductReviewSectionProps,
} from "./ProductReviewSection.types";

const productPhoto = new URL(
  "../ReviewList/assets/anua-heartleaf-77-toner.webp",
  import.meta.url,
).href;

const reviews: ProductReviewItem[] = [
  {
    id: "k-baby",
    rating: 5,
    reviewer: "K Baby",
    reviewedAt: "Reviewed in US on Dec 8, 2024",
    verifiedPurchase: true,
    currentItem: true,
    variant: "Mask Type: Hyaluronic · Standard Packaging: 10 Sheets",
    body: "Very good",
    showOriginalHref: "#original-k-baby",
    helpfulCount: 2,
  },
  {
    id: "rain",
    rating: 5,
    reviewer: "Rain",
    reviewedAt: "Reviewed in US on Mar 13, 2025",
    verifiedPurchase: true,
    currentItem: true,
    variant: "Mask Type: Hyaluronic · Standard Packaging: 10 Sheets",
    body: "The best facial mask ever! The essence feels light and deeply hydrating.",
    helpfulCount: 1,
  },
  {
    id: "sammi",
    rating: 5,
    reviewer: "SammiG107",
    reviewedAt: "Reviewed in US on Dec 22, 2025",
    verifiedPurchase: true,
    body: "My skin felt noticeably more moisturized after using it.",
    photos: [{ src: productPhoto, alt: "Customer photo of the mask package" }],
    showOriginalHref: "#original-sammi",
  },
  {
    id: "meencantaching",
    rating: 4,
    reviewer: "Meencantaching",
    reviewedAt: "Reviewed in US on Aug 24, 2025",
    verifiedPurchase: true,
    body: "Very good, good hydrating effect!",
  },
  {
    id: "muiimuii",
    rating: 4.5,
    reviewer: "muiimuii",
    reviewedAt: "Reviewed in US on Mar 29, 2025",
    body: "It is really hydrating for dry and sensitive skin.",
    photos: [{ src: productPhoto, alt: "Customer photo showing the sheet mask" }],
  },
  {
    id: "tasha",
    rating: 3,
    reviewer: "tasha",
    reviewedAt: "Reviewed in US on Aug 13, 2022",
    verifiedPurchase: true,
    body: "The mask paper is thicker and very moisturizing.",
  },
  {
    id: "low-rating",
    rating: 2,
    reviewer: "Sample reviewer",
    reviewedAt: "Reviewed in US on Jan 12, 2026",
    body: "The fit was not right for me, though the formula felt gentle.",
  },
];

const baseArgs: ProductReviewSectionProps = {
  title: "Reviews",
  reviewCount: 10,
  averageRating: 4.7,
  ratingDistribution: [
    { stars: 5, percentage: 80, count: 8 },
    { stars: 4, percentage: 10, count: 1 },
    { stars: 3, percentage: 10, count: 1 },
    { stars: 2, percentage: 0, count: 0 },
    { stars: 1, percentage: 0, count: 0 },
  ],
  reviews,
  copy: {
    reviewsLabel: "Reviews",
    writeReview: "Write a review",
    all: "All",
    purchased: "Purchased",
    photos: "Photos",
    sortBy: "Sort by",
    viewMore: "View more",
    verifiedPurchase: "Verified purchase",
    currentItem: "Current item",
    showOriginal: "Show original",
    helpful: "Helpful",
    comments: "Comments",
    noReviews: "No reviews match this filter.",
    stars: "Stars",
    resetFilter: "Show all reviews",
  },
  sortOptions: [
    { value: "default", label: "Default" },
    {
      value: "highest",
      label: "Highest rating",
      compare: (left, right) => right.rating - left.rating,
    },
    {
      value: "lowest",
      label: "Lowest rating",
      compare: (left, right) => left.rating - right.rating,
    },
  ],
  initialVisibleCount: 6,
};

const meta = {
  title: "YAMI/Components/Commerce/Product Review Section",
  component: ProductReviewSection,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "A data-driven PDP review section with rating distribution, review filters, sorting, responsive review cards, and progressive disclosure.",
      },
    },
  },
  args: baseArgs,
} satisfies Meta<typeof ProductReviewSection>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Showcase: Story = {
  play: async ({ canvasElement }) => {
    const root = canvasElement.querySelector<HTMLElement>(
      '[data-slot="product-review-section"]',
    );
    const summary = root?.querySelector('[data-slot="product-review-summary"]');
    const grid = root?.querySelector<HTMLElement>('[data-slot="product-review-grid"]');
    const meters = Array.from(root?.querySelectorAll<HTMLElement>('[role="meter"]') ?? []);
    const filters = root?.querySelectorAll<HTMLButtonElement>("[data-review-filter]");
    const sort = root?.querySelector<HTMLSelectElement>("[data-product-review-sort]");
    const writeReview = root?.querySelector<HTMLButtonElement>(
      '[data-product-review-action="write-review"]',
    );

    if (
      !root ||
      !summary ||
      !grid ||
      !filters ||
      filters.length !== 3 ||
      !sort ||
      !writeReview ||
      root.querySelectorAll('[data-slot="product-review-card"]').length !== 6
    ) {
      throw new Error("ProductReviewSection did not render its complete structure");
    }

    if (
      meters.length !== 5 ||
      meters.map((meter) => meter.dataset.stars).join(",") !== "5,4,3,2,1" ||
      meters.map((meter) => meter.getAttribute("aria-valuenow")).join(",") !==
        "80,10,10,0,0" ||
      !root.getAttribute("aria-labelledby") ||
      writeReview.dataset.slot !== "button"
    ) {
      throw new Error("Review summary semantics or shared Button integration regressed");
    }

    await userEvent.click(filters[1]);
    await waitFor(() => {
      if (
        root.dataset.activeFilter !== "purchased" ||
        root.querySelectorAll('[data-slot="product-review-card"]').length !== 5
      ) {
        throw new Error("Purchased filter did not select verified reviews");
      }
    });

    await userEvent.click(filters[2]);
    await waitFor(() => {
      if (
        root.dataset.activeFilter !== "photos" ||
        root.querySelectorAll('[data-slot="product-review-card"]').length !== 2
      ) {
        throw new Error("Photos filter did not select reviews with media");
      }
    });

    await userEvent.click(filters[0]);
    await userEvent.selectOptions(sort, "lowest");
    await waitFor(() => {
      const firstCard = root.querySelector<HTMLElement>(
        '[data-slot="product-review-card"]',
      );
      if (
        root.dataset.sortValue !== "lowest" ||
        firstCard?.dataset.reviewId !== "low-rating"
      ) {
        throw new Error("Sort control did not apply the selected comparator");
      }
    });

    const viewMore = root.querySelector<HTMLButtonElement>(
      '[data-product-review-action="view-more"]',
    );
    if (!viewMore || viewMore.dataset.slot !== "button") {
      throw new Error("View more must reuse the shared Button component");
    }
    await userEvent.click(viewMore);
    await waitFor(() => {
      if (root.querySelectorAll('[data-slot="product-review-card"]').length !== 7) {
        throw new Error("View more did not reveal the next review page");
      }
    });
  },
};

export const Mobile: Story = {
  globals: { viewport: { value: "yamiMobile", isRotated: false } },
  play: async ({ canvasElement }) => {
    const root = canvasElement.querySelector<HTMLElement>(
      '[data-slot="product-review-section"]',
    );
    const container = root?.querySelector<HTMLElement>(
      '[data-slot="product-review-section-container"]',
    );
    const summary = root?.querySelector<HTMLElement>(
      '[data-slot="product-review-summary"]',
    );
    const grid = root?.querySelector<HTMLElement>('[data-slot="product-review-grid"]');
    const firstCard = grid?.querySelector<HTMLElement>(
      '[data-slot="product-review-card"]',
    );

    if (!root || !container || !summary || !grid || !firstCard) {
      throw new Error("Mobile ProductReviewSection did not render");
    }

    const containerStyle = getComputedStyle(container);
    const summaryColumns = getComputedStyle(summary).gridTemplateColumns.split(" ");
    const gridColumns = getComputedStyle(grid).gridTemplateColumns.split(" ");
    if (
      containerStyle.paddingLeft !== "16px" ||
      containerStyle.paddingRight !== "16px" ||
      summaryColumns.length !== 1 ||
      gridColumns.length !== 1 ||
      Math.abs(firstCard.getBoundingClientRect().width - grid.clientWidth) > 1
    ) {
      throw new Error(
        "Mobile ProductReviewSection must stack its summary and review cards in one column",
      );
    }
  },
};
