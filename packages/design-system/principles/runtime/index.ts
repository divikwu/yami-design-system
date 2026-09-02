/**
 * @yami/design-system/principles/runtime — public entry
 *
 * Runtime validators check live DOM computed state (getBoundingClientRect,
 * getComputedStyle, etc.) to catch violations that AST validators cannot:
 * rendered sizes, font resolution, conditional visibility, CSS cascade.
 *
 * Consumers:
 *   Phase 8 Edit Mode — re-validate after user tweaks token values
 *   Phase 8.5 Playwright visual scorer — full browser rendering checks
 */

import type { RuntimeValidationResult, RuntimeValidator } from './schema'

// ─── Validator imports ───────────────────────────────────────────

import { borderStrength } from './validators/border-strength'
import { cardNoBorder } from './validators/card-no-border'
import { elevationOnPress } from './validators/elevation-on-press'
import { emphasisLimit } from './validators/emphasis-limit'
import { focusStyle } from './validators/focus-style'
import { noCustomRadii } from './validators/no-custom-radii'
import { noOpacityDisabled } from './validators/no-opacity-disabled'
import { numeralsFont } from './validators/numerals-font'
import { redUsage } from './validators/red-usage'
import { semanticColorOnly } from './validators/semantic-color-only'
import { tapTarget } from './validators/tap-target'
import { typeHierarchy } from './validators/type-hierarchy'

// ─── Type exports ────────────────────────────────────────────────

export type {
  RuntimeValidationResult,
  RuntimeValidator,
  RuntimeViolation,
  Severity,
} from './schema'

// ─── Individual validator exports (for fine-grained usage) ───────

export { borderStrength } from './validators/border-strength'
export { cardNoBorder } from './validators/card-no-border'
export { elevationOnPress } from './validators/elevation-on-press'
export { emphasisLimit } from './validators/emphasis-limit'
export { focusStyle } from './validators/focus-style'
export { noCustomRadii } from './validators/no-custom-radii'
export { noOpacityDisabled } from './validators/no-opacity-disabled'
export { numeralsFont } from './validators/numerals-font'
export { redUsage } from './validators/red-usage'
export { semanticColorOnly } from './validators/semantic-color-only'
export { tapTarget } from './validators/tap-target'
export { typeHierarchy } from './validators/type-hierarchy'

// ─── Registry ────────────────────────────────────────────────────

/** P2 stubs — these return [] and are counted as skipped. */
const STUB_RULE_IDS = new Set([
  'red-usage',
  'semantic-color-only',
  'no-custom-radii',
  'border-strength',
  'card-no-border',
  'elevation-on-press',
])

/**
 * All 12 runtime validators in priority order (P0 → P1 → P2).
 * 3 rules excluded from runtime (no-emoji, no-decorative-media, token-exists)
 * because they have no additional value over AST checks.
 */
export const runtimeValidators: readonly RuntimeValidator[] = [
  // P0 — must have real implementation
  tapTarget,
  emphasisLimit,
  // P1 — should have real implementation
  numeralsFont,
  typeHierarchy,
  focusStyle,
  noOpacityDisabled,
  // P2 — stubs (Phase 8.5)
  redUsage,
  semanticColorOnly,
  noCustomRadii,
  borderStrength,
  cardNoBorder,
  elevationOnPress,
]

// ─── Unified runner ──────────────────────────────────────────────

/**
 * Run all runtime validators against a DOM subtree and aggregate results.
 *
 * @param root - The DOM element or document to validate (typically document.body)
 * @param options.ruleIds - Optional filter: only run these rule IDs
 * @returns Aggregated result with violations, counts, and timing
 */
export function validateRuntime(
  root: Element | Document,
  options?: { ruleIds?: string[] },
): RuntimeValidationResult {
  const start = performance.now()
  const allViolations: RuntimeValidationResult['violations'] = []
  let checkedCount = 0
  let skippedCount = 0

  const filter = options?.ruleIds ? new Set(options.ruleIds) : null

  for (const validator of runtimeValidators) {
    // Apply optional filter
    if (filter && !filter.has(validator.ruleId)) continue

    // Count stubs as skipped
    if (STUB_RULE_IDS.has(validator.ruleId)) {
      skippedCount += 1
      continue
    }

    try {
      const violations = validator.check(root)
      allViolations.push(...violations)
      checkedCount += 1
    } catch (err) {
      // Validator threw — surface as a warning rather than crashing
      allViolations.push({
        ruleId: validator.ruleId,
        message: `Runtime validator '${validator.ruleId}' threw: ${err instanceof Error ? err.message : String(err)}`,
        severity: 'warning',
        selector: '',
      })
      checkedCount += 1
    }
  }

  // Sort: errors first, then warnings, then info
  const severityRank: Record<string, number> = { error: 0, warning: 1, info: 2 }
  allViolations.sort((a, b) => {
    const sa = severityRank[a.severity] ?? 3
    const sb = severityRank[b.severity] ?? 3
    return sa - sb
  })

  const hasError = allViolations.some((v) => v.severity === 'error')

  return {
    pass: !hasError,
    violations: allViolations,
    checkedCount,
    skippedCount,
    durationMs: performance.now() - start,
  }
}
