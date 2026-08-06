/**
 * no-opacity-disabled (runtime) — disabled elements must not use opacity.
 *
 * P1: Real implementation using getComputedStyle opacity.
 *
 * Checks [aria-disabled="true"] and [disabled] elements for opacity < 1.
 * Disabled state must use --button-disabled + --text-disabled tokens,
 * not opacity reduction.
 */

import { getSelectorPath, getYamiId } from '../_shared'
import type { RuntimeValidator, RuntimeViolation } from '../schema'

export const noOpacityDisabled: RuntimeValidator = {
  ruleId: 'no-opacity-disabled',
  title: 'Disabled 状态',
  severity: 'error',
  check(root) {
    const violations: RuntimeViolation[] = []
    const disabledElements = root.querySelectorAll('[aria-disabled="true"], [disabled]')

    for (const el of disabledElements) {
      // Even hidden disabled elements should be checked — they might
      // become visible via JS toggle
      const style = getComputedStyle(el)
      const opacity = parseFloat(style.opacity)

      if (opacity < 1.0) {
        violations.push({
          ruleId: 'no-opacity-disabled',
          message: `Disabled element uses opacity: ${opacity}. Must use --button-disabled + --text-disabled tokens instead.`,
          severity: 'error',
          yamiId: getYamiId(el),
          selector: getSelectorPath(el),
          element: el,
          suggestion:
            'Remove opacity from disabled state. Use background: var(--button-disabled) (#EBEBEB) and color: var(--text-disabled) (29% black) instead.',
          measured: { opacity },
        })
      }
    }

    return violations
  },
}
