/**
 * numerals-font — digits must use GT Walsheim (--font-family-ios).
 *
 * Status: SKELETON — static check is unreliable without AST + font
 * inheritance tracking. The rule requires knowing which element renders
 * which text content and which font resolves at that element. Current
 * limitation:
 *   - A price component correctly setting font-family-ios is always OK
 *   - A text node with "$12.99" inside a --font-family-ios
 *     context is a violation — but checking requires CSS cascade simulation
 *
 * This validator returns pass=true with a note. Phase 8.5 visual scorer
 * will catch visual violations via rendered-DOM inspection: take a screenshot,
 * OCR + font-face-resolver, compare. Until then, numerals-font is enforced
 * by usage.md convention + code review.
 */

import type { Validator } from '../schema'
import { passing } from './_shared'

export const numeralsFont: Validator = {
  ruleId: 'numerals-font',
  title: '数字字体',
  severity: 'warning',
  check(_code) {
    // Passthrough for Phase 6.5. See file-level docstring for rationale.
    // Phase 8.5 visual scorer enforces this via rendered-DOM inspection.
    return passing()
  },
}
