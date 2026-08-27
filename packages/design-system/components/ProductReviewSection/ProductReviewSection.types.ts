import type { HTMLAttributes, ReactNode } from "react";

export type ProductReviewFilter = "all" | "purchased" | "photos";

export interface ProductReviewRatingDistribution {
  stars: 1 | 2 | 3 | 4 | 5;
  percentage: number;
  count?: number;
}

export interface ProductReviewPhoto {
  src: string;
  alt: string;
}

export interface ProductReviewAvatar {
  src: string;
  alt: string;
}

export interface ProductReviewItem {
  id: string;
  rating: number;
  body: ReactNode;
  reviewer: ReactNode;
  title?: ReactNode;
  avatar?: ProductReviewAvatar;
  reviewedAt?: ReactNode;
  locale?: ReactNode;
  verifiedPurchase?: boolean;
  variant?: ReactNode;
  currentItem?: boolean;
  showOriginalHref?: string;
  helpfulCount?: number;
  commentCount?: number;
  photos?: readonly ProductReviewPhoto[];
}

export interface ProductReviewSortOption {
  value: string;
  label: ReactNode;
  /** Optional local comparator. Omit when the caller already supplies sorted data. */
  compare?: (left: ProductReviewItem, right: ProductReviewItem) => number;
}

export interface ProductReviewSectionCopy {
  reviewsLabel: ReactNode;
  referenceNotice?: ReactNode;
  writeReview: ReactNode;
  all: ReactNode;
  purchased: ReactNode;
  photos: ReactNode;
  reviewPhotos?: ReactNode;
  sortBy: string;
  viewMore: ReactNode;
  verifiedPurchase: ReactNode;
  currentItem: ReactNode;
  showOriginal: ReactNode;
  helpful: string;
  comments: string;
  noReviews: ReactNode;
  stars?: string;
  resetFilter?: ReactNode;
}

export interface ProductReviewSectionProps
  extends Omit<HTMLAttributes<HTMLElement>, "children" | "title"> {
  title: ReactNode;
  /** Below 1024px: 20px normal (default); 16px Chinese 600 / English 500 via lang. */
  mobileTitleSize?: 16 | 20;
  reviewCount: number;
  averageRating: number;
  ratingDistribution: readonly ProductReviewRatingDistribution[];
  reviews: readonly ProductReviewItem[];
  copy: ProductReviewSectionCopy;
  sortOptions: readonly ProductReviewSortOption[];
  filter?: ProductReviewFilter;
  defaultFilter?: ProductReviewFilter;
  onFilterChange?: (filter: ProductReviewFilter) => void;
  sortValue?: string;
  defaultSortValue?: string;
  onSortChange?: (value: string) => void;
  initialVisibleCount?: number;
  viewMoreIncrement?: number;
  onWriteReview?: () => void;
}
