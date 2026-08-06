/**
 * ProductCard.figma.tsx — Figma Code Connect binding (Phase 10).
 *
 * Composite component — binds to the Figma ProductCard master. Instance
 * props come from Figma's "Instance swap" + text-layer overrides.
 */

import { figma } from "@figma/code-connect";

import { ProductCard } from "./ProductCard";
import { ProductCardAddButton } from "./ProductCardAddButton";

figma.connect(
  ProductCardAddButton,
  "https://www.figma.com/design/6oOAy72DBff4P6NzJYc2hi/YAMI-UI-UX-Guidelines?node-id=2410-30647",
  {
    example: () => <ProductCardAddButton aria-label="Add to cart" />,
  },
);

figma.connect(
  ProductCard,
  "https://www.figma.com/design/6oOAy72DBff4P6NzJYc2hi/YAMI-UI-UX-Guidelines?node-id=2443-16213",
  {
    props: {
      image: figma.string("Image URL"),
      imageAlt: figma.string("Image alt"),
      brand: figma.string("Brand"),
      title: figma.string("Title"),
      priceCurrent: figma.string("Price current"),
      priceOriginal: figma.string("Price original"),
      rating: figma.string("Rating"),
      ratingCount: figma.string("Rating count"),
    },
    example: ({
      image,
      imageAlt,
      brand,
      title,
      priceCurrent,
      priceOriginal,
      rating,
      ratingCount,
    }) => (
      <ProductCard
        href="/product"
        image={image}
        imageAlt={imageAlt}
        brand={brand}
        brandHref="/brands"
        title={title}
        priceCurrent={priceCurrent}
        priceOriginal={priceOriginal}
        rating={rating ? Number(rating) : undefined}
        ratingCount={ratingCount}
        onAddToCart={() => {
          /* wire to real cart action */
        }}
      />
    ),
  },
);
