#!/usr/bin/env node
/**
 * check-tokens-in-docs.ts — verify every `var(--x)` / bare `--x` token
 * reference inside our DS documentation actually exists in tokens.css.
 *
 * Catches the systematic AI-author failure mode: fabricating plausible-but-
 * fake token names like `--font-size-heading-lg` when only `-md` / `-xl` exist.
 *
 * Scope (markdown files scanned):
 *   - DESIGN.md / DESIGN.compact.md
 *     (DESIGN.extended.md was merged into DESIGN.md in v0.2.0-alpha.2)
 *   - SKILL.md (when present)
 *   - content/**​/*.md
 *
 * Exclusions (these don't fail the check):
 *   - YAML frontmatter — metadata, not token references
 *   - Lines starting with ✗ or ❌ — inline anti-pattern markers
 *   - Blocks wrapped in `<!-- anti-pattern -->` ... `<!-- /anti-pattern -->`
 *   - Token names matching the PLACEHOLDERS set (`--x`, `--name`, ...)
 *   - Tokens whose source appears as family-pattern `--xxx-*` / `--xxx-?`
 *     (the regex word-boundary rejects these automatically)
 *
 * Scan rules:
 *   - `var(--xxx)` — matched anywhere on a line
 *   - bare `--xxx` — matched only inside inline backticks (` `x` `) or
 *     inside fenced code blocks (``` ``` ```)
 *
 * Pure FS + regex, runs on Node 24+ natively. No external deps.
 */

import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs'
import { dirname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const yamiRoot = dirname(here)

const PLACEHOLDERS = new Set([
  '--x', '--y', '--z', '--n',
  '--xy', '--xx',
  '--name', '--var', '--var-name',
  '--your-token', '--fake-token', '--my-token',
  '--foo', '--bar', '--baz',
])

interface Hit {
  file: string
  line: number
  token: string
  source: 'var()' | 'backtick' | 'fence'
}

function parseTokensCss(): Set<string> {
  const text = readFileSync(join(yamiRoot, 'tokens.css'), 'utf8')
  const tokens = new Set<string>()
  for (const m of text.matchAll(/^\s*(--[a-z][a-z0-9-]+)\s*:/gm)) tokens.add(m[1])
  return tokens
}

function findDocFiles(): string[] {
  const files: string[] = []

  for (const f of readdirSync(yamiRoot)) {
    if (/^DESIGN.*\.md$/.test(f)) files.push(join(yamiRoot, f))
    if (f === 'SKILL.md') files.push(join(yamiRoot, f))
  }

  const contentDir = join(yamiRoot, 'content')
  if (existsSync(contentDir) && statSync(contentDir).isDirectory()) {
    for (const f of readdirSync(contentDir)) {
      if (f.endsWith('.md')) files.push(join(contentDir, f))
    }
  }

  return files.sort()
}

const TOKEN_RE = /(?<![a-z0-9-])(--[a-z][a-z0-9-]*[a-z0-9])(?![a-z0-9-])/g
const VAR_RE = /var\(\s*(--[a-z][a-z0-9-]*[a-z0-9])\s*\)/g
const FENCE_RE = /^\s*```/
const SKIP_LINE_RE = /^\s*[✗❌]/
const ANTI_PATTERN_BLOCK_RE = /<!--\s*anti-pattern\s*-->[\s\S]*?<!--\s*\/anti-pattern\s*-->/g

function checkDoc(path: string, declared: Set<string>): Hit[] {
  const text = readFileSync(path, 'utf8')

  // Strip leading YAML frontmatter
  let body = text
  let lineOffset = 0
  const fm = /^---\n([\s\S]*?)\n---\n?/.exec(text)
  if (fm) {
    body = text.slice(fm[0].length)
    lineOffset = fm[0].split('\n').length - 1
  }

  // Erase content inside <!-- anti-pattern --> ... <!-- /anti-pattern -->
  // (handles inline, multi-line, and block forms uniformly). We preserve
  // newlines so line numbers stay accurate; everything else becomes spaces.
  body = body.replace(ANTI_PATTERN_BLOCK_RE, (m) => m.replace(/[^\n]/g, ' '))

  const lines = body.split('\n')
  const seen = new Set<string>()
  const hits: Hit[] = []

  let inFence = false

  function recordHit(tok: string, lineNo: number, source: Hit['source']) {
    if (PLACEHOLDERS.has(tok)) return
    if (declared.has(tok)) return
    const key = `${path}:${lineNo}:${tok}:${source}`
    if (seen.has(key)) return
    seen.add(key)
    hits.push({ file: path, line: lineNo, token: tok, source })
  }

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i]
    const lineNo = i + 1 + lineOffset

    if (FENCE_RE.test(rawLine)) {
      inFence = !inFence
      continue
    }

    if (SKIP_LINE_RE.test(rawLine)) continue

    // var(--xxx) — match anywhere on the line
    for (const m of rawLine.matchAll(VAR_RE)) {
      recordHit(m[1], lineNo, 'var()')
    }

    // bare --xxx — match inside inline backticks OR if currently in a fence
    if (inFence) {
      for (const m of rawLine.matchAll(TOKEN_RE)) {
        recordHit(m[1], lineNo, 'fence')
      }
    } else {
      for (const span of rawLine.matchAll(/`([^`]+)`/g)) {
        for (const m of span[1].matchAll(TOKEN_RE)) {
          recordHit(m[1], lineNo, 'backtick')
        }
      }
    }
  }

  return hits
}

const declared = parseTokensCss()
const files = findDocFiles()
const allHits: Hit[] = []
for (const f of files) allHits.push(...checkDoc(f, declared))

if (allHits.length === 0) {
  console.log(
    `[32m✓[0m tokens-in-docs OK — ${files.length} markdown files clean against ${declared.size} declared tokens`,
  )
  process.exit(0)
}

console.error(
  `[31m✗ tokens-in-docs FAILED[0m — ${allHits.length} unknown token reference${allHits.length === 1 ? '' : 's'}:`,
)
for (const h of allHits) {
  const rel = relative(yamiRoot, h.file)
  console.error(`  · ${rel}:${h.line} — ${h.token}  (matched as ${h.source})`)
}
console.error('')
console.error('  Fix options:')
console.error('    1. Typo? Use the correct token name from tokens.css.')
console.error('    2. Genuinely new token? Add to tokens/*.tokens.json and rebuild.')
console.error('    3. Anti-pattern example? Wrap the section in')
console.error('       <!-- anti-pattern -->  ...  <!-- /anti-pattern -->')
console.error('       or prefix the line with ✗ to mark it as a refused pattern.')
process.exit(1)
