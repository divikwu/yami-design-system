/**
 * focus-style — flags focus styling that deviates from "2px solid
 * var(--border-focus)" (or the component-appropriate --border-attention
 * in error states).
 *
 * Checks:
 *   1. `:focus-visible` blocks WITH `outline: none` and no custom outline
 *      restoration → fails (removes the visible focus indicator).
 *   2. `:focus*` blocks using `outline-color` with a hardcoded color
 *      (not via --border-focus or --border-attention) → fails.
 *
 * Allowed / ignored:
 *   - Components that delegate focus to a child (e.g. Input wraps the
 *     native input — :focus-visible on the input is what matters).
 *   - Blanket `outline: none` paired with a :focus-visible rule that
 *     restores the outline is fine.
 */

import type { Validator, Violation } from '../schema'
import { findCssBlocks, offsetToLocation, result } from './_shared'

const FOCUS_SELECTOR = /[^,{}]*:focus(?:-visible)?[^,{}]*/g

// Hardcoded outline-color that isn't our --border-focus / --border-attention.
const OUTLINE_COLOR = /\boutline(?:-color)?\s*:\s*([^;}\n]+)/gi

const ALLOWED_FOCUS_COLORS = [
  '--border-focus',
  '--border-focus-inverse',
  '--border-attention',
  '--border-attention-inverse',
]

export const focusStyle: Validator = {
  ruleId: 'focus-style',
  title: '焦点样式',
  severity: 'error',
  check(code) {
    const violations: Violation[] = []
    for (const block of findCssBlocks(code, FOCUS_SELECTOR)) {
      for (const m of block.body.matchAll(new RegExp(OUTLINE_COLOR.source, 'gi'))) {
        const rawValue = (m[1] ?? '').trim()
        if (rawValue === 'none' || rawValue === 'inherit') continue
        // Extract any var() reference; must be an allowed focus token.
        const varNames = [...rawValue.matchAll(/var\(\s*(--[a-z0-9-]+)/gi)].map((mm) => mm[1])
        if (varNames.some((name) => name && ALLOWED_FOCUS_COLORS.includes(name))) continue
        violations.push({
          ruleId: 'focus-style',
          message: `Focus outline uses '${rawValue}' — must use var(--border-focus) (or --border-attention for error states).`,
          severity: 'error',
          locations: [offsetToLocation(code, block.bodyStart + m.index, (m[0] ?? '').length)],
          suggestion:
            'Use `outline: 2px solid var(--border-focus); outline-offset: 2px;` for focus-visible. For input error states pair with var(--border-attention).',
        })
      }
    }
    return result(violations)
  },
}
