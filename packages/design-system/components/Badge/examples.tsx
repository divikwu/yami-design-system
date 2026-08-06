/**
 * Badge — canonical examples.
 *
 * Each export is a function React component (consumed by docs site
 * ComponentDocs.tsx as <Component />). The outer <section
 * data-example="<exportName>"> wrapper is a Phase 12b-3 addition for
 * Playwright per-section screenshot baselines (Phase 12g) — the section
 * is visually transparent (no default styles beyond block flow).
 */

import { Badge } from './Badge'

export const SaleBadge = () => (
  <section data-example="SaleBadge">
    <Badge type="sale">SALE</Badge>
  </section>
)

export const NewBadge = () => (
  <section data-example="NewBadge">
    <Badge type="new">NEW</Badge>
  </section>
)

export const DiscountBadge = () => (
  <section data-example="DiscountBadge">
    <Badge type="discount">–30%</Badge>
  </section>
)

export const OutOfStockBadge = () => (
  <section data-example="OutOfStockBadge">
    <Badge color="neutral" emphasis="secondary">
      OUT OF STOCK
    </Badge>
  </section>
)

export const LimitedBadge = () => (
  <section data-example="LimitedBadge">
    <Badge color="yellow">限时 Limited</Badge>
  </section>
)

export const BestsellerBadge = () => (
  <section data-example="BestsellerBadge">
    <Badge color="purple">BESTSELLER</Badge>
  </section>
)

export const AllColorsRow = () => (
  <section data-example="AllColorsRow">
    <div style={{ display: 'inline-flex', gap: 'var(--space-100)', alignItems: 'center' }}>
      <Badge color="red">SALE</Badge>
      <Badge color="blue">NEW</Badge>
      <Badge color="green">IN STOCK</Badge>
      <Badge color="purple">PREMIUM</Badge>
      <Badge color="yellow">LIMITED</Badge>
      <Badge color="neutral">Tag</Badge>
    </div>
  </section>
)

export const AllEmphasisRow = () => (
  <section data-example="AllEmphasisRow">
    <div style={{ display: 'inline-flex', gap: 'var(--space-100)', alignItems: 'center' }}>
      <Badge color="red" emphasis="primary">
        SALE
      </Badge>
      <Badge color="red" emphasis="secondary">
        Sale
      </Badge>
    </div>
  </section>
)
