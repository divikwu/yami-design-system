import type { Meta, StoryObj } from '@storybook/react-vite'

import { Footer } from './Footer'
import type { FooterProps } from './Footer.types'
import {
  createFooterAppLinks,
  createFooterColumns,
  createFooterLegalLinks,
  createFooterPaymentMarks,
  createFooterSocialLinks,
  footerCopy,
  type FooterLocale,
} from './fixtures'

function localeFromGlobals(value: unknown): FooterLocale {
  return value === 'en' ? 'en' : 'zh'
}

// Legal links are not optional in practice — every storefront ships them and
// the page fixture always passes them, so the stories render them too rather
// than showing a configuration the live site never has.
function getProps(locale: FooterLocale): FooterProps {
  const copy = footerCopy[locale]
  return {
    ariaLabel: copy.ariaLabel,
    columns: createFooterColumns(locale),
    socialLinks: createFooterSocialLinks(locale),
    subscribe: {
      title: copy.subscribeTitle,
      label: copy.subscribeLabel,
      placeholder: copy.subscribePlaceholder,
      submitLabel: copy.subscribeSubmit,
    },
    appTitle: copy.appTitle,
    appLinks: createFooterAppLinks(),
    copyright: copy.copyright,
    legalLinks: createFooterLegalLinks(locale),
    paymentMarks: createFooterPaymentMarks(),
  }
}

const meta = {
  title: 'YAMI/Components/Navigation/Footer',
  component: Footer,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'YAMI PC global site footer: a responsive masthead that follows the 1920, 1440, and 1024px Figma variants, closed by an inverse bar carrying payment marks, copyright, and legal links. PC only — the mobile footer ships separately.',
      },
      story: { inline: false, height: '760px' },
    },
  },
  args: getProps('zh'),
} satisfies Meta<typeof Footer>

export default meta
type Story = StoryObj<typeof meta>

function gridTrackCount(template: string) {
  return template.trim() ? template.trim().split(/\s+/).length : 0
}

