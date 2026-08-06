/**
 * no-custom-radii (runtime) — borderRadius must match allowed token values.
 *
 * P2 stub — returns pass. Full implementation requires mapping computed
 * borderRadius values back to the allowed set (12/8/9999/4/0 px).
 * Phase 8.5 will implement with tolerance for sub-pixel rendering.
 */

// TODO: Phase 8.5 — implement runtime check
// Strategy: getComputedStyle borderRadius on all elements, parse to px,
// verify against ALLOWED_RADII set {0, 4, 8, 12, 9999}.

import type { RuntimeValidator } from '../schema'

export const noCustomRadii: RuntimeValidator = {
  ruleId: 'no-custom-radii',
  title: '圆角限制',
  severity: 'error',
  check(_root) {
    // TODO: Phase 8.5 — implement runtime check
    return []
  },
}
