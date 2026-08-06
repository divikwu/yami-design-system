// @vitest-environment happy-dom

import { afterEach, describe, expect, it } from 'vitest'
import { numeralsFont } from '../validators/numerals-font'
import { createElement, mountFixture } from './setup'

describe('numerals-font (runtime)', () => {
  let cleanup: () => void

  afterEach(() => {
    cleanup?.()
  })

  it('passes when digits use GT Walsheim font', () => {
    const price = createElement('span', {
      textContent: '$12.99',
      styles: { fontFamily: '"GT Walsheim", sans-serif' },
    })

    cleanup = mountFixture(price)
    const violations = numeralsFont.check(document.body)
    expect(violations).toEqual([])
  })

  it('flags digits rendered without GT Walsheim', () => {
    const price = createElement('span', {
      textContent: '$12.99',
      styles: { fontFamily: '"PingFang SC", "Noto Sans SC", sans-serif' },
    })

    cleanup = mountFixture(price)
    const violations = numeralsFont.check(document.body)

    expect(violations.length).toBeGreaterThanOrEqual(1)
    expect(violations[0]?.ruleId).toBe('numerals-font')
    expect(violations[0]?.severity).toBe('warning')
    expect(violations[0]?.measured?.fontFamily).toBeDefined()
  })

  it('skips elements without digits', () => {
    const text = createElement('span', {
      textContent: 'Hello World',
      styles: { fontFamily: '"PingFang SC", sans-serif' },
    })

    cleanup = mountFixture(text)
    const violations = numeralsFont.check(document.body)
    expect(violations).toEqual([])
  })
})
