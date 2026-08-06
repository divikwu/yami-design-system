/**
 * card-no-border — Cards default to no border; bordered=true only in
 * documented dense-grid contexts.
 *
 * Static check: find <Card bordered> (or <Card bordered={true}>) and
 * emit a soft warning. Can't statically verify "this is a dense grid
 * context" — that's a judgment call. Warning-level lets authors
 * knowingly use bordered in dense grids (Cart item rows, etc.) without
 * being blocked; a reviewer confirms the context.
 */

import type { Validator, Violation } from '../schema'
import { findJsxElements, result } from './_shared'

export const cardNoBorder: Validator = {
  ruleId: 'card-no-border',
  title: 'Card 无默认边框',
  severity: 'warning',
  check(code) {
    const violations: Violation[] = []
    for (const hit of findJsxElements(code, /Card/)) {
      if (hit.props.bordered === true || hit.props.bordered === 'true') {
        violations.push({
          ruleId: 'card-no-border',
          message:
            '<Card bordered> used — confirm this is a dense listing grid (e.g. cart items). Elsewhere, prefer the default no-border, no-shadow Card.',
          severity: 'warning',
          locations: [hit.location],
          suggestion:
            'If this Card sits among others with visible gaps, drop `bordered` and let surface color, spacing, and whitespace do the separation. Bordered Cards are for dense-grid contexts only.',
        })
      }
    }
    return result(violations)
  },
}
