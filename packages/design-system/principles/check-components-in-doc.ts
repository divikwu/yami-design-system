#!/usr/bin/env node
/**
 * check-components-in-doc.ts — two-way consistency between
 * DESIGN.md's Components section and the components/ directory.
 *
 * Verifies:
 *   1. Every component listed in DESIGN.md (matched by the
 *      `### <Name> — \`components/<Name>/\`` heading pattern) has a
 *      corresponding components/<Name>/meta.json on disk.
 *   2. Every components/<Name>/meta.json on disk is listed in the doc.
 *
 * Catches drift in either direction: a component shipped without spec
 * documentation, or a doc entry pointing at a missing / renamed component.
 *
 * Pure FS + regex — Node 24+ native — no deps.
 */

import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const yamiRoot = dirname(here)

const DESIGN_SPEC = join(yamiRoot, 'DESIGN.md')
const COMPONENTS_DIR = join(yamiRoot, 'components')

// `### Button — `components/Button/`` — name in heading must match path
// (backreference \1 enforces this).
const HEADING_RE = /^### (\w+) — `components\/\1\/`/gm

function fromSpecDoc(): Set<string> {
  const text = readFileSync(DESIGN_SPEC, 'utf8')
  const names = new Set<string>()
  for (const m of text.matchAll(HEADING_RE)) names.add(m[1])
  return names
}

function fromComponentsDir(): Set<string> {
  const names = new Set<string>()
  for (const entry of readdirSync(COMPONENTS_DIR)) {
    const fullPath = join(COMPONENTS_DIR, entry)
    if (!statSync(fullPath).isDirectory()) continue
    const meta = join(fullPath, 'meta.json')
    if (!existsSync(meta)) continue
    names.add(entry)
  }
  return names
}

const doc = fromSpecDoc()
const fs = fromComponentsDir()

const universe = new Set<string>([...doc, ...fs])
const issues: string[] = []
for (const name of [...universe].sort()) {
  const inDoc = doc.has(name)
  const inFs = fs.has(name)
  if (inDoc && inFs) continue
  if (!inDoc) issues.push(`${name} — missing: DESIGN.md heading "### ${name} — \`components/${name}/\`"`)
  if (!inFs) issues.push(`${name} — missing: components/${name}/meta.json`)
}

if (issues.length === 0) {
  console.log(
    `[32m✓[0m components-in-doc OK — ${doc.size} components in both DESIGN.md and components/`,
  )
  process.exit(0)
}

console.error(`[31m✗ components-in-doc FAILED[0m — two-way inconsistency:`)
for (const line of issues) console.error(`  · ${line}`)
console.error('')
console.error(`  DESIGN.md           : ${doc.size} component headings`)
console.error(`  components/<x>/     : ${fs.size} directories with meta.json`)
console.error('')
console.error('  Fix by ensuring every component appears in both, with matching name.')
process.exit(1)
