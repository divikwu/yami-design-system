/**
 * emphasis-limit (runtime) — at most 1 visible Emphasis Button per screen.
 *
 * P0: Real implementation using DOM inspection.
 *
 * Detection strategy:
 * 1. Elements with data-yami-id starting with "Button:" and computed
 *    backgroundColor matching --button-emphasis resolved value
 * 2. Elements with CSS class containing "emphasis" (CSS Modules hash)
 * 3. Only counts isVisible(el) === true elements
 *
 * This catches what AST cannot: conditional rendering, dynamic visibility,
 * and CSS Modules class name hashing.
 */

import { getSelectorPath, getYamiId, isVisible, resolveColor } from '../_shared'
import type { RuntimeValidator, RuntimeViolation } from '../schema'

// YAMI brand red — the emphasis button background color
// #E00000 = rgb(224, 0, 0)
const EMPHASIS_RED = { r: 224, g: 0, b: 0 }
const COLOR_TOLERANCE = 10 // allow slight rendering differences

function isEmphasisColor(bgColor: string): boolean {
  const parsed = resolveColor(bgColor)
  if (!parsed) return false
  return (
    Math.abs(parsed.r - EMPHASIS_RED.r) <= COLOR_TOLERANCE &&
    Math.abs(parsed.g - EMPHASIS_RED.g) <= COLOR_TOLERANCE &&
    Math.abs(parsed.b - EMPHASIS_RED.b) <= COLOR_TOLERANCE &&
    parsed.a > 0.5
  )
}

function isEmphasisButton(el: Element): boolean {
  const isButtonElement = el.tagName === 'BUTTON' || el.getAttribute('role') === 'button'

  // Check data-yami-id pattern (Button: prefix + emphasis background color)
  const yamiId = el.getAttribute('data-yami-id')
  if (yamiId?.startsWith('Button:')) {
    const bgColor = getComputedStyle(el).backgroundColor
    if (isEmphasisColor(bgColor)) return true
  }

  // Check CSS class containing "emphasis" — only on button-like elements
  // to avoid matching wrapper divs like "emphasis-section"
  if (isButtonElement) {
    const classList = el.className
    if (typeof classList === 'string' && /emphasis/i.test(classList)) {
      return true
    }
    // Also check background color for buttons without class hint
    const bgColor = getComputedStyle(el).backgroundColor
    if (isEmphasisColor(bgColor)) return true
  }

  // Non-button elements with [class*="emphasis"] from querySelectorAll
  // that don't have data-yami-id="Button:..." are not emphasis buttons.
  return false
}

export const emphasisLimit: RuntimeValidator = {
  ruleId: 'emphasis-limit',
  title: 'Emphasis 数量',
  severity: 'error',
  check(root) {
    const violations: RuntimeViolation[] = []

    // Collect all potential button-like elements
    const candidates = root.querySelectorAll(
      'button, [role="button"], [data-yami-id^="Button:"], [class*="emphasis"]',
    )

    const visibleEmphasis: Element[] = []
    for (const el of candidates) {
      if (!isVisible(el)) continue
      if (isEmphasisButton(el)) {
        visibleEmphasis.push(el)
      }
    }

    // Flag every occurrence after the first
    if (visibleEmphasis.length > 1) {
      for (const el of visibleEmphasis.slice(1)) {
        violations.push({
          ruleId: 'emphasis-limit',
          message: `Multiple visible Emphasis Buttons found (${visibleEmphasis.length} total). Rule allows exactly 1 per screen.`,
          severity: 'error',
          yamiId: getYamiId(el),
          selector: getSelectorPath(el),
          element: el,
          suggestion:
            'Only the single most important CTA should be Emphasis. Make secondary actions variant="primary" (black) or variant="secondary" (grey).',
          measured: { totalEmphasisCount: visibleEmphasis.length },
        })
      }
    }

    return violations
  },
}
