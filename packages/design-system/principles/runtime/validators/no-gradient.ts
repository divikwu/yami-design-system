/**
 * no-gradient (runtime) — no gradient backgrounds in rendered DOM.
 *
 * P1: Real implementation using getComputedStyle backgroundImage.
 *
 * Checks every element's computed backgroundImage for gradient functions.
 * The only exception is modal scrim overlay rgba(0,0,0,0.68).
 */

import { getSelectorPath, getYamiId, isVisible } from '../_shared'
import type { RuntimeValidator, RuntimeViolation } from '../schema'

const GRADIENT_PATTERN = /(?:linear|radial|conic)-gradient/i

/**
 * Check if a backgroundImage value is the allowed modal scrim exception.
 * design.md allows: modal scrim overlay rgba(0,0,0,0.68).
 * In practice this appears as a semi-transparent solid, not a gradient,
 * but guard against edge cases where it's expressed as a gradient stop.
 */
function isModalScrimException(bgImage: string): boolean {
  // A single-stop "gradient" that's effectively rgba(0,0,0,0.68) solid
  // e.g. linear-gradient(rgba(0,0,0,0.68), rgba(0,0,0,0.68))
  return /gradient\(\s*rgba\(\s*0\s*,\s*0\s*,\s*0\s*,\s*0\.68\s*\)/.test(bgImage)
}

export const noGradient: RuntimeValidator = {
  ruleId: 'no-gradient',
  title: '渐变禁用',
  severity: 'error',
  check(root) {
    const violations: RuntimeViolation[] = []
    const allElements = root.querySelectorAll('*')

    for (const el of allElements) {
      if (!isVisible(el)) continue

      const bgImage = getComputedStyle(el).backgroundImage
      if (bgImage && bgImage !== 'none' && GRADIENT_PATTERN.test(bgImage)) {
        // Skip the modal scrim exception
        if (isModalScrimException(bgImage)) continue

        violations.push({
          ruleId: 'no-gradient',
          message: `Element uses a gradient background: "${bgImage.slice(0, 80)}${bgImage.length > 80 ? '…' : ''}".`,
          severity: 'error',
          yamiId: getYamiId(el),
          selector: getSelectorPath(el),
          element: el,
          suggestion:
            'Remove the gradient. Use solid colors from the token system. The only allowed exception is modal scrim rgba(0,0,0,0.68).',
          measured: { backgroundImage: bgImage },
        })
      }
    }

    return violations
  },
}
