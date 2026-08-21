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

function assertReviewGrid(
  grid: HTMLElement,
  columnCount: number,
  rowCount: number,
) {
  const cards = Array.from(
    grid.querySelectorAll<HTMLElement>('[data-slot="product-review-card"]'),
  );
  const gridStyle = getComputedStyle(grid);
  const columns = gridStyle.gridTemplateColumns.split(" ");
  const rows = new Set(
    cards.map((card) => Math.round(card.getBoundingClientRect().top)),
  );

  if (
    !cards.length ||
    columns.length !== columnCount ||
    rows.size !== rowCount ||
    gridStyle.overflowX !== "visible" ||
    grid.scrollWidth > grid.clientWidth + 1
  ) {
    throw new Error(
      `Review cards must wrap into a ${columnCount}-column, ${rowCount}-row grid without horizontal scrolling`,
    );
  }
}

export const Showcase: Story = {
  play: async ({ canvasElement }) => {
    const root = canvasElement.querySelector<HTMLElement>(
      '[data-slot="product-review-section"]',
    );
    const container = root?.querySelector<HTMLElement>(
      '[data-slot="product-review-section-container"]',
    );
    const summary = root?.querySelector('[data-slot="product-review-summary"]');
    const summaryStars = summary?.querySelectorAll<HTMLElement>(
      '[role="img"] [data-star-state]',
    );
    const grid = root?.querySelector<HTMLElement>('[data-slot="product-review-grid"]');
    const meters = Array.from(root?.querySelectorAll<HTMLElement>('[role="meter"]') ?? []);
    const filters = root?.querySelectorAll<HTMLButtonElement>("[data-review-filter]");
    const sort = root?.querySelector<HTMLElement>("[data-product-review-sort]");
    const sortTrigger = sort?.querySelector<HTMLButtonElement>(
      '[data-slot="filter-chip"]',
    );
    const writeReview = root?.querySelector<HTMLButtonElement>(
      '[data-product-review-action="write-review"]',
    );
    const firstReview = root?.querySelector<HTMLElement>('[data-review-id="k-baby"]');
    const originalLink = firstReview?.querySelector<HTMLAnchorElement>(
      'a[href="#original-k-baby"]',
    );
    const translateIcon = firstReview?.querySelector<HTMLElement>(
      '[data-product-review-icon="translate"]',
    );
    const helpfulFeedback = firstReview?.querySelector<HTMLElement>(
      '[data-product-review-feedback="helpful"]',
    );
    const likeIcon = helpfulFeedback?.querySelector<HTMLElement>(
      '[data-product-review-icon="like"]',
    );
    const commentsFeedback = firstReview?.querySelector<HTMLElement>(
      '[data-product-review-feedback="comments"]',
    );
    const commentIcon = commentsFeedback?.querySelector<HTMLElement>(
      '[data-product-review-icon="comment"]',
    );
    const reviewerIdentity = firstReview?.querySelector<HTMLElement>("header > div");
    const reviewerLine = reviewerIdentity?.querySelector<HTMLElement>(":scope > div");
    const reviewMeta = reviewerIdentity?.querySelector<HTMLElement>(":scope > p");

    if (
      !root ||
      !container ||
      !summary ||
      !summaryStars ||
      summaryStars.length !== 5 ||
      Array.from(summaryStars).some(
        (star) =>
          getComputedStyle(star).width !== "20px" ||
          getComputedStyle(star).height !== "20px",
      ) ||
      !grid ||
      !filters ||
      filters.length !== 3 ||
      !sortTrigger ||
      !writeReview ||
      root.querySelectorAll('[data-slot="product-review-card"]').length !== 6
    ) {
      throw new Error("ProductReviewSection did not render its complete structure");
    }

    const containerStyle = getComputedStyle(container);
    if (
      containerStyle.paddingTop !== "32px" ||
      containerStyle.paddingRight !== "48px" ||
      containerStyle.paddingBottom !== "32px" ||
      containerStyle.paddingLeft !== "48px"
    ) {
      throw new Error("Desktop review container spacing regressed");
    }
    assertReviewGrid(grid, 3, 2);

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

    const reviewIcons = [
      [translateIcon, "translate"],
      [likeIcon, "like"],
      [commentIcon, "comment"],
    ] as const;
    if (
      !firstReview ||
      !originalLink ||
      originalLink.textContent?.trim() !== "Show original" ||
      helpfulFeedback?.textContent?.trim() !== "2" ||
      helpfulFeedback.getAttribute("aria-label") !== "Helpful: 2" ||
      getComputedStyle(helpfulFeedback.parentElement!).columnGap !== "16px" ||
      commentsFeedback?.textContent?.trim() !== "0" ||
      commentsFeedback.getAttribute("aria-label") !== "Comments: 0" ||
      reviewIcons.some(([icon, name]) => {
        if (!icon || icon.getAttribute("aria-hidden") !== "true") return true;
        const style = getComputedStyle(icon);
        return (
          icon.dataset.productReviewIcon !== name ||
          style.width !== "16px" ||
          style.height !== "16px" ||
          !style.maskImage.startsWith("url(")
        );
      })
    ) {
      throw new Error("Review-card feedback icons or accessible labels regressed");
    }

    if (!reviewerIdentity || !reviewerLine || !reviewMeta) {
      throw new Error("Review-card identity did not render");
    }
    const reviewerLineStyle = getComputedStyle(reviewerLine);
    const reviewMetaStyle = getComputedStyle(reviewMeta);
    const reviewerIdentityWidth = reviewerIdentity.getBoundingClientRect().width;
    if (
      reviewerLineStyle.whiteSpace !== "nowrap" ||
      reviewerLineStyle.overflowX !== "hidden" ||
      reviewMetaStyle.whiteSpace !== "nowrap" ||
      reviewMetaStyle.overflowX !== "hidden" ||
      reviewMetaStyle.textOverflow !== "ellipsis" ||
      Math.abs(reviewerLine.getBoundingClientRect().width - reviewerIdentityWidth) > 1 ||
      Math.abs(reviewMeta.getBoundingClientRect().width - reviewerIdentityWidth) > 1
    ) {
      throw new Error("Review-card identity rows must fill the width and stay single-line");
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
    await userEvent.click(sortTrigger);
    const sortOptions = await waitFor(() => {
      const options = Array.from(
        canvasElement.ownerDocument.querySelectorAll<HTMLLabelElement>(
          '[data-filter-chip-menu-options="true"] label',
        ),
      );
      if (!options.length) {
        throw new Error("Sort menu did not open");
      }
      return options;
    });
    const lowestRating = sortOptions.find((option) =>
      option.textContent?.includes("Lowest rating"),
    );
    if (!lowestRating) {
      throw new Error("Lowest rating option did not render");
    }
    await userEvent.click(lowestRating);
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
    const viewMoreStyle = viewMore ? getComputedStyle(viewMore) : null;
    if (
      !viewMore ||
      viewMore.dataset.slot !== "button" ||
      viewMoreStyle?.textDecorationLine !== "underline" ||
      viewMoreStyle.backgroundColor !== "rgba(0, 0, 0, 0)"
    ) {
      throw new Error(
        "View more must reuse the shared Button component with an underlined treatment",
      );
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
  args: {
    title: "Customer Reviews",
    copy: {
      ...baseArgs.copy,
      referenceNotice:
        "Some reviews are from other options and are shown for reference.",
      viewMore: "View All Reviews",
    },
  },
  globals: { viewport: { value: "yamiMobile", isRotated: false } },
  play: async ({ canvasElement }) => {
    const viewportWidth = canvasElement.ownerDocument.defaultView?.innerWidth;
    const root = canvasElement.querySelector<HTMLElement>(
      '[data-slot="product-review-section"]',
    );
    const container = root?.querySelector<HTMLElement>(
      '[data-slot="product-review-section-container"]',
    );
    const summary = root?.querySelector<HTMLElement>(
      '[data-slot="product-review-summary"]',
    );
    const summaryContent = root?.querySelector<HTMLElement>(
      '[data-slot="product-review-summary-content"]',
    );
    const score = root?.querySelector<HTMLElement>(
      '[data-slot="product-review-score-summary"]',
    )?.parentElement;
    const distribution = root?.querySelector<HTMLElement>(
      '[data-slot="product-review-distribution"]',
    );
    const notice = root?.querySelector<HTMLElement>(
      '[data-slot="product-review-reference-notice"]',
    );
    const toolbar = root?.querySelector<HTMLElement>(
      '[data-slot="product-review-toolbar"]',
    );
    const heading = root?.querySelector<HTMLElement>("h2");
    const headingCount = heading?.querySelector<HTMLElement>("span");
    const writeReview = root?.querySelector<HTMLElement>(
      '[data-product-review-action="write-review"]',
    );
    const grid = root?.querySelector<HTMLElement>('[data-slot="product-review-grid"]');
    const cards = Array.from(
      grid?.querySelectorAll<HTMLElement>('[data-slot="product-review-card"]') ?? [],
    );
    const firstCard = cards[0];
    const viewMore = root?.querySelector<HTMLElement>(
      '[data-product-review-action="view-more"]',
    );

    if (
      !viewportWidth ||
      !root ||
      !container ||
      !summary ||
      !summaryContent ||
      !score ||
      !distribution ||
      !notice ||
      !toolbar ||
      !heading ||
      !headingCount ||
      !writeReview ||
      !grid ||
      !firstCard ||
      !viewMore
    ) {
      throw new Error("Mobile ProductReviewSection did not render");
    }

    const containerStyle = getComputedStyle(container);
    const summaryStyle = getComputedStyle(summary);
    const gridStyle = getComputedStyle(grid);
    const cardRows = new Set(
      cards.map((card) => Math.round(card.getBoundingClientRect().top)),
    );
    if (
      Math.abs(container.getBoundingClientRect().width - (viewportWidth - 16)) > 1 ||
      containerStyle.marginLeft !== "8px" ||
      containerStyle.marginRight !== "8px" ||
      containerStyle.paddingLeft !== "16px" ||
      containerStyle.paddingRight !== "16px" ||
      containerStyle.backgroundColor !== "rgb(255, 255, 255)" ||
      containerStyle.borderRadius !== "12px" ||
      !heading.textContent?.includes("Customer Reviews") ||
      getComputedStyle(headingCount).display !== "none" ||
      summaryStyle.padding !== "0px" ||
      summaryStyle.backgroundColor !== "rgba(0, 0, 0, 0)" ||
      getComputedStyle(summaryContent).gridTemplateColumns.split(" ").length !== 1 ||
      getComputedStyle(score).flexDirection !== "row" ||
      getComputedStyle(writeReview).marginTop !== "0px" ||
      getComputedStyle(distribution).display !== "none" ||
      getComputedStyle(toolbar).display !== "none" ||
      getComputedStyle(notice).display !== "block" ||
      !notice.textContent?.includes("other options") ||
      cards.length !== 6 ||
      cardRows.size !== 1 ||
      gridStyle.gridAutoFlow !== "column" ||
      gridStyle.overflowX !== "auto" ||
      grid.scrollWidth <= grid.clientWidth ||
      Math.abs(firstCard.getBoundingClientRect().width - (grid.clientWidth - 40)) > 1 ||
      cards.some((card) => Math.round(card.getBoundingClientRect().height) !== 200) ||
      getComputedStyle(firstCard).backgroundColor !== "rgb(245, 245, 245)" ||
      viewMore.textContent?.trim() !== "View All Reviews" ||
      Math.abs(
        viewMore.getBoundingClientRect().width -
          (viewMore.parentElement?.clientWidth ?? 0)
      ) > 1 ||
      getComputedStyle(viewMore).textDecorationLine !== "none" ||
      getComputedStyle(viewMore).backgroundColor !== "rgb(245, 245, 245)" ||
      document.documentElement.scrollWidth > document.documentElement.clientWidth
    ) {
      throw new Error(
        "Mobile ProductReviewSection must render a compact summary, reference notice, review rail, and full-width review action inside one white card",
      );
    }
  },
};

export const Tablet: Story = {
  globals: { viewport: { value: "yamiTablet", isRotated: false } },
  play: async ({ canvasElement }) => {
    const grid = canvasElement.querySelector<HTMLElement>(
      '[data-slot="product-review-grid"]',
    );
    if (!grid) throw new Error("Tablet review grid did not render");
    assertReviewGrid(grid, 2, 3);
  },
};

export const DesktopXl: Story = {
  globals: { viewport: { value: "yamiDesktopXl", isRotated: false } },
  play: async ({ canvasElement }) => {
    const grid = canvasElement.querySelector<HTMLElement>(
      '[data-slot="product-review-grid"]',
    );
    if (!grid) throw new Error("Desktop-xl review grid did not render");
    assertReviewGrid(grid, 4, 2);
  },
};
