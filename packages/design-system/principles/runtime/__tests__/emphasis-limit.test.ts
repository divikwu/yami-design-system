// @vitest-environment happy-dom

import { afterEach, describe, expect, it } from 'vitest'
import { emphasisLimit } from '../validators/emphasis-limit'
import { createElement, mountFixture } from './setup'

describe('emphasis-limit (runtime)', () => {
  let cleanup: () => void

  afterEach(() => {
    cleanup?.()
  })

  it('passes with zero or one emphasis button', () => {
    const button = createElement('button', {
      textContent: 'Buy Now',
      className: 'button_emphasis_abc123',
      styles: { display: 'block', width: '100px', height: '40px' },
    })

    cleanup = mountFixture(button)
    const violations = emphasisLimit.check(document.body)
    expect(violations).toEqual([])
  })

  it('flags multiple visible emphasis buttons', () => {
    const btn1 = createElement('button', {
      textContent: 'Buy Now',
      className: 'button_emphasis_abc123',
      styles: { display: 'block', width: '100px', height: '40px' },
    })
    const btn2 = createElement('button', {
      textContent: 'Add to Cart',
      className: 'button_emphasis_def456',
      styles: { display: 'block', width: '100px', height: '40px' },
    })

    cleanup = mountFixture(btn1, btn2)
    const violations = emphasisLimit.check(document.body)

    expect(violations.length).toBe(1)
    expect(violations[0]?.ruleId).toBe('emphasis-limit')
    expect(violations[0]?.severity).toBe('error')
    expect(violations[0]?.measured?.totalEmphasisCount).toBe(2)
  })

  it('ignores hidden emphasis buttons', () => {
    const btn1 = createElement('button', {
      textContent: 'Buy Now',
      className: 'button_emphasis_abc123',
      styles: { display: 'block', width: '100px', height: '40px' },
    })
    const btn2 = createElement('button', {
      textContent: 'Hidden CTA',
      className: 'button_emphasis_def456',
      styles: { display: 'none' },
    })

    cleanup = mountFixture(btn1, btn2)
    const violations = emphasisLimit.check(document.body)
    expect(violations).toEqual([])
  })
})
