/**
 * Shared utilities for design-principle validators.
 *
 * Strategic decision: Phase 6.5 uses regex-based static checks, NOT full
 * AST parsing. Rationale:
 *   - Most rules are string-level patterns (find `linear-gradient`, find
 *     emoji, find `opacity` inside `:disabled`). A full AST adds @babel/parser
 *     as a heavyweight runtime dep for small incremental accuracy.
 *   - validate_design (Phase 7) receives code strings from Claude. Regex
 *     returns fast, explainable results.
 *   - Rules that genuinely need AST (scoped counting, variable tracking)
 *     are marked with a TODO and defer to a future commit or Phase 8.5
 *     runtime scorer.
 *
 * All helpers return {line, column} in 1-based coordinates (editor convention).
 */

import type { SourceLocation, ValidationContext, ValidationResult, Violation } from '../schema'

// ─── Line / column tracking ──────────────────────────────────────

/** Convert a character offset into {line, column} (1-based). */
export function offsetToLocation(code: string, offset: number, length?: number): SourceLocation {
  let line = 1
  let column = 1
  for (let i = 0; i < offset && i < code.length; i += 1) {
    if (code[i] === '\n') {
      line += 1
      column = 1
    } else {
      column += 1
    }
  }
  return { line, column, length }
}

// ─── Match iteration ─────────────────────────────────────────────

export interface MatchHit {
  match: string
  index: number
  groups: (string | undefined)[]
  location: SourceLocation
}

/** Iterate all matches of a regex in code with line/col annotations. */
export function findAll(code: string, pattern: RegExp): MatchHit[] {
  const flags = pattern.flags.includes('g') ? pattern.flags : `${pattern.flags}g`
  const re = new RegExp(pattern.source, flags)
  const hits: MatchHit[] = []
  for (const m of code.matchAll(re)) {
    hits.push({
      match: m[0],
      index: m.index,
      groups: m.slice(1),
      location: offsetToLocation(code, m.index, m[0].length),
    })
  }
  return hits
}

// ─── CSS-aware helpers ───────────────────────────────────────────

/**
 * Find CSS rule blocks whose selector matches `selectorPattern`.
 * Returns the block body + absolute offset of the body's opening brace.
 *
 * Note: not a full CSS parser; assumes selectors and bodies are simple
 * (no nested at-rules in the body beyond single level). Good enough
 * for the common cases our rules target (:hover, :disabled, :focus-visible).
 */
export interface CssBlock {
  selector: string
  body: string
  /** Offset of the body (right after `{`) in the original source. */
  bodyStart: number
  /** Location of the selector start. */
  location: SourceLocation
}

export function findCssBlocks(code: string, selectorPattern: RegExp): CssBlock[] {
  const out: CssBlock[] = []
  const flags = selectorPattern.flags.includes('g')
    ? selectorPattern.flags
    : `${selectorPattern.flags}g`
  const re = new RegExp(selectorPattern.source, flags)
  for (const m of code.matchAll(re)) {
    const braceOpen = code.indexOf('{', m.index + m[0].length)
    if (braceOpen === -1) break
    let depth = 1
    let i = braceOpen + 1
    while (i < code.length && depth > 0) {
      if (code[i] === '{') depth += 1
      else if (code[i] === '}') depth -= 1
      i += 1
    }
    out.push({
      selector: m[0],
      body: code.slice(braceOpen + 1, i - 1),
      bodyStart: braceOpen + 1,
      location: offsetToLocation(code, m.index, m[0].length),
    })
  }
  return out
}

// ─── JSX-aware helpers ───────────────────────────────────────────

export interface JsxElementHit {
  tag: string
  /** Raw props string (everything between <Tag and /> or >). */
  propsRaw: string
  /** Parsed prop values (strings and boolean-shorthand only; no expressions). */
  props: Record<string, string | true>
  location: SourceLocation
  index: number
}

/**
 * Find <Tag .../> or opening <Tag ...> elements. Does NOT match
 * closing tags. Parses simple prop values (strings, shorthand booleans,
 * {expressionAsString}); ignores complex expressions (props: {{...}} etc).
 */
export function findJsxElements(code: string, tagPattern: RegExp): JsxElementHit[] {
  const out: JsxElementHit[] = []
  // Match <TagName + any attrs + (>|/>)
  const source = `<(${tagPattern.source})\\b([^>]*?)(/?>)`
  const re = new RegExp(source, 'g')
  for (const m of code.matchAll(re)) {
    const tag = m[1] ?? ''
    const propsRaw = m[2] ?? ''
    out.push({
      tag,
      propsRaw,
      props: parseJsxProps(propsRaw),
      location: offsetToLocation(code, m.index, m[0].length),
      index: m.index,
    })
  }
  return out
}

