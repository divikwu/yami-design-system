import type { ReviewCardProps, ReviewListProps } from "./ReviewList.types";

const imageSources = {
  foam: new URL(
    "./assets/anua-heartleaf-cleansing-foam.webp",
    import.meta.url,
  ).href,
  toner: new URL("./assets/anua-heartleaf-77-toner.webp", import.meta.url).href,
  serum: new URL("./assets/anua-niacinamide-txa.webp", import.meta.url).href,
} as const;

const reviews: ReviewCardProps[] = [
  {
    id: "vien-cleansing-foam",
    rating: 4.5,
    review: "It feels so gentle and still gets all the gunk out",
    reviewer: "Vien L***",
    product: {
      imageSrc: imageSources.foam,
      imageAlt: "ANUA Heartleaf Quercetinol Pore Deep Cleansing Foam",
      brand: "ANUA",
      name: "Heartleaf Quercetinol Pore Deep Cleansing Foam, 5.07 fl oz",
      href: "/en/products/anua-heartleaf-cleansing-foam",
    },
  },
  {
    id: "the-toner-review",
    rating: 4.5,
    review:
      "I highly recommend it. After using it for a week, my skin is noticeably smoother and smoother. I have sensitive, combination, oily and dry skin and I find this bottle very moisturizing and easy to absorb.",
    reviewer: "The H***",
    product: {
      imageSrc: imageSources.toner,
      imageAlt: "ANUA Heartleaf 77 + Hyaluron Soothing Toner bottle",
      brand: "ANUA",
      name: "Heartleaf 77 + Hyaluron Soothing Toner Vegan, 8.45 fl oz",
      href: "/en/products/anua-heartleaf-77-toner",
    },
  },
  {
    id: "nguyen-dark-spots-review",
    rating: 4.5,
    review:
      "I LOVE IT!!!! It really helped with my dark spots around my underarm!! ❤️❤️❤️❤️",
    reviewer: "Nguyen***",
    product: {
      imageSrc: imageSources.serum,
      imageAlt: "ANUA Niacinamide 10% + TXA 4% serum",
      brand: "ANUA",
      name: "I LOVE IT!!!! It really helped with my dark spots around my underarm!! ❤️❤️❤️❤️",
      href: "/en/products/anua-niacinamide-txa-serum",
    },
  },
];

const copy = {
  zh: {
    title: "用户评论",
    previous: "上一组评论",
    next: "下一组评论",
  },
  en: {
    title: "Customer Reviews",
    previous: "Previous reviews",
    next: "Next reviews",
  },
} as const;

export type ReviewListLocale = keyof typeof copy;

export function createReviewListProps(
  locale: ReviewListLocale = "en",
): ReviewListProps {
  return {
    title: copy[locale].title,
    reviews,
    previousLabel: copy[locale].previous,
    nextLabel: copy[locale].next,
  };
}
