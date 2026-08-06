import { HeroBanner } from "./HeroBanner";
import type { HeroBannerItem } from "./HeroBanner.types";

const promotions: HeroBannerItem[] = [
  {
    id: "street-food",
    href: "/campaigns/street-food",
    image: {
      src: "/images/campaigns/street-food.webp",
      alt: "Asian street food and drinks",
    },
    title: "Midnight Street Food",
    description: "Explore Asian night bites",
    backgroundColor: "#FFD4B4",
    products: [
      { src: "/images/products/tea.webp", alt: "Bottled green tea" },
      { src: "/images/products/snack.webp", alt: "Spicy snack" },
      { src: "/images/products/chips.webp", alt: "Corn chips" },
    ],
  },
];

export function ResponsiveHeroBanner() {
  return (
    <HeroBanner
      items={promotions}
      ariaLabel="Featured promotions"
      previousLabel="Previous promotions"
      nextLabel="Next promotions"
    />
  );
}
