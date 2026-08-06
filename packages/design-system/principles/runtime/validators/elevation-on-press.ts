/**
 * elevation-on-press (runtime) — hover/press must not add or change shadow.
 *
 * P2 stub — returns pass. Full implementation requires hover/press
 * simulation (Playwright dispatchEvent or :hover pseudo-class forcing)
 * to compare box-shadow before and after interaction.
 * Left for Phase 8.5 Playwright integration.
 */

// TODO: Phase 8.5 — implement runtime check (needs Playwright hover simulation)
// Strategy:
// 1. For each interactive element, read getComputedStyle boxShadow (baseline)
// 2. Simulate :hover via Playwright page.hover() or dispatchEvent
// 3. Read boxShadow again
// 4. If shadow changed, flag violation
// Cannot be done in happy-dom / jsdom — needs real browser rendering.

import type { RuntimeValidator } from '../schema'

export const elevationOnPress: RuntimeValidator = {
  ruleId: 'elevation-on-press',
  title: '交互不加 shadow',
  severity: 'error',
  check(_root) {
    // TODO: Phase 8.5 — implement runtime check (needs Playwright hover simulation)
    return []
  },
}
