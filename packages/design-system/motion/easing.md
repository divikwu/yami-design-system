# Motion Easing

Single-family easing philosophy. No bounces, no overshoot, no playful rubber.

## Default easing

`cubic-bezier(0.2, 0, 0, 1)`

This is a standard material-ish ease-out curve. Fast start, slow settle. Works for all UI state changes.

CSS token (Phase 1): `--ease-default: cubic-bezier(0.2, 0, 0, 1);`

## Easing variants

Minimal alternatives — use only when the default is materially wrong.

| Name | Curve | Use for |
|---|---|---|
| `--ease-default` | `cubic-bezier(0.2, 0, 0, 1)` | State changes, hovers, page transitions (default) |
| `--ease-enter` | `cubic-bezier(0, 0, 0.2, 1)` | Elements coming into view (modal enter, toast show) |
| `--ease-exit` | `cubic-bezier(0.4, 0, 1, 1)` | Elements leaving (modal dismiss, toast hide) |
| `--ease-linear` | `linear` | Progress bars, loading indicators (only for truly linear progressions) |

## What we don't use

- ❌ `ease-in-out` (default browser cubic-bezier is too symmetrical, feels sluggish)
- ❌ Spring physics (react-spring / framer-motion spring presets) — they overshoot and feel "playful" off-brand
- ❌ Bounce curves (`cubic-bezier(0.68, -0.55, 0.27, 1.55)` or similar) — childish
- ❌ Custom per-component curves — discipline > flexibility

## Enforcement

Motion-related `rule-id`s in `../design.md`:
- None yet as of Phase 0 — motion rules mature after live app feedback

Future candidate rules:
- `motion-ease-from-token` — `transition-timing-function` must use one of the 4 token values, never arbitrary cubic-bezier
- `motion-no-spring-physics` — no use of spring-based animation libraries without explicit exception
