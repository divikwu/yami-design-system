// @vitest-environment happy-dom

import { afterEach, describe, expect, it, vi } from 'vitest'
import { tapTarget } from '../validators/tap-target'
import { createElement, mountFixture } from './setup'

describe('tap-target (runtime)', () => {
  let cleanup: () => void

  afterEach(() => {
    cleanup?.()
    vi.restoreAllMocks()
  })

  it('passes when all interactive elements meet 44×44 minimum', () => {
    const button = createElement('button', {
      textContent: 'Buy Now',
      styles: { width: '120px', height: '48px', display: 'block' },
    })
    const link = createElement('a', {
      textContent: 'Learn more',
      attributes: { href: '/about' },
      styles: { display: 'inline-block', width: '100px', height: '44px' },
    })

    cleanup = mountFixture(button, link)

    // happy-dom doesn't compute layout, so mock getBoundingClientRect
    vi.spyOn(button, 'getBoundingClientRect').mockReturnValue({
      width: 120,
      height: 48,
      x: 0,
      y: 0,
      top: 0,
      left: 0,
      bottom: 48,
      right: 120,
      toJSON: () => {},
    })
    vi.spyOn(link, 'getBoundingClientRect').mockReturnValue({
      width: 100,
      height: 44,
      x: 0,
      y: 50,
      top: 50,
      left: 0,
      bottom: 94,
      right: 100,
      toJSON: () => {},
    })

    const violations = tapTarget.check(document.body)
    expect(violations).toEqual([])
  })

  it('flags interactive elements smaller than 44×44', () => {
    const smallButton = createElement('button', {
      textContent: 'X',
      styles: { width: '24px', height: '24px', display: 'block' },
    })

    cleanup = mountFixture(smallButton)

    // Mock small bounding rect
    vi.spyOn(smallButton, 'getBoundingClientRect').mockReturnValue({
      width: 24,
      height: 24,
      x: 0,
      y: 0,
      top: 0,
      left: 0,
      bottom: 24,
      right: 24,
      toJSON: () => {},
    })

    const violations = tapTarget.check(document.body)

    expect(violations.length).toBeGreaterThanOrEqual(1)
    expect(violations[0]?.ruleId).toBe('tap-target')
    expect(violations[0]?.severity).toBe('warning')
    expect(violations[0]?.selector).toBeTruthy()
    expect(violations[0]?.measured).toEqual({ width: 24, height: 24 })
  })

  it('skips hidden elements', () => {
    const hiddenButton = createElement('button', {
      textContent: 'Hidden',
      styles: { width: '10px', height: '10px', display: 'none' },
    })

    cleanup = mountFixture(hiddenButton)
    const violations = tapTarget.check(document.body)
    expect(violations).toEqual([])
  })
})