/** Minimal JSX prop parser — handles string literals + boolean shorthand. */
function parseJsxProps(raw: string): Record<string, string | true> {
  const out: Record<string, string | true> = {}
  // name="value" or name='value'
  for (const m of raw.matchAll(/(\w[\w-]*)\s*=\s*["']([^"']*)["']/g)) {
    if (m[1]) out[m[1]] = m[2] ?? ''
  }
  // name={expression} — just capture the expression text (no eval)
  for (const m of raw.matchAll(/(\w[\w-]*)\s*=\s*\{([^{}]*)\}/g)) {
    if (m[1] && !(m[1] in out)) out[m[1]] = (m[2] ?? '').trim()
  }
  // Boolean shorthand: `name` with no =
  for (const m of raw.matchAll(/(?:^|\s)(\w[\w-]*)(?=\s|$)/g)) {
    const name = m[1]
    if (name && !(name in out)) out[name] = true
  }
  return out
}

// ─── Result construction helpers ─────────────────────────────────

/** Passthrough success result (no violations). */
export function passing(): ValidationResult {
  return { pass: true, violations: [] }
}

/** Build a ValidationResult from a list of violations. */
export function result(violations: Violation[]): ValidationResult {
  return { pass: violations.length === 0, violations }
}

/** Context-aware platform skip. */
export function skipForPlatform(
  context: ValidationContext | undefined,
  applicablePlatforms: string[],
): boolean {
  if (!context?.platform) return false
  return !applicablePlatforms.includes(context.platform)
}

// ─── Inline suppression pragmas ──────────────────────────────────
//
// Author opt-out for known-intentional exceptions. Supports two forms:
//
//   File-level (anywhere in source):
//     /* yami-validate-disable: rule-id-1, rule-id-2 */
//     /* yami-validate-disable-next-line: rule-id */ → suppresses on the
//                                                      immediately following line
//
// The file-level pragma suppresses ALL violations for the listed rule-ids
// across the whole file. Use sparingly; each pragma should be accompanied
// by a comment explaining the reason.

const FILE_PRAGMA_RE = /\/\*\s*yami-validate-disable:\s*([a-z0-9-,\s]+?)\s*\*\//i

/** Returns true if `code` contains a file-level disable pragma for `ruleId`. */
export function hasFilePragma(code: string, ruleId: string): boolean {
  const m = FILE_PRAGMA_RE.exec(code)
  if (!m) return false
  const disabled = (m[1] ?? '').split(',').map((s) => s.trim())
  return disabled.includes(ruleId)
}

// ─── Token / value detection ─────────────────────────────────────

/** Matches a CSS hex color of 3 / 6 / 8 digits. */
export const HEX_COLOR = /#[0-9a-f]{3,8}\b/gi

/** Matches a `rgb()` / `rgba()` color (loose). */
export const RGB_COLOR = /rgba?\(\s*[^)]*\)/gi

/** Matches a CSS variable reference like var(--foo-bar). */
export const CSS_VAR = /var\(\s*(--[a-z0-9-]+)(?:\s*,\s*[^)]*)?\s*\)/gi

/** Allowed radius token names — primitives + semantic aliases. Kept in sync
 * with tokens/primitives/radius.tokens.json + tokens/semantic/radius.tokens.json. */
export const ALLOWED_RADIUS_TOKENS = new Set([
  // Primitives
  '--radius-none',
  '--radius-sm',
  '--radius-md',
  '--radius-lg',
  '--radius-xl',
  '--radius-full',
  // Semantic aliases
  '--radius-surface-default',
  '--radius-surface-none',
  '--radius-component-default',
  '--radius-component-none',
  '--radius-button-emphasis',
  '--radius-button-primary',
  '--radius-tag-primary',
])

/**
 * Emoji Unicode ranges — supplementary plane pictographs.
 * U+1F300–U+1FAFF covers the modern emoji blocks (Misc Symbols & Pictographs,
 * Emoticons, Transport, Food, Flags, etc.).
 *
 * Deliberately excludes BMP symbols (U+2600–U+27BF range). ★ (U+2605), ♥ (U+2665),
 * ♦ (U+2666) are Unicode pictograms that predate emoji and read as "characters"
 * in text contexts — design.md's no-emoji rule targets the pictographic
 * emoji set, not every BMP symbol.
 *
 * If a future rule wants stricter "no BMP pictograms either", it should
 * introduce a separate range with an explicit allowlist for ★.
 */
export const EMOJI_RANGE = /[\u{1F300}-\u{1FAFF}]/gu
