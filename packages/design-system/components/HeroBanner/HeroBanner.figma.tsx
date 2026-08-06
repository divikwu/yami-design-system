/**
 * HeroBanner.figma.tsx — responsive Figma Code Connect bindings.
 */

import { figma } from "@figma/code-connect";

import { HeroBanner } from "./HeroBanner";
import type { HeroBannerItem } from "./HeroBanner.types";

const FIGMA_FILE =
  "https://www.figma.com/design/6oOAy72DBff4P6NzJYc2hi/YAMI-UI-UX-Guidelines";

const items: HeroBannerItem[] = [
  {
    id: "campaign",
    href: "/campaigns/campaign",
    image: {
      src: "/images/campaign.webp",
      alt: "Campaign description",
    },
    title: "Midnight Street Food",
    description: "Explore Asian night bites",
    backgroundColor: "#FFD4B4",
    products: [
      { src: "/images/product-1.webp", alt: "Product one" },
      { src: "/images/product-2.webp", alt: "Product two" },
      { src: "/images/product-3.webp", alt: "Product three" },
    ],
  },
];

const example = () => (
  <HeroBanner
    items={items}
    ariaLabel="Featured promotions"
    previousLabel="Previous promotions"
    nextLabel="Next promotions"
  />
);

figma.connect(HeroBanner, `${FIGMA_FILE}?node-id=3053-7724`, {
  props: {},
  example,
});

figma.connect(HeroBanner, `${FIGMA_FILE}?node-id=3056-37111`, {
  props: {},
  example,
});
