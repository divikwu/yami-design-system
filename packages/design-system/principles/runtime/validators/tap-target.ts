/**
 * tap-target (runtime) — interactive elements ≥ 44×44 CSS pixels.
 *
 * P0: Real implementation using getBoundingClientRect.
 *
 * This is the check that AST validators fundamentally cannot do —
 * rendered bounding box depends on CSS cascade, layout context,
 * padding, and parent constraints.
 */

import { getAllInteractiveElements, getSelectorPath, getYamiId, isVisible } from '../_shared'
import type { RuntimeValidator, RuntimeViolation } from '../schema'

const MIN_SIZE = 44 // px — iOS HIG minimum; Android 48dp handled by platform-specific config

export const tapTarget: RuntimeValidator = {
  ruleId: 'tap-target',
  title: '触摸区域',
  severity: 'warning',
  check(root) {
    const violations: RuntimeViolation[] = []
    const elements = getAllInteractiveElements(root)

    for (const el of elements) {
      if (!isVisible(el)) continue

      const rect = el.getBoundingClientRect()
      const width = rect.width
      const height = rect.height

      if (width < MIN_SIZE || height < MIN_SIZE) {
        violations.push({
          ruleId: 'tap-target',
          message: `Interactive element has insufficient tap target: ${Math.round(width)}×${Math.round(height)}px (minimum ${MIN_SIZE}×${MIN_SIZE}px).`,
          severity: 'warning',
          yamiId: getYamiId(el),
          selector: getSelectorPath(el),
          element: el,
          suggestion:
            'Increase padding to expand the hit area to at least 44×44px. Use padding inside the element rather than growing the visible affordance.',
          measured: { width: Math.round(width), height: Math.round(height) },
        })
      }
    }

    return violations
  },
}
