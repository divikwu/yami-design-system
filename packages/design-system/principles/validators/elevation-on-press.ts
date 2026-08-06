/**
 * elevation-on-press — flags `box-shadow` declarations inside interactive
 * pseudo-class selectors (`:hover`, `:active`, `:focus`, `:focus-visible`).
 *
 * Rationale: interaction feedback uses color (the -active token variants),
 * not shadow. Figma currently provides no YAMI elevation token source.
 */

import type { Validator, Violation } from '../schema'
import { findCssBlocks, offsetToLocation, result } from './_shared'

const INTERACTIVE_SELECTOR = /[^,{}]*:(?:hover|active|focus|focus-visible)[^,{}]*/g
const BOX_SHADOW_DECL = /\bbox-shadow\s*:/g

export const elevationOnPress: Validator = {
  ruleId: 'elevation-on-press',
  title: '交互不加 shadow',
  severity: 'error',
  check(code) {
    const violations: Violation[] = []
    for (const block of findCssBlocks(code, INTERACTIVE_SELECTOR)) {
      for (const m of block.body.matchAll(new RegExp(BOX_SHADOW_DECL.source, 'g'))) {
        violations.push({
          ruleId: 'elevation-on-press',
          message: `box-shadow inside ${block.selector.trim()} breaks elevation-on-press. Interaction feedback must use color changes, not shadow.`,
          severity: 'error',
          locations: [offsetToLocation(code, block.bodyStart + m.index, 'box-shadow'.length)],
          suggestion:
            'Remove the shadow change. For hover/active feedback, switch to the -active color token — e.g. background-color: var(--button-emphasis-active).',
        })
      }
    }
    return result(violations)
  },
}
