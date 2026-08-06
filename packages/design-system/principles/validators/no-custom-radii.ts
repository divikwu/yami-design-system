/**
 * no-custom-radii — flags `border-radius` declarations that don't use the
 * sanctioned radius tokens.
 *
 * Allowed:
 *   border-radius: var(--radius-*)
 *   border-radius: 0 | 0px    (equivalent to --radius-none)
 *
 * Not allowed:
 *   border-radius: 8px                (use --radius-md)
 *   border-radius: 50%                (use --radius-full)
 *   border-radius: 8.5px              (never)
 *
 * Doesn't flag inherit / unset / initial.
 */

import type { Validator, Violation } from '../schema'
import { ALLOWED_RADIUS_TOKENS, findAll, result } from './_shared'

// Match `border-radius: <value>;` — captures the raw value.
// Handles longhand (border-top-left-radius, etc.) too.
const RADIUS_DECL = /\bborder(?:-[a-z]+)?-radius\s*:\s*([^;}\n]+)/gi

// Allowed literal values (zero is equivalent to --radius-none).
const ALLOWED_LITERAL = new Set(['0', '0px', '0rem', 'inherit', 'unset', 'initial', 'revert'])

export const noCustomRadii: Validator = {
  ruleId: 'no-custom-radii',
  title: '圆角限制',
  severity: 'error',
  check(code) {
    const violations: Violation[] = []
    for (const hit of findAll(code, RADIUS_DECL)) {
      const rawValue = (hit.groups[0] ?? '').trim()
      if (rawValue.length === 0) continue
      if (ALLOWED_LITERAL.has(rawValue)) continue

      // Extract var(--name) references and verify they're in the allowlist.
      const varNames = [...rawValue.matchAll(/var\(\s*(--[a-z0-9-]+)/gi)].map((m) => m[1])
      if (varNames.length > 0) {
        const bad = varNames.filter((name) => name && !ALLOWED_RADIUS_TOKENS.has(name))
        if (bad.length === 0) continue
        violations.push({
          ruleId: 'no-custom-radii',
          message: `border-radius references non-radius token(s): ${bad.join(', ')}`,
          severity: 'error',
          locations: [hit.location],
          suggestion:
            'Use a --radius-* token: primitive (--radius-none|sm|md|lg|xl|full) or semantic alias (--radius-surface-default|none, --radius-component-default|none, --radius-button-emphasis|primary, --radius-tag-primary).',
        })
        continue
      }

      // Raw literal (not a token, not an allowed literal) → violation.
      violations.push({
        ruleId: 'no-custom-radii',
        message: `Hand-coded border-radius: '${rawValue}' — must use a --radius-* token.`,
        severity: 'error',
        locations: [hit.location],
        suggestion:
          'Replace with var(--radius-sm|md|lg|xl|full) or a semantic alias. Common mappings: 4px→--radius-sm, 8px→--radius-md, 12px→--radius-lg, 16px→--radius-xl, 9999px/50%→--radius-full.',
      })
    }
    return result(violations)
  },
}
