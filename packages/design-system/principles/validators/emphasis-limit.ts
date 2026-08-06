/**
 * emphasis-limit — at most 1 Button variant="emphasis" per screen.
 *
 * Static check: within the code string passed to validate_design (typically
 * one page-level component or route file), count <Button variant="emphasis" />
 * occurrences. If > 1, flag all but the first.
 *
 * Limitation: can't know for sure whether all occurrences render on the
 * same viewport (could be in conditional branches). The check flags the
 * maximum-observed count; authors can suppress false positives by
 * demonstrating the branches are mutually exclusive.
 *
 * CSS-level counterpart: if a .module.css defines .emphasis class with
 * --button-emphasis background, that's a single class reused across
 * invocations — not flagged here.
 */

import type { ValidationContext, Validator, Violation } from '../schema'
import { findJsxElements, result } from './_shared'

// Component examples files are palettes of variants, not renderings of a
// single screen. Each example typically renders alone in the Playground.
const EXEMPT_FILENAME_MARKERS = ['examples.tsx', '/stories/', '.stories.tsx']

export const emphasisLimit: Validator = {
  ruleId: 'emphasis-limit',
  title: 'Emphasis 数量',
  severity: 'error',
  check(code, context?: ValidationContext) {
    if (context?.filename && EXEMPT_FILENAME_MARKERS.some((m) => context.filename?.includes(m))) {
      return { pass: true, violations: [] }
    }
    const hits = findJsxElements(code, /Button/).filter((h) => h.props.variant === 'emphasis')
    if (hits.length <= 1) return { pass: true, violations: [] }

    // Flag every occurrence after the first; first remains the canonical CTA.
    const violations: Violation[] = hits.slice(1).map((hit) => ({
      ruleId: 'emphasis-limit',
      message: `Multiple <Button variant="emphasis"> on the same screen (${hits.length} found). Rule emphasis-limit allows exactly 1.`,
      severity: 'error' as const,
      locations: [hit.location],
      suggestion:
        'Only the single most important CTA should be variant="emphasis". Make secondary actions variant="primary" (black) or variant="secondary" (grey). If you need two equally-important actions, the page has a hierarchy problem — split into two screens or rethink the flow.',
    }))
    return result(violations)
  },
}
