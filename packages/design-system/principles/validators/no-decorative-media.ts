/**
 * no-decorative-media — forbids glassmorphism, gradients (covered by
 * no-gradient), hand-drawn illustrations, serif display fonts, soft
 * pastel palettes, patterns/textures/grain.
 *
 * Status: SKELETON — most of these are visual / asset-level concerns
 * that static code analysis can't detect:
 *   - Illustrations in SVG assets → need image-level checks
 *   - Serif font usage → overlaps with numerals-font (font-resolution)
 *   - Glassmorphism → requires backdrop-filter inspection
 *   - Pastel palettes → requires color analysis
 *
 * What's statically checkable AND covered elsewhere:
 *   - Gradients → no-gradient validator
 *   - Custom color refs → semantic-color-only validator
 *
 * What we add here: backdrop-filter detection (glassmorphism signature).
 * Everything else defers to Phase 8.5 visual scorer.
 */

import type { Validator, Violation } from '../schema'
import { findAll, result } from './_shared'

const BACKDROP_FILTER = /\bbackdrop-filter\s*:\s*([^;}\n]+)/gi
const SERIF_FONT_FAMILY =
  /font-family\s*:\s*[^;}\n]*\b(serif|Georgia|Times|Palatino|Baskerville|cursive|fantasy)\b[^;}\n]*/gi

export const noDecorativeMedia: Validator = {
  ruleId: 'no-decorative-media',
  title: '装饰媒体禁用',
  severity: 'error',
  check(code) {
    const violations: Violation[] = []

    for (const hit of findAll(code, BACKDROP_FILTER)) {
      const value = (hit.groups[0] ?? '').trim()
      if (value === 'none' || value === 'inherit') continue
      violations.push({
        ruleId: 'no-decorative-media',
        message: `backdrop-filter: ${value} — glassmorphism is forbidden per no-decorative-media.`,
        severity: 'error',
        locations: [hit.location],
        suggestion:
          'Remove backdrop-filter entirely. Use solid --surface-* tokens for opaque surfaces and --overlay-scrim (rgba 0,0,0,0.68) for modals.',
      })
    }

    for (const hit of findAll(code, SERIF_FONT_FAMILY)) {
      violations.push({
        ruleId: 'no-decorative-media',
        message: `Serif or decorative font-family '${hit.match}' — YAMI uses GT Walsheim + system sans stacks only.`,
        severity: 'error',
        locations: [hit.location],
        suggestion:
          'Replace with var(--font-family-ios), var(--font-family-ios), or var(--font-family-android).',
      })
    }

    return result(violations)
  },
}
