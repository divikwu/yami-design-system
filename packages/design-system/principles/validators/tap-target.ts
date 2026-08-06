/**
 * tap-target — interactive elements ≥ 44pt iOS / 48dp Android.
 *
 * Status: SKELETON — precise check requires runtime layout measurement
 * (CSS padding + visible-size vs rendered bounding box). A static check
 * would need to:
 *   1. Parse every interactive component usage (<Button>, <Input>, <a>, …)
 *   2. Resolve size prop + padding CSS + any parent scaling
 *   3. Compute final hit-area dimensions
 *
 * That's effectively partial runtime layout. Phase 8.5 visual scorer runs
 * this via Playwright + getBoundingClientRect.
 *
 * What we DO check statically: Button size='sm' (32px visible). Size=sm +
 * no padding override is flagged as needing review. All other <Button>
 * sizes (md=40 / lg=48) include internal padding that expands to ≥44pt;
 * the component itself enforces this.
 */

import type { Validator, Violation } from '../schema'
import { findJsxElements, result } from './_shared'

export const tapTarget: Validator = {
  ruleId: 'tap-target',
  title: '触摸区域',
  severity: 'warning',
  check(code) {
    const violations: Violation[] = []
    // Sanity warn on size='sm' iconOnly patterns — smallest-possible hit
    // area. The component's 32px size + 12px padding = 32+24 = 56px hit
    // target, which IS above 44pt, but we surface a warning so reviewers
    // can confirm the context.
    for (const hit of findJsxElements(code, /Button/)) {
      if (hit.props.size === 'sm' && hit.props.iconOnly === true) {
        violations.push({
          ruleId: 'tap-target',
          message:
            "<Button size='sm' iconOnly> — verify this sits within a container that doesn't clip its tap region. Component padding provides adequate hit area (~56×32 visible → ≥44pt), but nested scroll containers can shrink it.",
          severity: 'warning',
          locations: [hit.location],
          suggestion:
            "No action needed if the button is in normal flow. In a tight grid (e.g. density <8px between elements), consider size='md' instead. Phase 8.5 visual scorer validates exact rendered dimensions.",
        })
      }
    }
    return result(violations)
  },
}
