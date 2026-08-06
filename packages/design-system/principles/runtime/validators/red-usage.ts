/**
 * red-usage (runtime) — verify computed red colors are used only in
 * sanctioned contexts (brand mark, emphasis CTA, promo/urgency).
 *
 * P2 stub — returns pass. Full implementation requires semantic context
 * analysis (is this element a CTA? a price? a decorative element?)
 * which needs component role metadata from Phase 8.5.
 */

// TODO: Phase 8.5 — implement runtime check
// Strategy: getComputedStyle color/backgroundColor on all elements,
// filter for red-ish values (hue 0±15, saturation > 50%), then check
// element role/context against sanctioned usage list.

import type { RuntimeValidator } from '../schema'

export const redUsage: RuntimeValidator = {
  ruleId: 'red-usage',
  title: '红色使用',
  severity: 'error',
  check(_root) {
    // TODO: Phase 8.5 — implement runtime check
    return []
  },
}
