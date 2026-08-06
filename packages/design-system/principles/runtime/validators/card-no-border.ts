/**
 * card-no-border (runtime) — Card elements should have no default border.
 *
 * P2 stub — returns pass. Full implementation requires identifying Card
 * components in the DOM (via data-yami-id or class patterns) and checking
 * their computed border properties.
 */

// TODO: Phase 8.5 — implement runtime check
// Strategy: querySelectorAll('[data-yami-id^="Card:"]') + elements with
// card-like class names, check getComputedStyle borderWidth === '0px'
// or borderColor matches --border-default (8% opacity).

import type { RuntimeValidator } from '../schema'

export const cardNoBorder: RuntimeValidator = {
  ruleId: 'card-no-border',
  title: 'Card 无默认边框',
  severity: 'warning',
  check(_root) {
    // TODO: Phase 8.5 — implement runtime check
    return []
  },
}
