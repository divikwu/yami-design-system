/**
 * border-strength (runtime) — borders must use one of 3 allowed strengths:
 * default (8%), focus (87%), attention (red).
 *
 * P2 stub — returns pass. Full implementation requires parsing computed
 * borderColor and matching against the 3-tier system.
 */

// TODO: Phase 8.5 — implement runtime check
// Strategy: getComputedStyle borderColor on elements with visible borders
// (borderWidth > 0), resolve to RGBA, verify against allowed set:
// - default: rgba(0,0,0,0.08)
// - focus: rgba(0,0,0,0.87)
// - attention: #E00000

import type { RuntimeValidator } from '../schema'

export const borderStrength: RuntimeValidator = {
  ruleId: 'border-strength',
  title: '边框强度',
  severity: 'warning',
  check(_root) {
    // TODO: Phase 8.5 — implement runtime check
    return []
  },
}
