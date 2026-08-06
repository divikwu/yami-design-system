/**
 * ProductCard — canonical examples.
 */

import { ProductCard } from "./ProductCard";

const product = {
  image:
    "https://cdn.yamibuy.net/item/3ccf61fd74fd43320d647a1b8779a978_757x757.webp",
  imageAlt:
    "韩国TORRIDEN桃瑞丹 低分子玻尿酸啫喱面霜 爆水炸弹 冰淇淋面霜 焕发水润 100ml 补水舒缓保湿 强劲锁水〖23化解面霜NO.3〗",
  brand: "Torriden",
  brandHref: "https://www.yami.com/zh/b/torriden/9026",
  href: "https://www.yami.com/zh/p/low-molecular-hyaluronic-acid-soothing-cream-3-38-fl-oz/1022287761",
  title:
    "韩国TORRIDEN桃瑞丹 低分子玻尿酸啫喱面霜 爆水炸弹 冰淇淋面霜 焕发水润 100ml 补水舒缓保湿 强劲锁水〖23化解面霜NO.3〗",
  priceCurrent: "$17.59",
  priceOriginal: "$21.00",
  ranking: "乳液 面霜 加购榜 No.4",
  rating: 4.9,
  ratingCount: "8",
  soldCount: "周销 200+",
  badges: [{ label: "-16%", type: "discount" as const }],
};

export const BasicProductCard = () => (
  <section data-example="BasicProductCard">
    <div style={{ width: 200 }}>
      <ProductCard {...product} onAddToCart={() => {}} />
    </div>
  </section>
);

export const SaleProductCard = () => (
  <section data-example="SaleProductCard">
    <div style={{ width: 200 }}>
      <ProductCard {...product} onAddToCart={() => {}} />
    </div>
  </section>
);

export const MultiBadgeProductCard = () => (
  <section data-example="MultiBadgeProductCard">
    <div style={{ width: 200 }}>
      <ProductCard {...product} onAddToCart={() => {}} />
    </div>
  </section>
);

export const NoImageProductCard = () => (
  <section data-example="NoImageProductCard">
    <div style={{ width: 200 }}>
      <ProductCard
        brand={product.brand}
        brandHref={product.brandHref}
        href={product.href}
        title={product.title}
        priceCurrent={product.priceCurrent}
        priceOriginal={product.priceOriginal}
        ranking={product.ranking}
        rating={product.rating}
        ratingCount={product.ratingCount}
        soldCount={product.soldCount}
        badges={product.badges}
        onAddToCart={() => {}}
      />
    </div>
  </section>
);

export const NoRatingProductCard = () => (
  <section data-example="NoRatingProductCard">
    <div style={{ width: 200 }}>
      <ProductCard
        image={product.image}
        imageAlt={product.imageAlt}
        brand={product.brand}
        brandHref={product.brandHref}
        href={product.href}
        title={product.title}
        priceCurrent={product.priceCurrent}
        priceOriginal={product.priceOriginal}
        ranking={product.ranking}
        soldCount={product.soldCount}
        badges={product.badges}
        onAddToCart={() => {}}
      />
    </div>
  </section>
);

export const LinkProductCard = () => (
  <section data-example="LinkProductCard">
    <div style={{ width: 200 }}>
      <ProductCard {...product} onAddToCart={() => {}} />
    </div>
  </section>
);

export const GridOfProductCardsExample = () => (
  <section data-example="GridOfProductCardsExample">
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(2, 1fr)",
        gap: "var(--space-200)",
        maxWidth: 440,
      }}
    >
      <ProductCard {...product} onAddToCart={() => {}} />
      <ProductCard {...product} onAddToCart={() => {}} />
      <ProductCard {...product} onAddToCart={() => {}} />
      <ProductCard {...product} onAddToCart={() => {}} />
    </div>
  </section>
);