const validateLayout: NonNullable<Story['play']> = async ({ canvasElement }) => {
  const footer = canvasElement.querySelector<HTMLElement>('[data-slot="footer"]')
  if (!footer) throw new Error('Footer did not render')
  if (footer.getBoundingClientRect().width < 1024) {
    throw new Error('Footer must keep a minimum width of 1024px')
  }

  const groups = canvasElement.querySelectorAll('[data-slot="footer-group"]')
  if (groups.length !== 5) {
    throw new Error(`Expected 5 link groups, got ${groups.length}`)
  }

  const columns = canvasElement.querySelectorAll('[data-slot="footer-column"]')
  if (columns.length !== 4) {
    throw new Error(`Expected 4 visual masthead columns, got ${columns.length}`)
  }
  if (Array.from(columns).some((column) => getComputedStyle(column).alignSelf !== 'start')) {
    throw new Error('Footer columns must size to their own content')
  }

  const masthead = canvasElement.querySelector<HTMLElement>('[data-slot="footer-masthead"]')
  const linkPanel = canvasElement.querySelector<HTMLElement>('[data-slot="footer-link-panel"]')
  const sidePanel = canvasElement.querySelector<HTMLElement>('[data-slot="footer-side-panel"]')
  if (!masthead || !linkPanel || !sidePanel) throw new Error('Masthead panels did not render')

  const isNarrow = footer.clientWidth <= 1024
  const mastheadTracks = gridTrackCount(getComputedStyle(masthead).gridTemplateColumns)
  const linkTracks = gridTrackCount(getComputedStyle(linkPanel).gridTemplateColumns)
  // The two-column range is (min-width: 1025px) and (max-width: 1440px), so
  // 1440 itself still renders 2 tracks. `>= 1440` only ever passed because a
  // classic scrollbar shaved the client width below the boundary; headless
  // browsers use overlay scrollbars and expose the off-by-one.
  const expectedLinkTracks = isNarrow || footer.clientWidth > 1440 ? 4 : 2

  if (mastheadTracks !== (isNarrow ? 1 : 2)) {
    throw new Error(
      `Expected ${isNarrow ? 1 : 2} masthead track(s), got ${mastheadTracks}`,
    )
  }
  if (linkTracks !== expectedLinkTracks) {
    throw new Error(`Expected ${expectedLinkTracks} link tracks, got ${linkTracks}`)
  }

  const linkWidth = linkPanel.getBoundingClientRect().width
  const sideWidth = sidePanel.getBoundingClientRect().width
  if (isNarrow) {
    if (Math.abs(linkWidth - footer.clientWidth) > 2 || Math.abs(sideWidth - footer.clientWidth) > 2) {
      throw new Error(
        `At 1024px the masthead panels must stack full width, got ${linkWidth}px / ${sideWidth}px`,
      )
    }
    if (gridTrackCount(getComputedStyle(sidePanel).gridTemplateColumns) !== 2) {
      throw new Error('At 1024px the right bands must share two columns')
    }
  } else if (Math.abs(linkWidth - sideWidth) > 2) {
    throw new Error(`Masthead must split 50/50, got ${linkWidth}px / ${sideWidth}px`)
  }

  const footerSurface = getComputedStyle(footer).backgroundColor
  if (getComputedStyle(linkPanel).backgroundColor !== footerSurface) {
    throw new Error('Link panel must use the secondary surface')
  }
  const keepInTouch = canvasElement.querySelector<HTMLElement>(
    '[data-slot="footer-keep-in-touch"]',
  )
  const appBand = canvasElement.querySelector<HTMLElement>('[data-slot="footer-app-band"]')
  if (!keepInTouch || !appBand) throw new Error('Footer side bands did not render')
  if (
    getComputedStyle(keepInTouch).backgroundColor !== footerSurface ||
    getComputedStyle(appBand).backgroundColor !== footerSurface
  ) {
    throw new Error('Footer side bands must use the secondary surface')
  }
  const dividerStyle = getComputedStyle(footer)
  if (
    dividerStyle.borderTopWidth !== '2px' ||
    dividerStyle.borderTopStyle !== 'solid' ||
    dividerStyle.borderTopColor === 'rgba(0, 0, 0, 0)'
  ) {
    throw new Error('Footer must use a visible 2px emphasis top divider')
  }

  const appButtons = canvasElement.querySelectorAll<HTMLElement>(
    '[data-slot="footer-app-button"]',
  )
  if (appButtons.length !== 2) {
    throw new Error(`Expected 2 app buttons, got ${appButtons.length}`)
  }
  for (const button of appButtons) {
    const style = getComputedStyle(button)
    if (style.height !== '40px') {
      throw new Error(`App buttons must stay 40px high, got ${style.height}`)
    }
  }
  if (!isNarrow && Array.from(appButtons).some((button) => getComputedStyle(button).width !== '246px')) {
    throw new Error('App buttons must stay 246px wide above the 1024px breakpoint')
  }
  if (isNarrow) {
    const appRow = canvasElement.querySelector<HTMLElement>('[data-slot="footer-app-row"]')
    if (appRow && appRow.scrollWidth > appRow.clientWidth + 1) {
      throw new Error('At 1024px app buttons must fit their half without overflow')
    }
  }

  const closingBar = canvasElement.querySelector<HTMLElement>('[data-slot="footer-closing-bar"]')
  if (!closingBar) throw new Error('Closing bar did not render')
  if (getComputedStyle(closingBar).backgroundColor === footerSurface) {
    throw new Error('Closing bar must use the inverse surface')
  }
  const closingStyle = getComputedStyle(closingBar)
  const primitiveColors = getComputedStyle(footer)
  const fixedClosingTokens: Array<[string, string]> = [
    ['--surface-inverse', '--color-neutral-900'],
    ['--text-primary-inverse', '--color-white-1000'],
    ['--text-secondary-inverse', '--color-white-600'],
    ['--border-focus-inverse', '--color-white-1000'],
  ]
  for (const [semanticToken, primitiveToken] of fixedClosingTokens) {
    if (
      closingStyle.getPropertyValue(semanticToken).trim() !==
      primitiveColors.getPropertyValue(primitiveToken).trim()
    ) {
      throw new Error(`Closing bar must keep its fixed light polarity for ${semanticToken}`)
    }
  }

  const paymentMarks = canvasElement.querySelectorAll<HTMLImageElement>(
    '[data-slot="footer-payment-mark"]',
  )
  if (paymentMarks.length !== 10) {
    throw new Error(`Expected 10 payment marks, got ${paymentMarks.length}`)
  }
  // play() fires as soon as the DOM mounts; the artwork may still be in
  // flight. Wait for each image to settle before judging naturalWidth, or the
  // assertion reports a broken image that is merely a slow one.
  await Promise.all(
    Array.from(paymentMarks).map((mark) =>
      mark.complete
        ? Promise.resolve()
        : new Promise<void>((resolve) => {
            mark.addEventListener('load', () => resolve(), { once: true })
            mark.addEventListener('error', () => resolve(), { once: true })
          }),
    ),
  )
  if (Array.from(paymentMarks).some((mark) => mark.naturalWidth === 0)) {
    throw new Error('Every payment mark must load its artwork')
  }

  if (footer.scrollWidth > footer.clientWidth + 1) {
    throw new Error(
      `Footer must not overflow horizontally: ${footer.scrollWidth}px > ${footer.clientWidth}px`,
    )
  }
}

export const Showcase: Story = {
  globals: {
    viewport: { value: 'yamiDesktopMd', isRotated: false },
  },
  render: (_args, { globals }) => <Footer {...getProps(localeFromGlobals(globals.locale))} />,
  play: validateLayout,
}

export const DarkTheme: Story = {
  globals: {
    theme: 'dark',
    viewport: { value: 'yamiDesktopMd', isRotated: false },
  },
  render: (_args, { globals }) => <Footer {...getProps(localeFromGlobals(globals.locale))} />,
  play: validateLayout,
}

/* Breakpoint fixtures, not formats to browse: the masthead has three layouts
 * (single column at 1024, two link columns through 1440, four above it) and a
 * play() only ever runs at the viewport its story pins. Anyone who wants to
 * see a width switches the toolbar on any story, so these stay out of the
 * sidebar under `!dev` while the runner keeps asserting all three.
 *
 * 1440 is the boundary itself — the width where validateLayout's `>= 1440`
 * once disagreed with the CSS `max-width: 1440` range. */
export const Desktop1024: Story = {
  tags: ['!dev', '!autodocs'],
  globals: {
    viewport: { value: 'yamiDesktop', isRotated: false },
  },
  render: (_args, { globals }) => <Footer {...getProps(localeFromGlobals(globals.locale))} />,
  play: validateLayout,
}

export const Desktop1440: Story = {
  tags: ['!dev', '!autodocs'],
  globals: {
    viewport: { value: 'yamiDesktopLg', isRotated: false },
  },
  render: (_args, { globals }) => <Footer {...getProps(localeFromGlobals(globals.locale))} />,
  play: validateLayout,
}

export const Desktop1920: Story = {
  tags: ['!dev', '!autodocs'],
  globals: {
    viewport: { value: 'yamiDesktopXl', isRotated: false },
  },
  render: (_args, { globals }) => <Footer {...getProps(localeFromGlobals(globals.locale))} />,
  play: validateLayout,
}
