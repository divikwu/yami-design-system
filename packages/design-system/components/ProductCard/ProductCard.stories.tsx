import type { CSSProperties } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { ProductCard } from "./ProductCard";
import { ProductCardAddButton } from "./ProductCardAddButton";
import type { ProductCardProps } from "./ProductCard.types";

type ProductLocale = "zh" | "en";

const meta = {
  title: "YAMI/Components/Commerce/ProductCard",
  component: ProductCard,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Figma-backed YAMI desktop product tile. Internal anatomy is split into media, summary, and offer sections while the public API remains ProductCard + ProductCardAddButton.",
      },
    },
  },
  args: {
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
    badges: [{ label: "-16%", type: "discount" }],
  },
} satisfies Meta<typeof ProductCard>;

const productsByLocale: Record<ProductLocale, ProductCardProps> = {
  zh: meta.args,
  en: {
    image:
      "https://cdn.yamibuy.net/item/3ccf61fd74fd43320d647a1b8779a978_757x757.webp",
    imageAlt:
      "Torriden Dive In Low Molecular Hyaluronic Acid Soothing Cream, 3.38 fl oz",
    brand: "Torriden",
    brandHref: "https://www.yami.com/en/b/torriden/9026",
    href: "https://www.yami.com/en/p/low-molecular-hyaluronic-acid-soothing-cream-3-38-fl-oz/1022287761",
    title: "Dive In Low Molecular Hyaluronic Acid Soothing Cream, 3.38 fl oz",
    priceCurrent: "$17.59",
    priceOriginal: "$21.00",
    ranking: "#4 Most in Cart Lotions & Creams",
    rating: 4.9,
    ratingCount: "8",
    soldCount: "200+ Sold",
    badges: [{ label: "-16%", type: "discount" }],
  },
};

function getProduct(locale: unknown) {
  return productsByLocale[locale === "en" ? "en" : "zh"];
}

export default meta;
type Story = StoryObj<typeof meta>;

const gridStyle: CSSProperties = {
  display: "grid",
  gap: "var(--space-300)",
  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 200px))",
  width: "min(920px, 100%)",
  fontFamily: "var(--font-family-ios)",
};

export const Showcase: Story = {
  render: (_args, { globals }) => {
    const product = getProduct(globals.locale);

    return (
      <div style={gridStyle}>
        <ProductCard {...product} onAddToCart={() => {}} />
        <ProductCard {...product} onAddToCart={() => {}} />
        <ProductCard {...product} onAddToCart={() => {}} />
        <ProductCard {...product} onAddToCart={() => {}} />
      </div>
    );
  },
  play: async ({ canvasElement }) => {
    const content = canvasElement.querySelector<HTMLElement>(
      '[data-slot="product-card-content"]',
    );
    if (!content) throw new Error("ProductCard content did not render");
    const contentStyle = getComputedStyle(content);
    if (
      contentStyle.paddingTop !== "8px" ||
      contentStyle.paddingRight !== "8px" ||
      contentStyle.paddingBottom !== "8px" ||
      contentStyle.paddingLeft !== "8px"
    ) {
      throw new Error("Standard ProductCard content padding must be 8px");
    }

    const slots = ["product-card-rating", "product-card-price"];

    for (const slot of slots) {
      const element = canvasElement.querySelector<HTMLElement>(
        `[data-slot="${slot}"]`,
      );
      if (!element)
        throw new Error(`ProductCard ${slot} specimen did not render`);

      const rect = element.getBoundingClientRect();
      const hit = document.elementFromPoint(
        rect.left + Math.min(rect.width / 2, 10),
        rect.top + rect.height / 2,
      );
      if (!hit || hit.closest("a")) {
        throw new Error(`ProductCard ${slot} is covered by a link hit target`);
      }
    }

    canvasElement.dataset.productCardHitTargetContract = "passed";
  },
};

export const Playground: Story = {
  render: (args, { globals }) => {
    const product = getProduct(globals.locale);

    return (
      <div style={{ width: 200 }}>
        <ProductCard {...args} {...product} onAddToCart={() => {}} />
      </div>
    );
  },
};

export const LongContent: Story = {
  render: (_args, { globals }) => {
    const product = getProduct(globals.locale);

    return (
      <div style={{ width: 180 }}>
        <ProductCard {...product} onAddToCart={() => {}} />
      </div>
    );
  },
};

export const AdaptiveSalesLabel: Story = {
  render: (_args, { globals }) => {
    const product = {
      ...getProduct(globals.locale),
      ratingCount: "1,888",
      soldCount: globals.locale === "en" ? "140+ Sold" : "周销 140+",
    };

    return (
      <div style={{ display: "flex", gap: 24, alignItems: "flex-start" }}>
        <div data-slot="wide-product-card" style={{ width: 200 }}>
          <ProductCard {...product} />
        </div>
        <div data-slot="narrow-product-card" style={{ width: 120 }}>
          <ProductCard {...product} />
        </div>
      </div>
    );
  },
  play: async ({ canvasElement }) => {
    const cardParts = (slot: string) => {
      const card = canvasElement.querySelector<HTMLElement>(`[data-slot="${slot}"]`);
      const row = card?.querySelector<HTMLElement>(
        '[data-slot="product-card-rating-sold"]',
      );
      const rating = card?.querySelector<HTMLElement>(
        '[data-slot="product-card-rating"]',
      );
      const sold = card?.querySelector<HTMLElement>(
        '[data-slot="product-card-sold"]',
      );
      if (!row || !rating || !sold) {
        throw new Error(`${slot} sales row did not render`);
      }
      return { row, rating, sold };
    };
    const isVisuallyInside = ({ row, sold }: ReturnType<typeof cardParts>) => {
      const rowRect = row.getBoundingClientRect();
      const soldRect = sold.getBoundingClientRect();
      return soldRect.top < rowRect.bottom && soldRect.bottom > rowRect.top;
    };

    const wide = cardParts("wide-product-card");
    const narrow = cardParts("narrow-product-card");
    if (
      getComputedStyle(wide.row).columnGap !== "2px" ||
      getComputedStyle(wide.rating).columnGap !== "0px"
    ) {
      throw new Error("ProductCard rating gaps must be 2px and 0px");
    }
    if (!isVisuallyInside(wide) || isVisuallyInside(narrow)) {
      throw new Error(
        "ProductCard must show a fitting sales label and hide one that wraps",
      );
    }
  },
};

export const PresentationMatrix: Story = {
  render: (_args, { globals }) => {
    const product = getProduct(globals.locale);

    return (
      <div
        style={{
          display: "grid",
          gap: "var(--space-300)",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          width: "min(960px, 100%)",
        }}
      >
        <ProductCard
          {...product}
          presentation="rich"
          onAddToCart={() => {}}
        />
        <ProductCard
          {...product}
          presentation="minimal"
          onAddToCart={() => {}}
        />
        <ProductCard
          {...product}
          presentation="compact"
          onAddToCart={() => {}}
        />
      </div>
    );
  },
};

export const DisabledAddButton: Story = {
  render: () => <ProductCardAddButton disabled />,
};
