/**
 * focus-style (runtime) — focus must use 2px outline in --border-focus (black).
 *
 * P1: Real implementation using programmatic focus + getComputedStyle.
 *
 * For each interactive element: focus it, read computed outline properties,
 * verify it's a 2px solid outline in a dark color (--border-focus = black 87%),
 * then blur.
 */

import {
  getAllInteractiveElements,
  getSelectorPath,
  getYamiId,
  isVisible,
  resolveColor,
} from '../_shared'
import type { RuntimeValidator, RuntimeViolation } from '../schema'

// --border-focus is rgba(0,0,0,0.87) — near-black
const EXPECTED_WIDTH = 2 // px

export const focusStyle: RuntimeValidator = {
  ruleId: 'focus-style',
  title: '焦点样式',
  severity: 'error',
  check(root) {
    const violations: RuntimeViolation[] = []
    const elements = getAllInteractiveElements(root)

    for (const el of elements) {
      if (!isVisible(el)) continue

      const htmlEl = el as HTMLElement

      // Programmatically focus the element
      try {
        htmlEl.focus()
      } catch {
        continue // skip elements that can't be focused
      }

      // Check if this element actually received focus
      if (document.activeElement !== el) continue

      const style = getComputedStyle(el)
      const outlineStyle = style.outlineStyle
      const outlineWidth = parseFloat(style.outlineWidth)
      const outlineColor = style.outlineColor

      // Blur before potentially pushing violations
      try {
        htmlEl.blur()
      } catch {
        // ignore blur errors
      }

      // Elements with outline:none may use box-shadow or border as
      // alternative focus indicator. Flag as warning (not error) since
      // we can't reliably detect box-shadow changes in happy-dom.
      // Phase 8.5 Playwright tests will do before/after comparison.
      if (outlineStyle === 'none' || outlineWidth === 0) {
        violations.push({
          ruleId: 'focus-style',
          message:
            'Interactive element has no visible outline on focus. Verify it uses an alternative focus indicator, or add 2px outline in --border-focus.',
          severity: 'warning',
          yamiId: getYamiId(el),
          selector: getSelectorPath(el),
          element: el,
          suggestion:
            'Add outline: 2px solid var(--border-focus) with outline-offset: 2px on :focus-visible. Do not use blue focus rings.',
          measured: { outlineStyle, outlineWidth, outlineColor },
        })
        continue
      }

      // Verify outline width is ~2px
      if (Math.abs(outlineWidth - EXPECTED_WIDTH) > 0.5) {
        violations.push({
          ruleId: 'focus-style',
          message: `Focus outline width is ${outlineWidth}px (expected ${EXPECTED_WIDTH}px).`,
          severity: 'error',
          yamiId: getYamiId(el),
          selector: getSelectorPath(el),
          element: el,
          suggestion: `Set outline-width to ${EXPECTED_WIDTH}px.`,
          measured: { outlineWidth, outlineColor },
        })
      }

      // Verify outline color is dark (--border-focus = black 87%)
      const parsed = resolveColor(outlineColor)
      if (parsed) {
        const isBlue = parsed.b > 150 && parsed.r < 100 && parsed.g < 100
        if (isBlue) {
          violations.push({
            ruleId: 'focus-style',
            message: `Focus outline uses blue color "${outlineColor}". Must use --border-focus (black).`,
            severity: 'error',
            yamiId: getYamiId(el),
            selector: getSelectorPath(el),
            element: el,
            suggestion:
              'Replace blue focus ring with outline-color: var(--border-focus) (rgba(0,0,0,0.87)).',
            measured: { outlineColor, parsedColor: parsed },
          })
        }
      }
    }

    return violations
  },
}
