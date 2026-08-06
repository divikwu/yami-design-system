/**
 * type-hierarchy (runtime) — at most 4 distinct font sizes per page.
 *
 * P1: Real implementation using getComputedStyle fontSize.
 *
 * Collects all visible text elements' computed font sizes, deduplicates,
 * and flags if more than 4 distinct sizes are used.
 */

import { getSelectorPath, getYamiId, isVisible } from '../_shared'
import type { RuntimeValidator, RuntimeViolation } from '../schema'

const MAX_HIERARCHY_LEVELS = 4

/**
 * Collect all elements that contain direct text content.
 * We look for elements whose childNodes include at least one Text node.
 */
function getTextElements(root: Element | Document): Element[] {
  const elements: Element[] = []
  // Common text-bearing elements
  const candidates = root.querySelectorAll(
    'p, h1, h2, h3, h4, h5, h6, span, a, button, label, li, td, th, dt, dd, figcaption, blockquote, cite, em, strong, small, sub, sup, [class*="text"], [class*="title"], [class*="heading"], [class*="label"], [class*="caption"]',
  )

  for (const el of candidates) {
    // Only include elements with direct text content
    const hasText = Array.from(el.childNodes).some(
      (n) => n.nodeType === Node.TEXT_NODE && n.textContent?.trim(),
    )
    if (hasText && isVisible(el)) {
      elements.push(el)
    }
  }

  return elements
}

export const typeHierarchy: RuntimeValidator = {
  ruleId: 'type-hierarchy',
  title: '字体层级上限',
  severity: 'warning',
  check(root) {
    const violations: RuntimeViolation[] = []
    const textElements = getTextElements(root)

    // Collect distinct font sizes (rounded to nearest px to avoid sub-pixel noise)
    const fontSizeMap = new Map<string, Element[]>()

    for (const el of textElements) {
      const fontSize = getComputedStyle(el).fontSize
      // Normalize: round to nearest integer px
      const parsed = parseFloat(fontSize)
      if (Number.isNaN(parsed)) continue
      const normalized = `${Math.round(parsed)}px`

      const existing = fontSizeMap.get(normalized)
      if (existing) {
        existing.push(el)
      } else {
        fontSizeMap.set(normalized, [el])
      }
    }

    const distinctSizes = Array.from(fontSizeMap.keys()).sort(
      (a, b) => parseFloat(b) - parseFloat(a),
    )

    if (distinctSizes.length > MAX_HIERARCHY_LEVELS) {
      // Flag the first element of each "excess" size level (beyond the top 4)
      const excessSizes = distinctSizes.slice(MAX_HIERARCHY_LEVELS)

      for (const size of excessSizes) {
        const elements = fontSizeMap.get(size)
        const firstEl = elements?.[0]
        if (!firstEl) continue

        violations.push({
          ruleId: 'type-hierarchy',
          message: `Too many font size levels: ${distinctSizes.length} found (max ${MAX_HIERARCHY_LEVELS}). Size "${size}" exceeds the hierarchy limit.`,
          severity: 'warning',
          yamiId: getYamiId(firstEl),
          selector: getSelectorPath(firstEl),
          element: firstEl,
          suggestion: `Consolidate to ${MAX_HIERARCHY_LEVELS} levels (display / heading / body / caption). Found sizes: ${distinctSizes.join(', ')}.`,
          measured: {
            distinctSizes,
            totalLevels: distinctSizes.length,
          },
        })
      }
    }

    return violations
  },
}
