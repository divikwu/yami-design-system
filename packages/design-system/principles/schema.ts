/**
 * Zod schemas for design principles (rule definitions + validation results).
 *
 * The three-way contract (see docs/adr/ ADR-0012):
 * - design.md declares rules with <!-- rule-id: xxx --> markers (SSOT)
 * - principles.ts is a manually-maintained index (this file's Principle[])
 * - validators/<rule-id>.ts implements the AST check
 *
 * check:principles-sync CI script enforces three-way consistency.
 *
 * NOTE: Zod 4.x is not yet installed (Phase 0 scaffold). These types
 * are structural-only for now; Phase 6.5 will add runtime schema validation.
 */

// Severity of a principle violation
export type Severity = 'error' | 'warning' | 'info'

// Validation result returned by a Validator's check() function
export interface Violation {
  ruleId: string
  message: string
  severity: Severity
  locations: SourceLocation[]
  suggestion?: string
}

export interface SourceLocation {
  line: number
  column: number
  length?: number
}

export interface ValidationResult {
  pass: boolean
  violations: Violation[]
}

// A validator is a pure function that inspects code and returns violations
export interface Validator {
  ruleId: string
  title: string
  severity: Severity
  check(code: string, context?: ValidationContext): ValidationResult
}

export interface ValidationContext {
  // Filename (helpful for path-based rules like "only in packages/brand/")
  filename?: string
  // Project root to resolve imports
  projectRoot?: string
  // Platform target (web / ios / android / ...) for platform-specific rules
  platform?: 'web' | 'ios' | 'android' | 'react-native' | 'flutter' | 'miniprogram'
}

// Principle: declarative metadata + bound validator
export interface Principle {
  ruleId: string
  title: string
  severity: Severity
  // Short one-line description; full narrative in design.md section with matching rule-id
  description: string
  // Optional: reference to validator (Phase 6.5 will populate; Phase 0 scaffolds schema only)
  validator?: Validator
}
