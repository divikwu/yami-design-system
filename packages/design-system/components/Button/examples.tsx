/**
 * Button — canonical examples.
 *
 * Each named export = one example that Playground / eval harness /
 * preview build consumes. Keep them minimal (one concept each) and
 * consistent with usage.md patterns.
 *
 * Exported names must match meta.json `examples[]`.
 */

import { Button } from './Button'

export const EmphasisExample = () => (
  <section data-example="EmphasisExample">
    <Button variant="emphasis">Buy Now</Button>
  </section>
)

export const PrimaryExample = () => (
  <section data-example="PrimaryExample">
    <Button variant="primary">Continue</Button>
  </section>
)

export const SecondaryExample = () => (
  <section data-example="SecondaryExample">
    <Button variant="secondary">Cancel</Button>
  </section>
)

export const TertiaryExample = () => (
  <section data-example="TertiaryExample">
    <Button variant="tertiary">Skip</Button>
  </section>
)

export const WithLeftIconExample = () => (
  <section data-example="WithLeftIconExample">
    <Button variant="emphasis" leftIcon={<CartIcon />}>
      Add to Cart
    </Button>
  </section>
)

export const IconOnlyExample = () => (
  <section data-example="IconOnlyExample">
    <Button form="icon" aria-label="Close">
      <CloseIcon />
    </Button>
  </section>
)

export const LoadingExample = () => (
  <section data-example="LoadingExample">
    <Button variant="primary" loading>
      Saving…
    </Button>
  </section>
)

export const DisabledExample = () => (
  <section data-example="DisabledExample">
    <Button variant="primary" disabled>
      Unavailable
    </Button>
  </section>
)

export const FullWidthExample = () => (
  <section data-example="FullWidthExample">
    <Button variant="emphasis" size="lg" form="full">
      Place Order
    </Button>
  </section>
)

export const AllSizesExample = () => (
  <section data-example="AllSizesExample">
    <div style={{ display: 'inline-flex', gap: 'var(--space-200)', alignItems: 'center' }}>
      <Button variant="primary" size="sm">
        Small
      </Button>
      <Button variant="primary" size="md">
        Medium
      </Button>
      <Button variant="primary" size="lg">
        Large
      </Button>
    </div>
  </section>
)

/**
 * Checkout terminal CTA — the canonical "one emphasis + one secondary"
 * pattern that every bottom-of-screen cart action uses. Paired like
 * this, the emphasis red doesn't compete with itself.
 */
export const CheckoutCTARowExample = () => (
  <section data-example="CheckoutCTARowExample">
    <div style={{ display: 'flex', gap: 'var(--space-200)', maxWidth: 480 }}>
      <Button variant="secondary" size="lg" form="full">
        Continue Shopping
      </Button>
      <Button variant="emphasis" size="lg" form="full">
        Place Order
      </Button>
    </div>
  </section>
)

export const InverseExample = () => (
  <section
    data-example="InverseExample"
    style={{
      background: 'var(--surface-inverse)',
      padding: 'var(--space-300)',
      borderRadius: 'var(--radius-surface-default)',
      display: 'inline-flex',
      gap: 'var(--space-200)',
    }}
  >
    <Button variant="emphasis" inverse>
      Place Order
    </Button>
    <Button variant="secondary" inverse>
      Cancel
    </Button>
  </section>
)

// ──────────────────────────────────────────────────────────────
// Inline icon stubs (minimal SVGs). Real pages import from @ds/icons/.
// These are defined here so examples.tsx is self-contained and can be
// rendered in isolation by the Playground.

function CartIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M2 3h3l2.6 13.4A2 2 0 0 0 9.6 18H19a2 2 0 0 0 2-1.6L22.5 9H6"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="none"
      />
      <circle cx="10" cy="21" r="1" fill="currentColor" />
      <circle cx="18" cy="21" r="1" fill="currentColor" />
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M3 3l10 10M13 3L3 13"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  )
}
