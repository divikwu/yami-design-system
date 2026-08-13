import type { HTMLAttributes, ReactNode } from "react";
import type { ImageLoadingStrategy, ImageSource } from "../image.types";

export interface SocialVideoProduct {
  /** Stable identity for React and analytics hooks. */
  id: string;
  /** Square product image shown in the card footer. */
  imageSrc: ImageSource;
  /** Product image alternative text. */
  imageAlt: string;
  /** Optional title shown by the single-product treatment. */
  title?: ReactNode;
  /** Optional product destination. */
  href?: string;
}

export interface SocialVideoCardProps
  extends Omit<HTMLAttributes<HTMLElement>, "children" | "id"> {
  /** Stable identity for React and analytics hooks. */
  id: string;
  /** Poster image used for the social video surface. */
  posterSrc: ImageSource;
  /** Accessible description of the poster frame. */
  posterAlt: string;
  /** Social account name. */
  username: ReactNode;
  /** Decorative social platform mark used beside the creator handle. */
  platformIconSrc: ImageSource;
  /** Text shown in the footer when no product images are supplied. */
  caption: ReactNode;
  /** Optional destination for the video media. */
  href?: string;
  /** Optional product data shown below the media. */
  products?: SocialVideoProduct[];
  /** Product count not present in products; combined with supplied products beyond the first three. */
  additionalProductCount?: number;
}

export interface SocialMediaGalleryProps
  extends Omit<HTMLAttributes<HTMLElement>, "children" | "title"> {
  /** Desktop section heading. */
  title: ReactNode;
  /** Optional mobile heading; falls back to title. */
  mobileTitle?: ReactNode;
  /** Ordered social video cards. */
  cards: SocialVideoCardProps[];
  /** Optional destination for the desktop view-all action. */
  viewAllHref?: string;
  /** Localized view-all label. */
  viewAllLabel?: ReactNode;
  /** Localized label for the previous-page control. */
  previousLabel?: string;
  /** Localized label for the next-page control. */
  nextLabel?: string;
  imageLoadingStrategy?: ImageLoadingStrategy;
}
