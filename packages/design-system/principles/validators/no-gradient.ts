/**
 * no-gradient — flags linear-gradient / radial-gradient / conic-gradient.
 *
 * The one allowed gradient is the modal scrim rgba(0,0,0,0.68) — but that's
 * a solid rgba, not a gradient. So this rule has zero exceptions in practice.
 *
 * Covers both CSS (background: linear-gradient(...)) and React inline
 * style ({ background: 'linear-gradient(...)' }) since the regex matches
 * inside string literals too.
 */

import type { Validator, Violation } from '../schema'
import { findAll, result } from './_shared'

const GRADIENT_RE = /\b(?:repeating-)?(linear|radial|conic)-gradient\s*\(/gi

export const noGradient: Validator = {
  ruleId: 'no-gradient',
  title: '渐变禁用',
  severity: 'error',
  check(code) {
    const violations: Violation[] = findAll(code, GRADIENT_RE).map((hit) => ({
      ruleId: 'no-gradient',
      message: `CSS gradient is not allowed: ${hit.match}`,
      severity: 'error' as const,
      locations: [hit.location],
      suggestion:
        "Replace with a solid semantic token. For hover states use the corresponding --*-active token (e.g. --button-emphasis-active). For promo backgrounds use --brand-tertiary. The only 'gradient-like' effect permitted is the modal scrim — a solid rgba(0,0,0,0.68) overlay, not a gradient.",
    }))
    return result(violations)
  },
}
