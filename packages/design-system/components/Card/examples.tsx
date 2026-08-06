/**
 * Card — canonical examples.
 */

import { Card } from './Card'

export const BasicCard = () => (
  <section data-example="BasicCard">
    <Card>
      <h3
        style={{
          margin: 0,
          marginBottom: 'var(--space-100)',
          fontSize: 'var(--font-size-heading-sm)',
        }}
      >
        Order #Y20260420-1234
      </h3>
      <p style={{ margin: 0, color: 'var(--text-secondary)' }}>Estimated delivery: Apr 22–24</p>
    </Card>
  </section>
)

export const NoPaddingCard = () => (
  <section data-example="NoPaddingCard">
    <Card padding="none" style={{ width: 200 }}>
      <div style={{ height: 120, background: 'var(--brand-tertiary)' }} />
      <div style={{ padding: 'var(--space-200)' }}>Image-first card</div>
    </Card>
  </section>
)

export const BorderedCard = () => (
  <section data-example="BorderedCard">
    <Card bordered padding="sm">Dense grid item — hairline separation.</Card>
  </section>
)

export const LinkCard = () => (
  <section data-example="LinkCard">
    <Card as="a" href="/product/example" padding="md" style={{ textDecoration: 'none' }}>
      <div style={{ color: 'var(--text-primary)' }}>Click the whole card</div>
    </Card>
  </section>
)

export const SurfaceSecondaryCard = () => (
  <section data-example="SurfaceSecondaryCard">
    <Card surface="secondary">Secondary surface — less visual weight, good for info callouts.</Card>
  </section>
)

export const SurfaceInverseCard = () => (
  <section data-example="SurfaceInverseCard">
    <Card surface="inverse" padding="lg">
      <h2
        style={{
          margin: 0,
          fontSize: 'var(--font-size-heading-xl)',
          color: 'inherit',
        }}
      >
        On-dark hero
      </h2>
    </Card>
  </section>
)
