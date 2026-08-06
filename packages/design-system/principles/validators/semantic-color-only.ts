/**
 * semantic-color-only — flags uses of blue / green / purple / yellow
 * primitive color tokens OUTSIDE the sanctioned contexts (semantic status
 * + badge palette).
 *
 * Sanctioned:
 *   --text-{success,warning,info}, --text-error
 *   --fill-{success,warning,info,error,promotion}-{primary,secondary}
 *   --badge-{bg,fg}-*-{red,blue,green,purple,yellow,neutral}
 *
 * Flagged:
 *   Direct references to --color-blue-* / --color-green-* /
 *   --color-purple-* / --color-yellow-* / --color-amber-* / --color-orange-* /
 *   --color-pink-* / --color-rose-* / etc. from within application code
 *   (components, templates). Primitives are for semantic tokens to reference,
 *   not for UI to consume directly.
 *
 * Exceptions: this file is itself a rule definition, not UI code; semantic
 * color tokens in tokens/semantic/colors.tokens.json legitimately reference
 * --color-*-* primitives and are skipped by path (filename ends with
 * tokens.json or is in tokens/ dir).
 */

import type { ValidationContext, Validator, Violation } from '../schema'
import { findAll, result } from './_shared'

// Primitive color-family references we flag when used directly.
const PRIMITIVE_COLOR_REF =
  /var\(\s*(--color-(?:blue|green|emerald|teal|cyan|sky|indigo|purple|fuchsia|pink|rose|orange|amber|yellow|lime)-\d+)/gi

// Skip paths — tokens sources legitimately consume primitives.
const EXEMPT_PATH_MARKERS = ['/tokens/', '/dist/', '.tokens.json']

export const semanticColorOnly: Validator = {
  ruleId: 'semantic-color-only',
  title: '语义色限制',
  severity: 'error',
  check(code, context?: ValidationContext) {
    if (context?.filename && EXEMPT_PATH_MARKERS.some((m) => context.filename?.includes(m))) {
      return { pass: true, violations: [] }
    }
    const violations: Violation[] = findAll(code, PRIMITIVE_COLOR_REF).map((hit) => ({
      ruleId: 'semantic-color-only',
      message: `Direct primitive color reference '${hit.match.replace('var(', '').replace(/\s*$/, '')}' — use the appropriate semantic token instead.`,
      severity: 'error' as const,
      locations: [hit.location],
      suggestion:
        'Decorative use of blue/green/purple/yellow/etc is forbidden. Use semantic tokens: status → --text-{success,warning,info,error}; filled callouts → --fill-*-primary/secondary; colored tags → --badge-bg-*/--badge-fg-*. If the UI really needs a primitive color, it probably needs a new semantic token (ADR required).',
    }))
    return result(violations)
  },
}
