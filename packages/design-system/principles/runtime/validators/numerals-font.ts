/**
 * numerals-font (runtime) — digits must render in GT Walsheim.
 *
 * P1: Real implementation using getComputedStyle fontFamily.
 *
 * This is the check AST fundamentally cannot do — AST only sees CSS
 * declarations, not the font fallback chain's actual resolution.
 * Runtime checks the computed fontFamily on elements containing digits.
 */

import { getSelectorPath, getYamiId, isVisible } from '../_shared'
import type { RuntimeValidator, RuntimeViolation } from '../schema'

const DIGIT_PATTERN = /\d/
const BRAND_FONT_PATTERN = /GT[\s-]?Walsheim/i

/**
 * Walk all text nodes under root, find those containing digits,
 * and verify their parent element's computed fontFamily includes GT Walsheim.
 */
function getTextNodesWithDigits(root: Element | Document): { node: Text; parent: Element }[] {
  const results: { node: Text; parent: Element }[] = []
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null)

  let node: Text | null = walker.nextNode() as Text | null
  while (node) {
    if (node.textContent && DIGIT_PATTERN.test(node.textContent)) {
      const parent = node.parentElement
      if (parent) {
        results.push({ node, parent })
      }
    }
    node = walker.nextNode() as Text | null
  }

  return results
}

export const numeralsFont: RuntimeValidator = {
  ruleId: 'numerals-font',
  title: '数字字体',
  severity: 'warning',
  check(root) {
    const violations: RuntimeViolation[] = []
    const textNodes = getTextNodesWithDigits(root)

    // Deduplicate by parent element to avoid multiple violations for
    // the same element with multiple text nodes containing digits
    const checked = new Set<Element>()

    for (const { parent } of textNodes) {
      if (checked.has(parent)) continue
      checked.add(parent)

      if (!isVisible(parent)) continue

      const fontFamily = getComputedStyle(parent).fontFamily
      if (!BRAND_FONT_PATTERN.test(fontFamily)) {
        violations.push({
          ruleId: 'numerals-font',
          message: `Digits rendered without GT Walsheim font. Computed fontFamily: "${fontFamily}".`,
          severity: 'warning',
          yamiId: getYamiId(parent),
          selector: getSelectorPath(parent),
          element: parent,
          suggestion:
            'Ensure digits use var(--font-brand) / GT Walsheim. Mixed CJK+digit strings should set font-family with GT Walsheim first in the stack.',
          measured: { fontFamily },
        })
      }
    }

    return violations
  },
}
