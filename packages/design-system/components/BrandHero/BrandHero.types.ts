import type {
  HTMLAttributes,
  ImgHTMLAttributes,
  MouseEventHandler,
  ReactNode,
} from "react";

export interface BrandHeroImage {
  /** Image source for both the primary artwork and, by default, the atmosphere. */
  src: string;
  /** Meaningful description of the foreground brand artwork. */
  alt: string;
  /** Intrinsic width used to reserve the foreground image ratio. */
  width: number;
  /** Intrinsic height used to reserve the foreground image ratio. */
  height: number;
}

export interface BrandHeroCta {
  label: string;
  ariaLabel?: string;
  onClick?: MouseEventHandler<HTMLButtonElement>;
  disabled?: boolean;
}

export interface BrandHeroProps
  extends Omit<HTMLAttributes<HTMLElement>, "children" | "title"> {
  title: ReactNode;
  description: ReactNode;
  image: BrandHeroImage;
  /** Optional alternate source for the blurred decorative atmosphere. */
  backgroundImageSrc?: string;
  cta?: BrandHeroCta;
  imageLoading?: ImgHTMLAttributes<HTMLImageElement>["loading"];
}
