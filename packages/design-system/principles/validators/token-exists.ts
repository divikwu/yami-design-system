/**
 * token-exists — flags `var(--name)` references where `--name` is not
 * declared in the canonical tokens.css.
 *
 * Why this rule exists:
 *   AI code generators (Claude, Cursor, …) reliably invent plausible-
 *   looking token names that don't exist. Example caught in the wild:
 *   `var(--font-size-heading-lg)` — real tokens are `heading-xl` / `md`.
 *   The CSS still parses, the page looks broken, and no other rule
 *   catches it (color / radius / gradient validators only fire on
 *   literals).
 *
 * Strategy:
 *   - Lazily parse tokens.css once per process, build a Set<string>
 *     of declared `--name`s.
 *   - For every `var(--x, …)` in the code under test, check membership.
 *   - Report fabricated names with a suggested list of close matches.
 *
 * Scope:
 *   - Validates CSS, CSS-in-JS string literals, and JSX inline styles.
 *   - Ignores `var(--local-to-this-file)` IF the same file declares it
 *     (covers component-scoped CSS custom properties).
 *
 * Known limits:
 *   - `var(--foo, var(--bar))` fallback chains only check the outer name.
 *     Acceptable at Phase 6.5 (regex-based). Promote to AST in a future
 *     round if nested-fallback abuse appears in eval data.
 */

import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import type { Validator, Violation } from '../schema'
import { findAll, result } from './_shared'

// ─── Token set (lazy, one-shot) ──────────────────────────────────

const THIS_FILE = fileURLToPath(import.meta.url)
const TOKENS_CSS_PATH = resolve(dirname(THIS_FILE), '../../tokens.css')

// Match `--name:` declarations at the start of a line (ignoring whitespace).
const TOKEN_DECL = /^\s*(--[a-z0-9-]+)\s*:/gim

let cachedTokens: Set<string> | null = null

function loadTokens(): Set<string> {
  if (cachedTokens) return cachedTokens
  try {
    const src = readFileSync(TOKENS_CSS_PATH, 'utf8')
    cachedTokens = new Set<string>()
    for (const m of src.matchAll(TOKEN_DECL)) {
      if (m[1]) cachedTokens.add(m[1])
    }
  } catch {
    // If tokens.css can't be read (e.g. running in a test harness without
    // brand assets), fall back to an empty set and short-circuit: an empty
    // set means we can't tell fabricated from real, so we don't fire.
    cachedTokens = new Set<string>()
  }
  return cachedTokens
}

/** Exposed for tests: reset the cache so a test can reload tokens.css. */
export function _resetTokenCache(): void {
  cachedTokens = null
}

// ─── Usage detection ─────────────────────────────────────────────

const VAR_REF = /var\(\s*(--[a-z0-9-]+)/gi

// Strip JS/TS/CSS comments to avoid false positives when docs describe
// hypothetical tokens ("// use var(--fallback) if ..."). Preserves line
// count by replacing with equal-length spaces so error locations stay
// anchored to the original source.
function stripComments(code: string): string {
  return (
    code
      // /* block comments */ (non-greedy, multi-line)
      .replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '))
      // // line comments (to end of line)
      .replace(/\/\/[^\n]*/g, (m) => ' '.repeat(m.length))
  )
}

// ─── Suggestion helper ───────────────────────────────────────────

/**
 * Tiny prefix-based suggester. For `--font-size-heading-lg` against a set
 * containing `--font-size-heading-xl` / `heading-md`, returns the 3 closest
 * by shared prefix length. Good enough to un-stuck the caller.
 */
function suggestNearest(missing: string, valid: Set<string>): string[] {
  const scored: Array<{ name: string; score: number; lenDiff: number }> = []
  for (const name of valid) {
    let shared = 0
    const len = Math.min(missing.length, name.length)
    for (let i = 0; i < len; i += 1) {
      if (missing[i] === name[i]) shared += 1
      else break
    }
    if (shared >= 6) {
      scored.push({
        name,
        score: shared,
        lenDiff: Math.abs(name.length - missing.length),
      })
    }
  }
  // Primary: longer shared prefix. Secondary: closer total length
  // (so `heading-lg` → `heading-xl/md/sm` beats `heading-2xl/3xl/4xl`).
  scored.sort((a, b) => b.score - a.score || a.lenDiff - b.lenDiff)
  return scored.slice(0, 3).map((s) => s.name)
}

// ─── Local-scope detection ───────────────────────────────────────
//
// A file may declare its own `--foo: value` — treat those as valid within
// the same string. Common pattern in CSS Modules and styled components.

function localDeclarations(code: string): Set<string> {
  const out = new Set<string>()
  for (const m of code.matchAll(TOKEN_DECL)) {
    if (m[1]) out.add(m[1])
  }
  return out
}

// ─── Validator ───────────────────────────────────────────────────

export const tokenExists: Validator = {
  ruleId: 'token-exists',
  title: 'Token 必须真实存在',
  severity: 'error',
  check(code) {
    const valid = loadTokens()
    if (valid.size === 0) return result([]) // can't check without baseline

    const scrubbed = stripComments(code)
    const local = localDeclarations(scrubbed)
    const violations: Violation[] = []
    const seenMissing = new Set<string>()

    for (const hit of findAll(scrubbed, VAR_REF)) {
      const name = hit.groups[0]
      if (!name) continue
      if (valid.has(name) || local.has(name)) continue
      if (seenMissing.has(name)) continue // one violation per distinct fabricated token
      seenMissing.add(name)

      const suggestions = suggestNearest(name, valid)
      const suggestion =
        suggestions.length > 0
          ? `Did you mean: ${suggestions.join(', ')}? Or list real tokens via MCP list_tokens.`
          : 'Run MCP list_tokens to see real token names, or declare this as a local custom property if intentional.'

      violations.push({
        ruleId: 'token-exists',
        message: `var(${name}) references a token that is not declared in tokens.css — it looks fabricated.`,
        severity: 'error',
        locations: [hit.location],
        suggestion,
      })
    }

    return result(violations)
  },
}
