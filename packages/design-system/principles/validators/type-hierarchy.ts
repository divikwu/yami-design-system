/**
 * type-hierarchy — max 4 distinct font-size tokens per file.
 *
 * Static check: enumerate unique --font-size-* references. If > 4, warn.
 *
 * The rule is "per page", not "per file". Static analysis can't know what
 * assembles into a page, so we approximate at file level. For templates
 * (pages/templates/web/*.tsx), this is exact — templates ARE the page.
 * For primitive components, the count may be < 4 which is fine.
 *
 * Legitimate exceeds: a page that enumerates every type scale for docs
 * (e.g. the design-system docs site typography page) — exempt via filename
 * check.
 */

import type { ValidationContext, Validator, Violation } from '../schema'
import { findAll, result } from './_shared'

const FONT_SIZE_REF = /var\(\s*(--font-size-[a-z0-9-]+)/gi

const EXEMPT_FILENAME_MARKERS = [
  'typography.mdx',
  'type-scale.mdx',
  '/docs/',
  'examples.tsx',
  '/stories/',
  '.stories.tsx',
]

const MAX_LEVELS = 4

export const typeHierarchy: Validator = {
  ruleId: 'type-hierarchy',
  title: '字体层级上限',
  severity: 'warning',
  check(code, context?: ValidationContext) {
    if (context?.filename && EXEMPT_FILENAME_MARKERS.some((m) => context.filename?.includes(m))) {
      return { pass: true, violations: [] }
    }

    const hits = findAll(code, FONT_SIZE_REF)
    const unique = new Map<string, (typeof hits)[number]>()
    for (const hit of hits) {
      const name = hit.groups[0]
      if (name && !unique.has(name)) unique.set(name, hit)
    }

    if (unique.size <= MAX_LEVELS) return { pass: true, violations: [] }

    const names = [...unique.keys()].sort()
    // Flag the first usage of each level past the 4th (the overflow).
    const overflow = names.slice(MAX_LEVELS)
    const violations: Violation[] = overflow.map((name) => {
      const hit = unique.get(name)
      return {
        ruleId: 'type-hierarchy',
        message: `Type hierarchy exceeds max ${MAX_LEVELS} levels. Unique font-size tokens: ${names.length} (${names.join(', ')}).`,
        severity: 'warning' as const,
        locations: hit ? [hit.location] : [],
        suggestion: `Consolidate to at most ${MAX_LEVELS} levels per page. Merge semantically-similar sizes (e.g. body-md + caption-md → body-md). Distinct type tiers compete for visual authority.`,
      }
    })
    return result(violations)
  },
}
