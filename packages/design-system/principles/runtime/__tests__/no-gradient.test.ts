// @vitest-environment happy-dom

import { afterEach, describe, expect, it } from 'vitest'
import { noGradient } from '../validators/no-gradient'
import { createElement, mountFixture } from './setup'

describe('no-gradient (runtime)', () => {
  let cleanup: () => void

  afterEach(() => {
    cleanup?.()
  })

  it('passes when no elements use gradients', () => {
    const div = createElement('div', {
      styles: { backgroundColor: '#FFFFFF' },
      children: [
        createElement('p', { textContent: 'Hello', styles: { backgroundColor: '#F5F5F5' } }),
      ],
    })

    cleanup = mountFixture(div)
    const violations = noGradient.check(document.body)
    expect(violations).toEqual([])
  })

  it('flags elements with gradient backgrounds', () => {
    const div = createElement('div', {
      styles: { backgroundImage: 'linear-gradient(to right, #E00000, #FF6600)' },
    })

    cleanup = mountFixture(div)
    const violations = noGradient.check(document.body)

    expect(violations.length).toBeGreaterThanOrEqual(1)
    expect(violations[0]?.ruleId).toBe('no-gradient')
    expect(violations[0]?.severity).toBe('error')
    expect(violations[0]?.measured?.backgroundImage).toBeDefined()
  })
})
