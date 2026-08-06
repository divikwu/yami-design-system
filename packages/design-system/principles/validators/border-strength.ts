/**
 * border-strength — flags `border:` / `border-color:` declarations using
 * custom colors instead of the 3 sanctioned strengths.
 *
 * Allowed border colors (via var(...)):
 *   --border-default  / --border-default-inverse
 *   --border-focus    / --border-focus-inverse
 *   --border-attention / --border-attention-inverse
 *   --divider-*       (for hairline separators)
 *
 * Also allowed:
 *   currentColor, transparent, inherit, unset, initial, 0, none
 */

import type { Validator, Violation } from '../schema'
import { findAll, result } from './_shared'

const BORDER_DECL =
  /\bborder(?:-(?:top|right|bottom|left|block|inline|x|y))?(?:-color)?\s*:\s*([^;}\n]+)/gi

const ALLOWED_LITERAL = new Set([
  'none',
  '0',
  'inherit',
  'unset',
  'initial',
  'revert',
  'currentColor',
  'currentcolor',
  'transparent',
])

const ALLOWED_TOKEN_PREFIXES = ['--border-', '--divider-']

export const borderStrength: Validator = {
  ruleId: 'border-strength',
  title: '边框强度',
  severity: 'warning',
  check(code) {
    const violations: Violation[] = []
    for (const hit of findAll(code, BORDER_DECL)) {
      const rawValue = (hit.groups[0] ?? '').trim()
      if (rawValue.length === 0) continue
      if (isAllowedBorderValue(rawValue)) continue
      violations.push({
        ruleId: 'border-strength',
        message: `Border declaration '${rawValue}' uses a color outside the sanctioned 3-strength set.`,
        severity: 'warning',
        locations: [hit.location],
        suggestion:
          'Use a --border-* or --divider-* token. Available: --border-default (hairline, 8%), --border-focus (87%), --border-attention (red); plus the --divider-* family for horizontal separators.',
      })
    }
    return result(violations)
  },
}

function isAllowedBorderValue(value: string): boolean {
  // shorthand like `1px solid var(--border-default)` — check all tokens referenced.
  const varNames = [...value.matchAll(/var\(\s*(--[a-z0-9-]+)/gi)].map((m) => m[1])
  if (varNames.length > 0) {
    return varNames.every(
      (name) =>
        typeof name === 'string' &&
        ALLOWED_TOKEN_PREFIXES.some((prefix) => name.startsWith(prefix)),
    )
  }

  // No var() reference — value must be an allowed literal (keyword, 0/none, etc.)
  // Shorthand with only widths + styles (no color) is fine: `1px solid`, `none`, etc.
  const tokens = value.split(/\s+/)
  const hasColor = tokens.some((t) => /^#[0-9a-f]{3,8}$/i.test(t) || t.startsWith('rgb'))
  if (!hasColor) return true

  return ALLOWED_LITERAL.has(value.trim())
}
