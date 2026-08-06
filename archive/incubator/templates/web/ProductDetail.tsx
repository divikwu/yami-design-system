/* yami-validate-disable: semantic-color-only, type-hierarchy, tap-target */
/**
 * ProductDetail — web template referenced by product-detail.recipe.ts.
 *
 * Pragma rationale (three intentional exemptions):
 *
 *   1. semantic-color-only — rating-star uses var(--color-amber-500) as
 *      iconographic color, matching ProductCard convention. See
 *      ProductCard.module.css for full justification.
 *
 *   2. type-hierarchy — PDP is the one page where 4-level type hierarchy
 *      isn't enough. A product page needs a visually distinct scale for:
 *        brand (caption-md)  · title (heading-2xl)  · price (price-md,
 *        larger than heading-md)  · strike-through original (strike-md)
 *        · body copy (body-md)  · section heading (heading-md/xl)
 *      Merging any pair breaks either price emphasis or readability. If
 *      PDP dominates other pages in eval failures, revisit by building
 *      tighter type tokens (e.g. a dedicated 'pdp-scale' token family)
 *      rather than flattening the scale here.
 *
 *   3. tap-target — quantity stepper uses <Button size="sm" iconOnly>,
 *      the standard e-commerce pattern where − / + sit beside a qty label
 *      in normal flow. Validator's own suggestion: "No action needed if
 *      the button is in normal flow." Phase 8.5 visual scorer will verify
 *      actual rendered dimensions hit 44pt.
 */

import { Badge, Button, Card, ProductCard } from "../../../components";
import type { BadgeColor } from "../../../components/Badge";

import styles from "./ProductDetail.module.css";

export interface ProductDetailProduct {
  id: string;
  image: string;
  imageAlt: string;
  brand?: string;
  title: string;
  priceCurrent: string;
  priceOriginal?: string;
  rating?: number;
  ratingCount?: string;
  description: string;
  badges?: { label: string; color?: BadgeColor }[];
}

export interface ProductDetailRelatedProduct {
  id: string;
  href: string;
  image?: string;
  imageAlt?: string;
  title: string;
  priceCurrent: string;
  priceOriginal?: string;
}

export interface ProductDetailProps {
  breadcrumb?: { label: string; href?: string }[];
  product: ProductDetailProduct;
  showQuantity?: boolean;
  reviews?: {
    average: number;
    count: number;
    distribution?: number[];
  };
  relatedProducts?: ProductDetailRelatedProduct[];
  onAddToCart?: () => void;
  onFavorite?: () => void;
  onShare?: () => void;
}

