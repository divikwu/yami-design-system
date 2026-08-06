/**
 * red-usage — flags hardcoded YAMI red (#E00000 / #FF0000) and "red"
 * semantic tokens used outside the sanctioned contexts.
 *
 * What we can detect statically:
 *   - Hardcoded `#E00000` / `#FF0000` anywhere — always a violation
 *     (components should reference --text-emphasis / --button-emphasis /
 *     --color-red-500 tokens instead).
 *
 * What we cannot detect statically without semantic analysis:
 *   - Whether a correctly-used --button-emphasis button is actually in
 *     a brand / CTA / promo / urgency context. That's a human-judgment
 *     rule. validate_design surfaces emphasis-limit (scoped count) as
 *     the enforceable piece; red-usage's static check focuses on the
 *     hardcoded-literal case.
 */

import type { Validator, Violation } from '../schema'
import { findAll, result } from './_shared'

// Hardcoded YAMI red literals. Includes short hex #F00 / #FF0000 / #E00000
// plus rgb equivalents.
const RED_LITERALS = [
  /#F00\b/gi,
  /#E00\b/gi,
  /#FF0000\b/gi,
  /#E00000\b/gi,
  /rgb\(\s*255\s*,\s*0\s*,\s*0\s*\)/gi,
  /rgb\(\s*224\s*,\s*0\s*,\s*0\s*\)/gi,
]

export const redUsage: Validator = {
  ruleId: 'red-usage',
  title: '红色使用',
  severity: 'error',
  check(code) {
    const violations: Violation[] = []
    for (const re of RED_LITERALS) {
      for (const hit of findAll(code, re)) {
        violations.push({
          ruleId: 'red-usage',
          message: `Hardcoded YAMI red '${hit.match}' — must reference the appropriate semantic token.`,
          severity: 'error',
          locations: [hit.location],
          suggestion:
            'Replace with a semantic token. Common mappings: price display → var(--text-emphasis); CTA button → var(--button-emphasis); error text/border → var(--text-error)/var(--border-attention); badge bg → var(--badge-bg-primary-red); brand logo only → var(--brand-primary).',
        })
      }
    }
    return result(violations)
  },
}
