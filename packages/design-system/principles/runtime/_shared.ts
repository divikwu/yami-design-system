/**
 * Shared DOM utilities for runtime validators.
 *
 * Unlike the AST _shared.ts (regex-based string helpers), these operate
 * on live DOM elements using standard Web APIs: getBoundingClientRect,
 * getComputedStyle, querySelectorAll, etc.
 */

// ─── Selector path generation ────────────────────────────────────

/**
 * Generate a human-readable CSS selector path for an element.
 * Prefers [data-yami-id] when available, falls back to tagName:nth-of-type.
 */
export function getSelectorPath(el: Element): string {
  const parts: string[] = []
  let current: Element | null = el

  while (current && current !== document.documentElement) {
    const yamiId = current.getAttribute('data-yami-id')
    if (yamiId) {
      parts.unshift(`[data-yami-id="${yamiId}"]`)
      break // yami-id is unique enough to stop
    }

    let selector = current.tagName.toLowerCase()
    const parent = current.parentElement
    if (parent) {
      const sameTagSiblings = Array.from(parent.children).filter(
        (c) => c.tagName === current?.tagName,
      )
      if (sameTagSiblings.length > 1) {
        const index = sameTagSiblings.indexOf(current) + 1
        selector += `:nth-of-type(${index})`
      }
    }
    parts.unshift(selector)
    current = current.parentElement
  }

  return parts.join(' > ')
}

// ─── data-yami-id reader ─────────────────────────────────────────

/** Read the data-yami-id attribute from an element, if present. */
export function getYamiId(el: Element): string | undefined {
  return el.getAttribute('data-yami-id') ?? undefined
}

// ─── Visibility check ────────────────────────────────────────────

/**
 * Check whether an element is actually visible in the DOM.
 * Uses offsetParent (null for hidden elements) + computed visibility/display.
 */
export function isVisible(el: Element): boolean {
  const htmlEl = el as HTMLElement

  // offsetParent is null for display:none, visibility:hidden ancestors,
  // or fixed-position elements. For fixed elements we still want to check.
  if (htmlEl.offsetParent === null) {
    // Fixed-position elements have null offsetParent but are visible
    const style = getComputedStyle(el)
    if (style.position === 'fixed' || style.position === 'sticky') {
      return style.display !== 'none' && style.visibility !== 'hidden'
    }
    // Also check if it's the <body> or <html> element itself
    if (el.tagName === 'BODY' || el.tagName === 'HTML') {
      return true
    }
    return false
  }

  const style = getComputedStyle(el)
  if (style.display === 'none') return false
  if (style.visibility === 'hidden') return false
  if (style.opacity === '0') return false

  return true
}

// ─── Interactive element collection ──────────────────────────────

const INTERACTIVE_SELECTOR = [
  'button',
  'a[href]',
  'input',
  'select',
  'textarea',
  '[role="button"]',
  '[role="link"]',
  '[role="checkbox"]',
  '[role="radio"]',
  '[role="tab"]',
  '[role="menuitem"]',
  '[tabindex]',
].join(', ')

/**
 * Collect all interactive elements within a root.
 * Includes buttons, links, inputs, selects, textareas, and ARIA roles.
 */
export function getAllInteractiveElements(root: Element | Document): Element[] {
  return Array.from(root.querySelectorAll(INTERACTIVE_SELECTOR))
}

// ─── Color parsing ───────────────────────────────────────────────

export interface RGBA {
  r: number
  g: number
  b: number
  a: number
}

/**
 * Parse a computed color string (rgb/rgba/hex) into RGBA components.
 * Computed styles typically return `rgb(r, g, b)` or `rgba(r, g, b, a)`.
 * Returns null if the format is unrecognized.
 */
export function resolveColor(value: string): RGBA | null {
  // rgb(r, g, b) or rgba(r, g, b, a)
  const rgbMatch = value.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*([\d.]+))?\s*\)/)
  if (rgbMatch) {
    return {
      r: Number(rgbMatch[1]),
      g: Number(rgbMatch[2]),
      b: Number(rgbMatch[3]),
      a: rgbMatch[4] !== undefined ? Number(rgbMatch[4]) : 1,
    }
  }

  // 6-digit hex: #RRGGBB
  const hex6 = value.match(/^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i)
  if (hex6) {
    const [, r = '', g = '', b = ''] = hex6
    return {
      r: parseInt(r, 16),
      g: parseInt(g, 16),
      b: parseInt(b, 16),
      a: 1,
    }
  }

  // 3-digit hex: #RGB
  const hex3 = value.match(/^#([0-9a-f])([0-9a-f])([0-9a-f])$/i)
  if (hex3) {
    const [, r = '', g = '', b = ''] = hex3
    return {
      r: parseInt(r + r, 16),
      g: parseInt(g + g, 16),
      b: parseInt(b + b, 16),
      a: 1,
    }
  }

  return null
}
