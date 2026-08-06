/**
 * no-emoji — flags emoji characters in source code.
 *
 * Targets the supplementary-plane emoji set (U+1F300+). Does NOT flag
 * BMP pictograms like ★ (U+2605) which are Unicode symbols used legitimately
 * in product UI (ProductCard rating). See _shared.EMOJI_RANGE docs.
 *
 * Exceptions: none enforceable statically. Authoring docs that intentionally
 * use ✅/❌ in markdown comments should exclude themselves from validation
 * (validate_design only receives component code, not README / ADR files).
 */

import type { Validator, Violation } from '../schema'
import { EMOJI_RANGE, findAll, result } from './_shared'

export const noEmoji: Validator = {
  ruleId: 'no-emoji',
  title: 'UI 禁用 emoji',
  severity: 'error',
  check(code) {
    const violations: Violation[] = findAll(code, EMOJI_RANGE).map((hit) => ({
      ruleId: 'no-emoji',
      message: `Emoji '${hit.match}' is not allowed in product UI.`,
      severity: 'error' as const,
      locations: [hit.location],
      suggestion:
        'Replace with an SVG icon from @ds/icons (see assets/icons/). For pictograms like ★, use the existing BMP symbol, not an emoji equivalent.',
    }))
    return result(violations)
  },
}
