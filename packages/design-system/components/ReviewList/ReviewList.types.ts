import type { HTMLAttributes, ReactNode } from "react";

import type { SectionDividerProps } from "../sectionDivider.types";

export type ReviewListMobileSurface = "card" | "plain";

export interface ReviewProduct {
  /** Product image shown in the review footer. */
  imageSrc: string;
  /** Accessible description of the product image. */
  imageAlt: string;
  /** Product brand shown above the product name. */
  brand: ReactNode;
  /** Product name shown in the footer. */
  name: ReactNode;
  /** Optional destination for the product footer. */
  href?: string;
}

export interface ReviewCardProps
  extends Omit<HTMLAttributes<HTMLElement>, "children" | "id"> {
  /** Stable identity for React and analytics hooks. */
  id: string;
  /** Five-point rating. Fractional values render a half star. */
  rating: number;
  /** Review copy from the customer. */
  review: ReactNode;
  /** Anonymized reviewer name. */
  reviewer: ReactNode;
  /** Product associated with the review. */
  product: ReviewProduct;
}

export interface ReviewListProps
  extends Omit<HTMLAttributes<HTMLElement>, "children" | "title">,
    SectionDividerProps {
  /** Visible section heading and accessible label. */
  title: ReactNode;
  /** Optional mobile-only heading; falls back to title. */
  mobileTitle?: ReactNode;
  /** Ordered review cards shown in the horizontal rail. */
  reviews: ReviewCardProps[];
  /** Mobile section surface. Plain is full-bleed with 16px content padding and supports section dividers. */
  mobileSurface?: ReviewListMobileSurface;
  /** Optional destination for the shared desktop/mobile view-all action. */
  viewAllHref?: string;
  /** Localized view-all label. */
  viewAllLabel?: ReactNode;
  /** Localized accessible label for the previous-page control. */
  previousLabel?: string;
  /** Localized accessible label for the next-page control. */
  nextLabel?: string;
}
