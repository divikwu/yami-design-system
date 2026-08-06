/**
 * Runtime validator types — browser DOM computed-state checks.
 *
 * These complement the AST validators (../validators/) which operate on
 * source code strings. Runtime validators operate on live DOM elements
 * and use getBoundingClientRect, getComputedStyle, etc. to verify
 * rendered state.
 *
 * Consumers:
 *   Phase 8 Edit Mode — after user tweaks a token value, runtime
 *   validators re-check the DOM to ensure compliance.
 */

// ─── Severity (shared with AST schema, re-declared to keep runtime self-contained) ───

export type Severity = 'error' | 'warning' | 'info'

// ─── Runtime Validator interface ─────────────────────────────────

export interface RuntimeValidator {
  ruleId: string
  title: string
  severity: Severity
  /**
   * Check a DOM subtree. `root` is typically `document.body` or a section.
   * Returns violations found. Empty array = pass.
   */
  check(root: Element | Document): RuntimeViolation[]
}

// ─── Runtime Violation ───────────────────────────────────────────

export interface RuntimeViolation {
  ruleId: string
  message: string
  severity: Severity
  /** data-yami-id of the violating element (if present) */
  yamiId?: string
  /** CSS selector path for locating the element */
  selector: string
  /** DOM reference to the violating element (for Edit Mode highlighting) */
  element?: Element
  suggestion?: string
  /** Measured data for debugging (e.g. tap-target actual dimensions) */
  measured?: Record<string, unknown>
}

// ─── Aggregated result ───────────────────────────────────────────

export interface RuntimeValidationResult {
  /** true iff zero error-level violations */
  pass: boolean
  violations: RuntimeViolation[]
  /** How many validators ran */
  checkedCount: number
  /** How many validators were skipped (stubs) */
  skippedCount: number
  /** Total wall-clock time in milliseconds */
  durationMs: number
}
