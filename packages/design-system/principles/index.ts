/**
 * @yami/design-system/principles — public entry
 *
 * Re-exports the principles index, types, AND the unified validateDesign()
 * runner that executes every principle's validator against a code string.
 *
 * Consumers:
 *   design-system Skill offline evaluation
 *   repository checks — principles and runtime-validator consistency
 */

import { principles, principlesById, ruleIds } from './principles'
import type { ValidationContext, ValidationResult, Violation } from './schema'
import { hasFilePragma } from './validators/_shared'

export type { PrincipleRuleId } from './principles'
export type {
  Principle,
  Severity,
  SourceLocation,
  ValidationContext,
  ValidationResult,
  Validator,
  Violation,
} from './schema'
export { principles, principlesById, ruleIds }

/**
 * Run every principle's validator against `code` and aggregate violations.
 *
 * Returns one ValidationResult with violations sorted by (severity DESC,
 * line ASC). pass=true iff there are zero error-level violations (warnings
 * don't fail the result).
 *
 * Consumers that want stricter pass semantics (e.g. "fail on any warning")
 * should inspect result.violations directly.
 */
export function validateDesign(code: string, context?: ValidationContext): ValidationResult {
  const all: Violation[] = []
  for (const principle of principles) {
    const validator = principle.validator
    if (!validator) continue // skip unbound (shouldn't happen post-6.5)
    // File-level pragma — author opt-out for intentional exceptions.
    if (hasFilePragma(code, principle.ruleId)) continue
    try {
      const out = validator.check(code, context)
      all.push(...out.violations)
    } catch (err) {
      // Validator threw — surface as a warning with the error message rather
      // than crashing the whole validation pass.
      all.push({
        ruleId: principle.ruleId,
        message: `Validator for '${principle.ruleId}' threw: ${err instanceof Error ? err.message : String(err)}`,
        severity: 'warning',
        locations: [],
      })
    }
  }

  all.sort((a, b) => {
    const severityRank: Record<string, number> = { error: 0, warning: 1, info: 2 }
    const sa = severityRank[a.severity] ?? 3
    const sb = severityRank[b.severity] ?? 3
    if (sa !== sb) return sa - sb
    const la = a.locations[0]?.line ?? 0
    const lb = b.locations[0]?.line ?? 0
    return la - lb
  })

  const hasError = all.some((v) => v.severity === 'error')
  return { pass: !hasError, violations: all }
}

/**
 * Run a single named principle's validator.
 * Throws if ruleId isn't registered.
 */
export function checkPrinciple(
  ruleId: string,
  code: string,
  context?: ValidationContext,
): ValidationResult {
  const principle = principlesById[ruleId]
  if (!principle) {
    throw new Error(`Unknown ruleId: '${ruleId}'. Known: ${ruleIds.join(', ')}`)
  }
  if (!principle.validator) {
    throw new Error(`Principle '${ruleId}' has no validator bound.`)
  }
  if (hasFilePragma(code, ruleId)) return { pass: true, violations: [] }
  return principle.validator.check(code, context)
}
