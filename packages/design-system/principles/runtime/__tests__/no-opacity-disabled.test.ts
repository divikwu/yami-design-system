// @vitest-environment happy-dom

import { afterEach, describe, expect, it } from 'vitest'
import { noOpacityDisabled } from '../validators/no-opacity-disabled'
import { createElement, mountFixture } from './setup'

describe('no-opacity-disabled (runtime)', () => {
  let cleanup: () => void

  afterEach(() => {
    cleanup?.()
  })

  it('passes when disabled elements have full opacity', () => {
    const button = createElement('button', {
      textContent: 'Disabled',
      attributes: { disabled: '' },
      styles: {
        opacity: '1',
        backgroundColor: '#EBEBEB',
        color: 'rgba(0, 0, 0, 0.29)',
      },
    })

    cleanup = mountFixture(button)
    const violations = noOpacityDisabled.check(document.body)
    expect(violations).toEqual([])
  })

  it('flags disabled elements with reduced opacity', () => {
    const button = createElement('button', {
      textContent: 'Disabled',
      attributes: { 'aria-disabled': 'true' },
      styles: { opacity: '0.5' },
    })

    cleanup = mountFixture(button)
    const violations = noOpacityDisabled.check(document.body)

    expect(violations.length).toBe(1)
    expect(violations[0]?.ruleId).toBe('no-opacity-disabled')
    expect(violations[0]?.severity).toBe('error')
    expect(violations[0]?.measured?.opacity).toBe(0.5)
    expect(violations[0]?.suggestion).toContain('--button-disabled')
  })

  it('passes for non-disabled elements with reduced opacity', () => {
    const div = createElement('div', {
      textContent: 'Faded but not disabled',
      styles: { opacity: '0.5' },
    })

    cleanup = mountFixture(div)
    const violations = noOpacityDisabled.check(document.body)
    expect(violations).toEqual([])
  })
})
