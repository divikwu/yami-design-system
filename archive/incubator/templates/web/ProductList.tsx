/**
 * ProductList — web template referenced by product-list.recipe.ts.
 *
 * Takes the recipe's dataSchema shape as props and renders the page.
 * compose_page (Phase 7) uses this as a generation reference: given
 * user data, produce JSX structurally equivalent to what's here.
 */

import { Button, Input, ProductCard } from "../../../components";
import type { ProductBadge } from "../../../components/ProductCard";

interface ProductListProductBase {
  id: string;
  href: string;
  image?: string;
  imageAlt?: string;
  title: string;
  priceCurrent: string;
  priceOriginal?: string;
  rating?: number;
  ratingCount?: string;
  badges?: ProductBadge[];
}

export type ProductListProduct = ProductListProductBase &
  (
    | { brand: string; brandHref: string }
    | { brand?: undefined; brandHref?: never }
  );

export interface ProductListCategory {
  id: string;
  label: string;
}

export interface ProductListProps {
  heading: string;
  showSearch?: boolean;
  categories?: ProductListCategory[];
  activeCategory?: string;
  sortLabel?: string;
  products: ProductListProduct[];
  hasMore?: boolean;
  onSearch?: (query: string) => void;
  onSelectCategory?: (id: string) => void;
  onLoadMore?: () => void;
  onSort?: () => void;
  onAddToCart?: (productId: string) => void;
}

export function ProductListTemplate({
  heading,
  showSearch = false,
  categories,
  activeCategory,
  sortLabel = "Popular",
  products,
  hasMore = false,
  onSearch,
  onSelectCategory,
  onLoadMore,
  onSort,
  onAddToCart,
}: ProductListProps) {
  return (
    <main
      style={{
        paddingInline: "var(--layout-page-margin-default)",
        paddingBlock: "var(--space-400)",
        display: "flex",
        flexDirection: "column",
        gap: "var(--space-300)",
        maxWidth: 1440,
        marginInline: "auto",
      }}
    >
      {/* Page heading */}
      <h1
        style={{
          margin: 0,
          fontFamily: "var(--font-family-ios)",
          fontWeight: "var(--font-weight-emphasize)",
          fontSize: "var(--font-size-heading-xl)",
          lineHeight: "var(--line-height-heading-xl)",
        }}
      >
        {heading}
      </h1>

      {/* Search input */}
      {showSearch && (
        <Input
          type="search"
          aria-label="Search"
          placeholder="Search YAMI · 搜索"
          fullWidth
          onChange={(e) => onSearch?.(e.currentTarget.value)}
        />
      )}

      {/* Category filters.
          paddingBlock --space-100 (8px) is intentional, not a guess: the
          inner sm Buttons carry a 44px-tall ::before tap-area extender
          (Phase 12f-3) that overflows the 32px visual button by 6px each
          side. overflowX:auto effectively clips overflow on both axes, so
          without ≥6px vertical padding the ::before gets cut off and the
          buttons fail tap-target. 8px pads with 2px headroom. */}
      {categories && categories.length > 0 && (
        <div
          style={{
            display: "flex",
            gap: "var(--space-100)",
            overflowX: "auto",
            paddingBlock: "var(--space-100)",
          }}
        >
          {categories.map((c) => (
            <Button
              key={c.id}
              variant={c.id === activeCategory ? "primary" : "secondary"}
              size="sm"
              onClick={() => onSelectCategory?.(c.id)}
            >
              {c.label}
            </Button>
          ))}
        </div>
      )}

      {/* Sort row */}
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <Button variant="tertiary" size="sm" onClick={onSort}>
          Sort: {sortLabel}
        </Button>
      </div>

      {/* Product grid — responsive columns via CSS grid auto-fill */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
          gap: "var(--space-300)",
        }}
      >
        {products.map((p) => (
          <ProductCard
            key={p.id}
            href={p.href}
            {...(p.image
              ? { image: p.image, imageAlt: p.imageAlt ?? p.title }
              : {})}
            {...(p.brand ? { brand: p.brand, brandHref: p.brandHref } : {})}
            title={p.title}
            priceCurrent={p.priceCurrent}
            priceOriginal={p.priceOriginal}
            rating={p.rating}
            ratingCount={p.ratingCount}
            badges={p.badges}
            onAddToCart={() => onAddToCart?.(p.id)}
          />
        ))}
      </div>

      {/* Load more */}
      {hasMore && (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            marginTop: "var(--space-200)",
          }}
        >
          <Button variant="primary" size="lg" onClick={onLoadMore}>
            Load More · 加载更多
          </Button>
        </div>
      )}
    </main>
  );
}
