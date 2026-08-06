#!/usr/bin/env node
/**
 * check-sync.ts — three-way consistency check for design principles.
 *
 * Verifies that the same set of rule-ids appears in:
 *   1. DESIGN.md             — markers `<!-- rule-id: <slug> -->`
 *   2. principles.ts          — `ruleId: '<slug>'` entries
 *   3. validators/<slug>.ts   — file names (excluding _shared.ts)
 *
 * Exits 0 if all three sets are identical; exits 1 with a diff otherwise.
 *
 * Pure FS + regex — no module imports — so it runs on Node 24+ natively
 * (no tsc / tsx / bundler needed). Invoked via `pnpm check:principles-sync`.
 */

import { readFileSync, readdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const yamiRoot = dirname(here)

const DESIGN_MD = join(yamiRoot, 'DESIGN.md')
const PRINCIPLES_TS = join(here, 'principles.ts')
const VALIDATORS_DIR = join(here, 'validators')

function fromDesignMd(): Set<string> {
  const text = readFileSync(DESIGN_MD, 'utf8')
  const ids = new Set<string>()
  // Only count markers that appear on their own line (anchor: real rules
  // sit on a dedicated line; mentions inside prose / inline `code` sit
  // between other characters and should be ignored).
  for (const line of text.split('\n')) {
    const trimmed = line.trim()
    const m = /^<!--\s*rule-id:\s*([a-z0-9-]+)\s*-->$/.exec(trimmed)
    if (m) ids.add(m[1])
  }
  return ids
}

function fromPrinciplesTs(): Set<string> {
  const text = readFileSync(PRINCIPLES_TS, 'utf8')
  const ids = new Set<string>()
  for (const m of text.matchAll(/ruleId:\s*['"]([a-z0-9-]+)['"]/g)) {
    ids.add(m[1])
  }
  return ids
}

function fromValidatorsDir(): Set<string> {
  return new Set(
    readdirSync(VALIDATORS_DIR)
      .filter((f) => f.endsWith('.ts') && !f.startsWith('_'))
      .map((f) => f.slice(0, -3)),
  )
}

const designMd = fromDesignMd()
const principlesTs = fromPrinciplesTs()
const validators = fromValidatorsDir()

// For each rule-id that appears in any of the 3 sources, emit ONE line
// summarising exactly which sources are missing it.
const universe = new Set<string>([...designMd, ...principlesTs, ...validators])
const issues: string[] = []
for (const id of [...universe].sort()) {
  const inMd = designMd.has(id)
  const inTs = principlesTs.has(id)
  const inVal = validators.has(id)
  if (inMd && inTs && inVal) continue
  const missing = [
    !inMd ? 'DESIGN.md marker' : null,
    !inTs ? 'principles.ts entry' : null,
    !inVal ? `validators/${id}.ts` : null,
  ].filter(Boolean)
  issues.push(`${id} — missing: ${missing.join(', ')}`)
}

if (issues.length === 0) {
  console.log(
    `[32m✓[0m principles-sync OK — ${designMd.size} rules in all three sources (DESIGN.md, principles.ts, validators/)`,
  )
  process.exit(0)
}

console.error('[31m✗ principles-sync FAILED[0m — three-way inconsistency:')
for (const line of issues) console.error(`  · ${line}`)
console.error('')
console.error(`  DESIGN.md         : ${designMd.size} rule-id markers`)
console.error(`  principles.ts     : ${principlesTs.size} ruleId entries`)
console.error(`  validators/       : ${validators.size} <id>.ts files`)
console.error('')
console.error('  Fix by ensuring every rule appears in all three.')
process.exit(1)
