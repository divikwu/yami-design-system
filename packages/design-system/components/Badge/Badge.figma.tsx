/**
 * Badge.figma.tsx — Figma Code Connect binding.
 *
 * Maps the YAMI Figma `Badge / Mobile` + `Badge / PC` component sets to the
 * @yami/design-system Badge. Figma encodes Badge by semantic Type (not by
 * color/emphasis) — the binding below uses the code-side `type` shortcut
 * which preserves Figma's naming verbatim.
 *
 * Figma's `Language` property (EN | CN) is content-only — the consumer
 * passes the localized label via children, so it's omitted here.
 *
 * Two specialty sets — Top Seller, Membership / tag, Badge / icon,
 * Membership / icon — are NOT bound here. They use different anatomies
 * and should ship as their own components if the product needs them.
 */

import { figma } from '@figma/code-connect'

import { Badge } from './Badge'

const FIGMA_FILE = 'https://www.figma.com/design/6oOAy72DBff4P6NzJYc2hi/YAMI-UI-UX-Guidelines'

const typeMap = {
  Price: 'price',
  Sale: 'sale',
  'Low price': 'low-price',
  Discount: 'discount',
  New: 'new',
  Hot: 'hot',
  Exclusive: 'exclusive',
  Choice: 'choice',
  'Best Sellers': 'best-sellers',
} as const

// ─── PC (1539:22788) ────────────────────────────────────────────────
figma.connect(Badge, `${FIGMA_FILE}?node-id=1539-22788`, {
  props: {
    type: figma.enum('Type', typeMap),
    children: figma.textContent('Label'),
  },
  example: ({ type, children }) => <Badge type={type}>{children}</Badge>,
})

// ─── Mobile (1538:3058) ─────────────────────────────────────────────
// Same Type axis; code renders identical CSS — only viewport-driven
// styles differ (Mobile baseline = 20px; PC main bumps to 24 is deferred).
figma.connect(Badge, `${FIGMA_FILE}?node-id=1538-3058`, {
  props: {
    type: figma.enum('Type', typeMap),
    children: figma.textContent('Label'),
  },
  example: ({ type, children }) => <Badge type={type}>{children}</Badge>,
})