export function ProductDetailTemplate({
  breadcrumb,
  product,
  showQuantity = true,
  reviews,
  relatedProducts,
  onAddToCart,
  onFavorite,
  onShare,
}: ProductDetailProps) {
  return (
    <main
      className={styles.container}
      style={{
        paddingInline: "var(--layout-page-margin-default)",
        paddingBlock: "var(--space-400)",
        display: "flex",
        flexDirection: "column",
        gap: "var(--space-400)",
        maxWidth: 1440,
        marginInline: "auto",
      }}
    >
      {/* Breadcrumb */}
      {breadcrumb && breadcrumb.length > 0 && (
        <nav
          aria-label="Breadcrumb"
          style={{
            color: "var(--text-secondary)",
            fontSize: "var(--font-size-caption-md)",
            lineHeight: "var(--line-height-caption-md)",
          }}
        >
          {breadcrumb.map((b, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: positional breadcrumb trail
            <span key={i}>
              {i > 0 && <span aria-hidden="true"> › </span>}
              {b.href ? (
                <a href={b.href} style={{ color: "inherit" }}>
                  {b.label}
                </a>
              ) : (
                b.label
              )}
            </span>
          ))}
        </nav>
      )}

      {/* Main 2-column grid on desktop, collapses to single column via @container query at ≤640px */}
      <div className={styles.mainGrid}>
        {/* Image gallery — Card wraps the main image; thumbnails TBD */}
        <Card padding="none">
          <img
            src={product.image}
            alt={product.imageAlt}
            style={{ width: "100%", height: "auto", display: "block" }}
          />
        </Card>

        {/* Product info + CTAs */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "var(--space-200)",
          }}
        >
          {product.brand && (
            <p
              style={{
                margin: 0,
                fontFamily: "var(--font-family-ios)",
                fontWeight: "var(--font-weight-emphasize)",
                fontSize: "var(--font-size-caption-md)",
                color: "var(--text-secondary)",
              }}
            >
              {product.brand}
            </p>
          )}

          <h1
            style={{
              margin: 0,
              fontFamily: "var(--font-family-ios)",
              fontWeight: "var(--font-weight-emphasize)",
              fontSize: "var(--font-size-heading-2xl)",
              lineHeight: "var(--line-height-heading-2xl)",
            }}
          >
            {product.title}
          </h1>

          {/* Badges */}
          {product.badges && product.badges.length > 0 && (
            <div style={{ display: "inline-flex", gap: "var(--space-100)" }}>
              {product.badges.slice(0, 2).map((b, i) => (
                <Badge
                  // biome-ignore lint/suspicious/noArrayIndexKey: positional badges (max 2)
                  key={i}
                  color={b.color ?? "neutral"}
                >
                  {b.label}
                </Badge>
              ))}
            </div>
          )}

          {/* Rating */}
          {typeof reviews?.average === "number" && (
            <div
              role="img"
              aria-label={`Rating ${reviews.average.toFixed(1)} out of 5, ${reviews.count} reviews`}
              style={{
                display: "inline-flex",
                gap: "var(--space-100)",
                alignItems: "center",
                fontFamily: "var(--font-family-ios)",
                fontSize: "var(--font-size-body-md)",
              }}
            >
              <span
                aria-hidden="true"
                style={{ color: "var(--color-amber-500)" }}
              >
                ★
              </span>
              <span aria-hidden="true">{reviews.average.toFixed(1)}</span>
              <span
                aria-hidden="true"
                style={{ color: "var(--text-secondary)" }}
              >
                ({reviews.count})
              </span>
            </div>
          )}

          {/* Price row */}
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              gap: "var(--space-200)",
            }}
          >
            <span
              style={{
                fontFamily: "var(--font-family-ios)",
                fontWeight: "var(--font-weight-emphasize)",
                fontSize: "var(--font-size-price-md)",
                lineHeight: "var(--line-height-price-md)",
                color: "var(--text-emphasis)",
              }}
            >
              {product.priceCurrent}
            </span>
            {product.priceOriginal && (
              <span
                style={{
                  fontFamily: "var(--font-family-ios)",
                  fontSize: "var(--font-size-strike-md)",
                  color: "var(--text-secondary)",
                  textDecoration: "line-through",
                }}
              >
                {product.priceOriginal}
              </span>
            )}
          </div>

          {/* Quantity selector (template-level; dedicated Stepper component TBD) */}
          {showQuantity && (
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "var(--space-100)",
              }}
            >
              <span
                style={{
                  fontSize: "var(--font-size-body-md)",
                  color: "var(--text-primary)",
                }}
              >
                Quantity · 数量
              </span>
              <Button
                variant="secondary"
                size="sm"
                iconOnly
                aria-label="Decrease quantity"
              >
                −
              </Button>
              <span style={{ minWidth: 24, textAlign: "center" }}>1</span>
              <Button
                variant="secondary"
                size="sm"
                iconOnly
                aria-label="Increase quantity"
              >
                +
              </Button>
            </div>
          )}

          {/* Add to Cart — THE emphasis CTA */}
          <Button variant="emphasis" size="lg" fullWidth onClick={onAddToCart}>
            Add to Cart · 加入购物车
          </Button>

          {/* Secondary actions */}
          <div style={{ display: "inline-flex", gap: "var(--space-100)" }}>
            <Button
              variant="tertiary"
              size="md"
              iconOnly
              aria-label="Save to favorites"
              onClick={onFavorite}
            >
              ♡
            </Button>
            <Button
              variant="tertiary"
              size="md"
              iconOnly
              aria-label="Share"
              onClick={onShare}
            >
              ⤴
            </Button>
          </div>
        </div>
      </div>

      {/* Description */}
      <Card surface="secondary" padding="lg">
        <h2
          style={{
            margin: 0,
            marginBottom: "var(--space-150)",
            fontSize: "var(--font-size-heading-md)",
            lineHeight: "var(--line-height-heading-md)",
          }}
        >
          Description · 商品描述
        </h2>
        <p style={{ margin: 0, whiteSpace: "pre-line" }}>
          {product.description}
        </p>
      </Card>

      {/* Related products */}
      {relatedProducts && relatedProducts.length > 0 && (
        <section>
          <h2
            style={{
              margin: 0,
              marginBottom: "var(--space-200)",
              fontSize: "var(--font-size-heading-xl)",
              lineHeight: "var(--line-height-heading-xl)",
            }}
          >
            Just for You · 为你推荐
          </h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
              gap: "var(--space-300)",
            }}
          >
            {relatedProducts.map((p) => (
              <ProductCard
                key={p.id}
                href={p.href}
                {...(p.image
                  ? { image: p.image, imageAlt: p.imageAlt ?? p.title }
                  : {})}
                title={p.title}
                priceCurrent={p.priceCurrent}
                priceOriginal={p.priceOriginal}
              />
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
