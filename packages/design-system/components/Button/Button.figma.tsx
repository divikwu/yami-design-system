/**
 * Button.figma.tsx — Figma Code Connect binding.
 *
 * Maps the YAMI Figma Button component sets to the real
 * @yami/design-system Button. When designers open a Button instance in
 * Figma Dev Mode, Code Connect returns the snippet below instead of raw
 * Figma structure — devs copy production-ready JSX directly.
 *
 * The Figma Button is split across 6 component_sets (Mobile/PC × Full/
 * Inline/Icon × Default/Inverse). Each `figma.connect` call below binds
 * one component_set. The variant `Type` / `Size` / `State` properties on
 * each set are mapped here; the Form axis is encoded by which connect()
 * the binding lives in.
 *
 * State → component props:
 *   "Default"          → no extra prop
 *   "Hover / Active"   → no extra prop (handled by CSS :hover / :active)
 *   "Disabled"         → disabled
 *   "Loading"          → loading (Full / Inline only — Icon has no Loading variant)
 *
 * componentKey: populated by Figma library publish; runtime nodeId
 * resolution happens via figcraft or Code Connect publish.
 */

import { figma } from '@figma/code-connect'

import { Button } from './Button'

const FIGMA_FILE = 'https://www.figma.com/design/6oOAy72DBff4P6NzJYc2hi/YAMI-UI-UX-Guidelines'

const typeMap = {
  Emphasis: 'emphasis',
  Primary: 'primary',
  Secondary: 'secondary',
  Tertiary: 'tertiary',
} as const

const sizeMap = {
  Large: 'lg',
  Medium: 'md',
  Small: 'sm',
} as const

// ─── PC Full (5587:127256) ──────────────────────────────────────────
figma.connect(Button, `${FIGMA_FILE}?node-id=5587-127256`, {
  props: {
    variant: figma.enum('Type', typeMap),
    size: figma.enum('Size', sizeMap),
    disabled: figma.enum('State', { Disabled: true }),
    loading: figma.enum('State', { Loading: true }),
    children: figma.textContent('Label'),
  },
  example: ({ variant, size, disabled, loading, children }) => (
    <Button form="full" variant={variant} size={size} disabled={disabled} loading={loading}>
      {children}
    </Button>
  ),
})

// ─── PC Full - Inverse (5587:127647) ────────────────────────────────
figma.connect(Button, `${FIGMA_FILE}?node-id=5587-127647`, {
  props: {
    variant: figma.enum('Type', typeMap),
    size: figma.enum('Size', sizeMap),
    disabled: figma.enum('State', { Disabled: true }),
    loading: figma.enum('State', { Loading: true }),
    children: figma.textContent('Label'),
  },
  example: ({ variant, size, disabled, loading, children }) => (
    <Button form="full" inverse variant={variant} size={size} disabled={disabled} loading={loading}>
      {children}
    </Button>
  ),
})

// ─── PC Inline (5587:127393) ────────────────────────────────────────
figma.connect(Button, `${FIGMA_FILE}?node-id=5587-127393`, {
  props: {
    variant: figma.enum('Type', typeMap),
    size: figma.enum('Size', sizeMap),
    disabled: figma.enum('State', { Disabled: true }),
    loading: figma.enum('State', { Loading: true }),
    children: figma.textContent('Label'),
  },
  example: ({ variant, size, disabled, loading, children }) => (
    <Button form="inline" variant={variant} size={size} disabled={disabled} loading={loading}>
      {children}
    </Button>
  ),
})

// ─── PC Inline - Inverse (5587:127784) ──────────────────────────────
figma.connect(Button, `${FIGMA_FILE}?node-id=5587-127784`, {
  props: {
    variant: figma.enum('Type', typeMap),
    size: figma.enum('Size', sizeMap),
    disabled: figma.enum('State', { Disabled: true }),
    loading: figma.enum('State', { Loading: true }),
    children: figma.textContent('Label'),
  },
  example: ({ variant, size, disabled, loading, children }) => (
    <Button form="inline" inverse variant={variant} size={size} disabled={disabled} loading={loading}>
      {children}
    </Button>
  ),
})

// ─── PC Icon (5587:127574) — no Loading variant; aria-label required ─
figma.connect(Button, `${FIGMA_FILE}?node-id=5587-127574`, {
  props: {
    variant: figma.enum('Type', typeMap),
    size: figma.enum('Size', sizeMap),
    disabled: figma.enum('State', { Disabled: true }),
  },
  example: ({ variant, size, disabled }) => (
    <Button form="icon" variant={variant} size={size} disabled={disabled} aria-label="TODO">
      {/* Replace with the SVG icon from design-systems/yami/assets/icons/ */}
    </Button>
  ),
})

// ─── PC Icon - Inverse (5587:127965) ────────────────────────────────
figma.connect(Button, `${FIGMA_FILE}?node-id=5587-127965`, {
  props: {
    variant: figma.enum('Type', typeMap),
    size: figma.enum('Size', sizeMap),
    disabled: figma.enum('State', { Disabled: true }),
  },
  example: ({ variant, size, disabled }) => (
    <Button form="icon" inverse variant={variant} size={size} disabled={disabled} aria-label="TODO">
      {/* Replace with the SVG icon from design-systems/yami/assets/icons/ */}
    </Button>
  ),
})

// ─── Mobile (Full/Inline/Icon × Default/Inverse) ────────────────────
// Mobile sets reuse the same prop mapping. Binding URLs only:
//   5579:113397  Mobile Full - Default
//   5587:118979  Mobile Full - Inverse
//   5579:116562  Mobile Inline - Default
//   5587:119340  Mobile Inline - Inverse
//   5587:118666  Mobile Icon - Default
//   5587:123317  Mobile Icon - Inverse
// Same props/example bodies as the PC siblings above — kept un-duplicated
// here so this file stays scannable. Add 6 more figma.connect() blocks
// before publish (or factor a small helper if duplication grows).
