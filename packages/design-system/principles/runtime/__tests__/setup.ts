/**
 * Test setup for runtime validators.
 *
 * Uses happy-dom as the DOM environment for vitest.
 * happy-dom provides getComputedStyle, getBoundingClientRect, etc.
 */

// happy-dom environment is configured via the vitest-environment pragma
// in each test file: // @vitest-environment happy-dom

/**
 * Helper: create a DOM element with inline styles and optional attributes.
 * Useful for building test fixtures.
 */
export function createElement(
  tag: string,
  options?: {
    styles?: Partial<CSSStyleDeclaration>
    attributes?: Record<string, string>
    textContent?: string
    children?: Element[]
    className?: string
  },
): HTMLElement {
  const el = document.createElement(tag)

  if (options?.styles) {
    for (const [key, value] of Object.entries(options.styles)) {
      if (value !== undefined && typeof value === 'string') {
        el.style.setProperty(key.replace(/([A-Z])/g, '-$1').toLowerCase(), value)
      }
    }
  }

  if (options?.attributes) {
    for (const [key, value] of Object.entries(options.attributes)) {
      el.setAttribute(key, value)
    }
  }

  if (options?.className) {
    el.className = options.className
  }

  if (options?.textContent) {
    el.textContent = options.textContent
  }

  if (options?.children) {
    for (const child of options.children) {
      el.appendChild(child)
    }
  }

  return el
}

/**
 * Helper: build a minimal DOM tree and attach to document.body.
 * Returns a cleanup function.
 */
export function mountFixture(...elements: Element[]): () => void {
  for (const el of elements) {
    document.body.appendChild(el)
  }
  return () => {
    document.body.innerHTML = ''
  }
}
