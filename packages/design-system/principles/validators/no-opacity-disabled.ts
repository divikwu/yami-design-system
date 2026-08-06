/**
 * no-opacity-disabled — flags `opacity` declarations inside `:disabled` or
 * `[disabled]` or `.disabled` selector blocks.
 *
 * Rationale: `opacity` is a visual dimmer that doesn't communicate semantic
 * state. Disabled elements should use --button-disabled / --text-disabled
 * tokens. See design.md no-opacity-disabled.
 */

import type { Validator, Violation } from '../schema'
import { findCssBlocks, offsetToLocation, result } from './_shared'

const DISABLED_SELECTOR = /[^,{]*(?::disabled|\[disabled\]|\.disabled)[^,{]*/g
const OPACITY_DECL = /\bopacity\s*:/g

export const noOpacityDisabled: Validator = {
  ruleId: 'no-opacity-disabled',
  title: 'Disabled 状态',
  severity: 'error',
  check(code) {
    const violations: Violation[] = []
    for (const block of findCssBlocks(code, DISABLED_SELECTOR)) {
      for (const m of block.body.matchAll(new RegExp(OPACITY_DECL.source, 'g'))) {
        violations.push({
          ruleId: 'no-opacity-disabled',
          message: `opacity inside disabled selector '${block.selector.trim()}' breaks no-opacity-disabled. Use --button-disabled / --text-disabled tokens instead.`,
          severity: 'error',
          locations: [offsetToLocation(code, block.bodyStart + m.index, 'opacity'.length)],
          suggestion:
            'Replace `opacity: 0.5` with an explicit color token: `background-color: var(--button-disabled); color: var(--text-disabled);`',
        })
      }
    }
    return result(violations)
  },
}
