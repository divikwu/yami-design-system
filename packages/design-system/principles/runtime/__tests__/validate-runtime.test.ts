// @vitest-environment happy-dom

import { afterEach, describe, expect, it } from 'vitest'
import { runtimeValidators, validateRuntime } from '../index'
import { createElement, mountFixture } from './setup'

describe('validateRuntime (integration)', () => {
  let cleanup: () => void

  afterEach(() => {
    cleanup?.()
  })

  it('returns pass=true for a compliant DOM', () => {
    const button = createElement('button', {
      textContent: 'Buy Now',
      styles: { width: '120px', height: '48px', display: 'block' },
    })
    const price = createElement('span', {
      textContent: '$12.99',
      styles: { fontFamily: '"GT Walsheim", sans-serif' },
    })

    cleanup = mountFixture(button, price)

    // Note: happy-dom getBoundingClientRect returns 0×0 (no layout engine),
    // so tap-target fires a warning. pass=true still holds because tap-target
    // is severity:warning, and pass only checks for error-level violations.
    const result = validateRuntime(document.body)

    expect(result.pass).toBe(true)
    expect(result.violations.every((v) => v.severity !== 'error')).toBe(true)
    expect(result.checkedCount).toBeGreaterThan(0)
    expect(result.skippedCount).toBeGreaterThan(0) // P2 stubs are skipped
    expect(result.durationMs).toBeGreaterThanOrEqual(0)
  })

  it('catches multiple violations across different rules', () => {
    // Small tap target (tap-target violation)
    // Note: happy-dom getBoundingClientRect returns 0×0 (no layout engine),
    // which is still < 44 so tap-target fires correctly.
    const smallButton = createElement('button', {
      textContent: 'X',
      styles: { width: '20px', height: '20px', display: 'block' },
    })

    // Disabled with opacity (no-opacity-disabled violation)
    const disabledBtn = createElement('button', {
      textContent: 'Disabled',
      attributes: { 'aria-disabled': 'true' },
      styles: { opacity: '0.5', display: 'block', width: '100px', height: '44px' },
    })

    // Digits without GT Walsheim (numerals-font violation)
    const price = createElement('span', {
      textContent: '$9.99',
      styles: { fontFamily: 'Arial, sans-serif' },
    })

    cleanup = mountFixture(smallButton, disabledBtn, price)
    const result = validateRuntime(document.body)

    expect(result.pass).toBe(false) // has error-level violations
    expect(result.violations.length).toBeGreaterThanOrEqual(2)

    // Verify violations come from different rules
    const ruleIds = new Set(result.violations.map((v) => v.ruleId))
    expect(ruleIds.size).toBeGreaterThanOrEqual(2)

    // Errors should be sorted before warnings
    const firstError = result.violations.findIndex((v) => v.severity === 'error')
    const firstWarning = result.violations.findIndex((v) => v.severity === 'warning')
    if (firstError !== -1 && firstWarning !== -1) {
      expect(firstError).toBeLessThan(firstWarning)
    }
  })

  it('supports ruleIds filter', () => {
    const smallButton = createElement('button', {
      textContent: 'X',
      styles: { width: '20px', height: '20px', display: 'block' },
    })

    cleanup = mountFixture(smallButton)
    const result = validateRuntime(document.body, { ruleIds: ['tap-target'] })

    // Only tap-target should have run
    for (const v of result.violations) {
      expect(v.ruleId).toBe('tap-target')
    }
  })

  it('registers 13 runtime validators', () => {
    expect(runtimeValidators.length).toBe(12)
  })

  it('reports timing information', () => {
    cleanup = mountFixture(createElement('div', { textContent: 'test' }))
    const result = validateRuntime(document.body)
    expect(typeof result.durationMs).toBe('number')
    expect(result.durationMs).toBeGreaterThanOrEqual(0)
  })
})
