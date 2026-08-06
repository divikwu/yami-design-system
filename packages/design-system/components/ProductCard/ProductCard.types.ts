import type { ImgHTMLAttributes, MouseEventHandler, ReactNode } from "react";

import type { BadgeColor, BadgeEmphasis, BadgeType } from "../Badge";

export type ProductBadgeType = Exclude<BadgeType, "best-sellers" | "price">;

export interface ProductBadge {
  label: ReactNode;
  color?: BadgeColor;
  emphasis?: BadgeEmphasis;
  type: ProductBadgeType;
}

export interface ProductCardPromotion {
  badge: ReactNode;
  label?: ReactNode;
  value: ReactNode;
  tone?: "default" | "emphasis";
}

export type ProductCardPresentation = "rich" | "minimal" | "compact";

interface ProductCardBaseProps {
  /** Visual anatomy. rich preserves the full card, minimal is media-only, compact is a horizontal list row. */
  presentation?: ProductCardPresentation;
  /** Product title. Clamped to 2 lines with ellipsis. */
  title: ReactNode;
  /** Current selling price. Uses emphasis color only when priceOriginal is present. */
  priceCurrent: ReactNode;
  /** Original price for strike-through. Omit when no discount. */
  priceOriginal?: ReactNode;
  /** Unit or bundle price, including pack information when relevant. */
  unitPrice?: ReactNode;
  /** Ranking label such as “#1 Most in Cart Masks”. */
  ranking?: ReactNode;
  /** Star rating (0-5). Omit to hide rating metadata. */
  rating?: number;
  /** Rating count (e.g. "1,888"). */
  ratingCount?: ReactNode;
  /** Sold count shown after rating metadata. */
  soldCount?: ReactNode;
  /** Campaign and loyalty promotion rows below pricing. */
  promotions?: ProductCardPromotion[];
  /** Countdown copy such as “Ends in 2d 16:28:09”. */
  countdown?: ReactNode;
  /** Product-image badges. Limited to sale, low-price, discount, new, hot, exclusive, and choice; max 2 are rendered. */
  badges?: ProductBadge[];
  /** Callback for quick add. Compact rows place the action beside price; other presentations overlay media. */
  onAddToCart?: MouseEventHandler<HTMLButtonElement>;
  /** Accessible name for the quick-add action. */
  addButtonAriaLabel?: string;
  /** Product destination used by the title link. */
  href: string;
}

type ProductCardImageProps =
  | {
      /** Product image URL. */
      image: string;
      /** Accessible product image description. Required whenever image is provided. */
      imageAlt: string;
      /** Native image loading strategy. Defaults to lazy; use eager for above-fold cards. */
      imageLoading?: ImgHTMLAttributes<HTMLImageElement>["loading"];
      /** Native fetch priority. Use high only for an above-fold LCP candidate. */
      imageFetchPriority?: ImgHTMLAttributes<HTMLImageElement>["fetchPriority"];
    }
  | {
      /** Omit image to render the neutral placeholder. */
      image?: undefined;
      imageAlt?: never;
      imageLoading?: never;
      imageFetchPriority?: never;
    };

type ProductCardBrandProps =
  | {
      /** Brand name above the title. */
      brand: ReactNode;
      /** Brand destination used by the trailing-arrow link. */
      brandHref: string;
    }
  | {
      brand?: undefined;
      brandHref?: never;
    };

export type ProductCardProps = ProductCardBaseProps &
  ProductCardImageProps &
  ProductCardBrandProps;
