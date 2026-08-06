/**
 * Divider — canonical examples.
 */

import { Divider } from './Divider'

export const DefaultDivider = () => (
  <section data-example="DefaultDivider">
    <div style={{ width: 240 }}>
      <Divider />
    </div>
  </section>
)

export const EmphasisDivider = () => (
  <section data-example="EmphasisDivider">
    <div style={{ width: 240 }}>
      <Divider strength="emphasis" />
    </div>
  </section>
)

export const VerticalDivider = () => (
  <section data-example="VerticalDivider">
    <div style={{ display: 'inline-flex', gap: 'var(--space-100)', height: 20 }}>
      <span>Left</span>
      <Divider orientation="vertical" />
      <span>Right</span>
    </div>
  </section>
)

export const InverseDivider = () => (
  <section data-example="InverseDivider">
    <div
      style={{
        width: 240,
        padding: 'var(--space-200)',
        background: 'var(--surface-inverse)',
      }}
    >
      <Divider inverse />
    </div>
  </section>
)

export const BetweenSectionsExample = () => (
  <section data-example="BetweenSectionsExample">
    <div style={{ width: 320 }}>
      <section>
        <h3 style={{ margin: 0, marginBottom: 'var(--space-100)' }}>Profile</h3>
        <p style={{ margin: 0, color: 'var(--text-secondary)' }}>Name, email, password</p>
      </section>
      <div style={{ padding: 'var(--space-200) 0' }}>
        <Divider />
      </div>
      <section>
        <h3 style={{ margin: 0, marginBottom: 'var(--space-100)' }}>Notifications</h3>
        <p style={{ margin: 0, color: 'var(--text-secondary)' }}>Email, push, SMS</p>
      </section>
    </div>
  </section>
)

export const InlineInfoRowExample = () => (
  <section data-example="InlineInfoRowExample">
    <div style={{ display: 'inline-flex', gap: 'var(--space-100)', alignItems: 'center' }}>
      <span>4.8 ★</span>
      <Divider orientation="vertical" />
      <span>1.2k reviews</span>
      <Divider orientation="vertical" />
      <span>Ships free</span>
    </div>
  </section>
)
