import type { Meta, StoryObj } from '@storybook/react-vite'

import { Header } from './Header'
import { HeaderCategoryRail } from './HeaderCategoryRail'
import { HeaderSearch } from './HeaderSearch'
import type { HeaderLocale } from './fixtures'
import { createHeaderCategories, createHeaderProps, headerStorefront } from './fixtures'
import storyStyles from './Header.stories.module.css'

function localeFromGlobals(value: unknown): HeaderLocale {
  return value === 'en' ? 'en' : 'zh'
}

const meta = {
  title: 'YAMI/Components/Navigation/Header',
  component: Header,
  subcomponents: { HeaderSearch, HeaderCategoryRail },
  decorators: [
    (Story) => (
      <div className={storyStyles.canvas}>
        <div className={storyStyles.frame}>
          <Story />
        </div>
      </div>
    ),
  ],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'YAMI PC global navigation band, measured against the production www.yami.com header: a 64px utility row (brand lockup · hall switcher · locale · deliver-to · search · account · cart) over a 63.6px category rail, closed by a 2px rule. Category entries are campaign artwork rather than icon components. The EN and CN storefronts are separate CMS feeds — switch the toolbar language to compare. PC only — the mobile header ships separately.',
      },
    },
  },
  args: createHeaderProps('en'),
} satisfies Meta<typeof Header>

export default meta
type Story = StoryObj<typeof meta>

type Storefront = (typeof headerStorefront)[HeaderLocale]

/**
 * A brand slot holds a light and a dark lockup; `.dark` hides one. Assertions
 * must read the one actually painted, not whichever is first in the DOM.
 */
function visibleLockup(canvasElement: HTMLElement, slot: string) {
  const images = [
    ...canvasElement.querySelectorAll<HTMLImageElement>(`[data-slot="${slot}"] img`),
  ]
  return images.find((image) => getComputedStyle(image).display !== 'none')
}

/**
 * Below --breakpoints-desktop the band is the mobile chrome from Figma
 * `2725:151904`: a 56px brand bar over a 36px search row, and none of the PC
 * anatomy.
 */
async function validateMobileBand(canvasElement: HTMLElement, site: Storefront) {
  const bar = canvasElement.querySelector<HTMLElement>('[data-slot="header-mobile-bar"]')
  if (!bar) throw new Error('Mobile brand bar did not render')
  if (Math.round(bar.getBoundingClientRect().height) !== 56) {
    throw new Error(`Mobile brand bar must be 56px, got ${bar.getBoundingClientRect().height}px`)
  }

  // The PC anatomy has no mobile counterpart and must be fully out of the flow.
  for (const slot of ['header-utility', 'header-rail-row']) {
    const pc = canvasElement.querySelector<HTMLElement>(`[data-slot="${slot}"]`)
    if (!pc) throw new Error(`${slot} did not render`)
    if (getComputedStyle(pc).display !== 'none') {
      throw new Error(`${slot} must not render below 1024px`)
    }
  }

  const logo = visibleLockup(canvasElement, 'header-mobile-brand')
  if (!logo) throw new Error('Mobile lockup did not render')
  if (Math.round(logo.getBoundingClientRect().height) !== 32) {
    throw new Error(`Mobile lockup must be 32px tall, got ${logo.getBoundingClientRect().height}px`)
  }
  // Vite inlines the lockups as data URIs, so identity is the only thing left
  // to compare — the two bands must not be serving the same artwork.
  const pcLogo = visibleLockup(canvasElement, 'header-brand')
  if (!pcLogo) throw new Error('PC lockup did not render')
  if (logo.src === pcLogo.src) {
    throw new Error('Mobile band must use the Mobile lockup variant, not the PC one')
  }

  const zip = canvasElement.querySelector<HTMLElement>('[data-slot="header-mobile-zipcode"]')
  const inbox = canvasElement.querySelector<HTMLElement>('[data-slot="header-mobile-inbox"]')
  if (!zip || !inbox) throw new Error('Mobile deliver-to and inbox entries did not render')
  if (zip.hasAttribute('href') || inbox.hasAttribute('href')) {
    throw new Error('Mobile entries must remain non-navigating until links are configured')
  }
  for (const entry of [zip, inbox]) {
    const box = entry.getBoundingClientRect()
    if (Math.round(box.width) !== 40 || Math.round(box.height) !== 36) {
      throw new Error(`Mobile action must be 40x36, got ${box.width}x${box.height}`)
    }
  }
  if (!inbox.getAttribute('aria-label')?.includes(site.inbox)) {
    throw new Error('Inbox must carry its localized accessible name')
  }

  const search = canvasElement.querySelector<HTMLElement>('[data-slot="header-search"]')
  if (!search || search.getAttribute('data-variant') !== 'mobile') {
    throw new Error('Mobile band must render the mobile search variant')
  }
  if (Math.round(search.getBoundingClientRect().height) !== 36) {
    throw new Error(`Mobile search field must be 36px, got ${search.getBoundingClientRect().height}px`)
  }

  // Visual search is mobile-only and consumes the DS camera icon, not the
  // barcode `action/scan` glyph.
  const scan = canvasElement.querySelector<HTMLElement>('[data-slot="header-search-scan"]')
  if (!scan) throw new Error('Visual-search control did not render')
  if (scan.getAttribute('aria-label') !== site.scanLabel) {
    throw new Error('Visual-search control must carry its localized accessible name')
  }
  const scanIcon = scan.firstElementChild
  if (!scanIcon || getComputedStyle(scanIcon).maskImage === 'none') {
    throw new Error('Visual-search control must consume assets/icons/action/camera.svg')
  }
  const scanIconBox = scanIcon.getBoundingClientRect()
  if (Math.round(scanIconBox.width) !== 20 || Math.round(scanIconBox.height) !== 20) {
    throw new Error(`Visual-search icon must render at 20px, got ${scanIconBox.width}x${scanIconBox.height}`)
  }

  // Production ships no closing rule under the mobile header.
  if (getComputedStyle(canvasElement.querySelector('[data-slot="header"]')!, '::after').content !== 'none') {
    throw new Error('Mobile band must not paint the PC closing rule')
  }
}

export const Showcase: Story = {
  render: (_args, { globals }) => <Header {...createHeaderProps(localeFromGlobals(globals.locale))} />,
  parameters: {
    docs: {
      description: {
        story:
          'Switch the toolbar viewport to cross `--breakpoints-desktop` — at 1024px and above this is the PC band, below it the mobile chrome. The assertions follow whichever anatomy is live.',
      },
    },
  },
  play: async ({ canvasElement, globals }) => {
    const locale = localeFromGlobals(globals.locale)
    const site = headerStorefront[locale]

    const root = canvasElement.querySelector<HTMLElement>('[data-slot="header"]')
    if (!root) throw new Error('Header did not render')

    const mobileBand = canvasElement.querySelector<HTMLElement>('[data-slot="header-mobile"]')
    if (!mobileBand) throw new Error('Mobile band did not render')
    if (getComputedStyle(mobileBand).display !== 'none') {
      await validateMobileBand(canvasElement, site)
      return
    }
    const utility = canvasElement.querySelector<HTMLElement>('[data-slot="header-utility"]')
    if (!utility) throw new Error('Header utility row did not render')
    const brandControl = utility.querySelector<HTMLElement>('[data-slot="header-brand"]')
    const brandGroup = utility.querySelector<HTMLElement>('[data-slot="header-brand-group"]')
    const locationGroup = utility.querySelector<HTMLElement>('[data-slot="header-location-group"]')
    const localeControl = utility.querySelector<HTMLElement>('[data-slot="header-locale"]')
    const zipcodeControl = utility.querySelector<HTMLElement>('[data-slot="header-zipcode"]')
    if (!brandControl || !brandGroup || !locationGroup || !localeControl || !zipcodeControl) {
      throw new Error('Header locale and zipcode controls did not render')
    }
    if (brandControl.hasAttribute('href')) {
      throw new Error('Brand lockup must remain non-navigating until a link is configured')
    }
    if (
      locationGroup.parentElement !== brandGroup ||
      localeControl.parentElement !== locationGroup ||
      localeControl.nextElementSibling !== zipcodeControl
    ) {
      throw new Error('Locale and zipcode must be grouped together in the left brand group')
    }
    if (localeControl.hasAttribute('href') || zipcodeControl.hasAttribute('href')) {
      throw new Error('Locale and zipcode must remain non-navigating until links are configured')
    }
    const locationGap =
      zipcodeControl.getBoundingClientRect().left - localeControl.getBoundingClientRect().right
    if (Math.abs(locationGap - 2) > 0.5) {
      throw new Error(`Locale and zipcode group must preserve its 2px gap, got ${locationGap}px`)
    }
    const localeHeight = localeControl.getBoundingClientRect().height
    const zipcodeHeight = zipcodeControl.getBoundingClientRect().height
    if (Math.round(localeHeight) !== 36 || Math.round(zipcodeHeight) !== 36) {
      throw new Error(
        `Locale and zipcode controls must render at 36px, got ${localeHeight}px / ${zipcodeHeight}px`,
      )
    }
    const localeHitHeight = getComputedStyle(localeControl, '::after').minHeight
    const zipcodeHitHeight = getComputedStyle(zipcodeControl, '::after').minHeight
    if (localeHitHeight !== '44px' || zipcodeHitHeight !== '44px') {
      throw new Error(
        `Locale and zipcode controls must preserve 44px hit areas, got ${localeHitHeight} / ${zipcodeHitHeight}`,
      )
    }
    const zipcodeStyle = getComputedStyle(zipcodeControl)
    if (zipcodeStyle.paddingLeft !== '8px' || zipcodeStyle.paddingRight !== '8px') {
      throw new Error(
        `Zipcode control must have 8px inline padding, got ${zipcodeStyle.paddingLeft} / ${zipcodeStyle.paddingRight}`,
      )
    }
    const zipcodeIcon = utility.querySelector<HTMLElement>('[data-slot="header-zipcode-icon"]')
    if (!zipcodeIcon) throw new Error('Zipcode icon did not render')
    const zipcodeIconBox = zipcodeIcon.getBoundingClientRect()
    if (Math.round(zipcodeIconBox.width) !== 20 || Math.round(zipcodeIconBox.height) !== 20) {
      throw new Error(
        `Zipcode icon must render on a 20px canvas, got ${zipcodeIconBox.width}×${zipcodeIconBox.height}`,
      )
    }
    if (getComputedStyle(zipcodeIcon).maskImage === 'none') {
      throw new Error('Zipcode control must consume assets/icons/base/zipcode.svg')
    }

    const entries = canvasElement.querySelectorAll<HTMLElement>('[data-slot="header-category"]')
    if (entries.length !== site.categories.length) {
      throw new Error(
        `Expected ${site.categories.length} category entries for ${locale}, found ${entries.length}`,
      )
    }
    if ([...entries].some((entry) => entry.hasAttribute('href'))) {
      throw new Error('Category entries must remain non-navigating until links are configured')
    }
    const rail = canvasElement.querySelector<HTMLElement>('[data-slot="header-categories"]')
    if (!rail) throw new Error('Category rail did not render')
    const railStyle = getComputedStyle(rail)
    if (
      Number.parseFloat(railStyle.paddingLeft) !== 48 ||
      Number.parseFloat(railStyle.paddingRight) !== 48
    ) {
      throw new Error(
        `Category rail must use a 48px inline gutter, got ${railStyle.paddingLeft} / ${railStyle.paddingRight}`,
      )
    }

    // Every category except the leading entry is image artwork.
    const withImage = [...entries].filter((entry) => entry.querySelector('img')).length
    if (withImage !== site.categories.length - 1) {
      throw new Error(
        `Expected ${site.categories.length - 1} artwork entries, found ${withImage}`,
      )
    }
    if (entries[0]?.querySelector('img')) {
      throw new Error('The leading Categories entry must use the grid glyph')
    }
    const allIcon = entries[0]?.querySelector<HTMLElement>('[data-slot="header-all-icon"]')
    if (!allIcon) throw new Error('The leading Categories entry must render the base/all icon')
    const allIconBox = allIcon.getBoundingClientRect()
    if (Math.round(allIconBox.width) !== 24 || Math.round(allIconBox.height) !== 24) {
      throw new Error(
        `The base/all icon must render at 24px, got ${allIconBox.width}×${allIconBox.height}`,
      )
    }
    if (getComputedStyle(allIcon).maskImage === 'none') {
      throw new Error('The leading Categories entry must consume assets/icons/base/all.svg')
    }
    if (getComputedStyle(entries[0]).borderRadius !== '0px') {
      throw new Error('Header category entries must render with square corners')
    }

    // Artwork renders at the production 24px, not an invented size.
    const artwork = canvasElement.querySelector<HTMLImageElement>(
      '[data-slot="header-category"] img',
    )
    if (!artwork) throw new Error('Category artwork did not render')
    const artworkBox = artwork.getBoundingClientRect()
    if (Math.round(artworkBox.width) !== 24 || Math.round(artworkBox.height) !== 24) {
      throw new Error(
        `Category artwork must render at 24px, got ${artworkBox.width}×${artworkBox.height}`,
      )
    }

    // The hall switcher is EN-only; CN separates the lockup with a rule instead.
    const halls = canvasElement.querySelector('[data-slot="header-halls"]')
    if (locale === 'en' && !halls) throw new Error('EN storefront must render the hall switcher')
    if (locale === 'zh' && halls) {
      throw new Error('CN storefront must not render a hall switcher')
    }

    const accountIcon = canvasElement.querySelector<HTMLElement>(
      '[data-slot="header-account-icon"]',
    )
    if (!accountIcon) throw new Error('Account icon did not render')
    const accountIconBox = accountIcon.getBoundingClientRect()
    if (Math.round(accountIconBox.width) !== 20 || Math.round(accountIconBox.height) !== 20) {
      throw new Error(
        `Account icon must render on a 20px canvas, got ${accountIconBox.width}×${accountIconBox.height}`,
      )
    }
    const accountControl = canvasElement.querySelector<HTMLElement>('[data-slot="header-account"]')
    if (!accountControl || accountControl.hasAttribute('href')) {
      throw new Error('Account control must remain non-navigating until a link is configured')
    }

    // The band defaults to the surface token, never a baked-in campaign hue.
    const band = getComputedStyle(root).backgroundColor
    if (band !== 'rgb(255, 255, 255)') {
      throw new Error(`Default header band must resolve to --surface-primary, got ${band}`)
    }

    // Borders reserve the load-bearing heights; the viewport-wide pseudo-elements
    // are the single visible paint layer. Painting both would darken the
    // semi-transparent gray row rule compared with ProductList's one layer.
    const rule = getComputedStyle(root)
    const closingRule = getComputedStyle(root, '::after')
    const utilityRule = getComputedStyle(utility)
    const utilityRulePaint = getComputedStyle(utility, '::after')
    if (
      rule.borderBottomStyle === 'none' ||
      Number.parseFloat(rule.borderBottomWidth) < 2 ||
      rule.borderBottomColor !== 'rgba(0, 0, 0, 0)' ||
      closingRule.backgroundColor === 'rgba(0, 0, 0, 0)' ||
      utilityRule.borderBottomStyle === 'none' ||
      Number.parseFloat(utilityRule.borderBottomWidth) < 1 ||
      utilityRule.borderBottomColor !== 'rgba(0, 0, 0, 0)' ||
      utilityRulePaint.backgroundColor === 'rgba(0, 0, 0, 0)'
    ) {
      throw new Error('Header must close with a 2px bottom rule')
    }
    const viewportWidth = canvasElement.ownerDocument.defaultView?.innerWidth ?? 0
    const utilityRuleWidth = Number.parseFloat(getComputedStyle(utility, '::after').width)
    const closingRuleWidth = Number.parseFloat(getComputedStyle(root, '::after').width)
    if (
      Math.abs(utilityRuleWidth - viewportWidth) > 1 ||
      Math.abs(closingRuleWidth - viewportWidth) > 1
    ) {
      throw new Error(
        `Header dividers must span the viewport (${viewportWidth}px), got ${utilityRuleWidth}px and ${closingRuleWidth}px`,
      )
    }

    // Cart reports its count to assistive tech only — no visible count.
    const cart = canvasElement.querySelector<HTMLElement>('[data-slot="header-cart"]')
    if (!cart) throw new Error('Cart did not render')
    if (cart.hasAttribute('href')) {
      throw new Error('Cart must remain non-navigating until a link is configured')
    }
    const cartIcon = cart.querySelector<HTMLElement>('[data-slot="header-cart-icon"]')
    if (!cartIcon) throw new Error('Cart icon did not render')
    const cartIconBox = cartIcon.getBoundingClientRect()
    if (Math.round(cartIconBox.width) !== 24 || Math.round(cartIconBox.height) !== 24) {
      throw new Error(
        `Cart icon must render on the Figma 24px canvas, got ${cartIconBox.width}×${cartIconBox.height}`,
      )
    }
    if (cart.innerText.trim() !== '') {
      throw new Error(`Cart must render no visible count, found "${cart.innerText.trim()}"`)
    }
    if (!/\d/.test(cart.getAttribute('aria-label') ?? '')) {
      throw new Error('Cart aria-label must carry the item count')
    }
  },
}

export const HallSwitcher: Story = {
  name: 'Hall Switcher (EN only)',
  // PC-only anatomy — these assertions need the desktop band live, so the
  // story pins its viewport rather than following the toolbar.
  globals: {
    viewport: { value: 'yamiDesktopLg', isRotated: false },
  },
  render: () => <Header {...createHeaderProps('en')} />,
  parameters: {
    docs: {
      description: {
        story:
          'The `All | Beauty` switcher scopes the **storefront**, not the search query, so it sits in the brand group. It exists only on the EN storefront — this story pins EN regardless of the toolbar language.',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const categoryLabel = canvasElement.querySelector<HTMLElement>(
      '[data-slot="header-category-label"]',
    )
    if (!categoryLabel) throw new Error('Category label did not render')
    if (getComputedStyle(categoryLabel).fontSize !== '12px') {
      throw new Error(
        `Category labels must remain 12px at compact widths, got ${getComputedStyle(categoryLabel).fontSize}`,
      )
    }

    const halls = [
      ...canvasElement.querySelectorAll<HTMLButtonElement>(
        '[data-slot="header-halls"] [role="radio"]',
      ),
    ]
    const hallsGroup = canvasElement.querySelector<HTMLElement>('[data-slot="header-halls"]')
    if (!hallsGroup || hallsGroup.tagName !== 'DIV') {
      throw new Error('Hall controls must be grouped in a div')
    }
    if (halls.length !== 2) throw new Error(`Expected 2 halls, found ${halls.length}`)
    if ([...hallsGroup.children].some((child) => child.tagName !== 'BUTTON')) {
      throw new Error('Hall buttons must be direct children of the group')
    }
    const hallsStyle = getComputedStyle(hallsGroup)
    if (hallsStyle.marginLeft !== '16px' || hallsStyle.marginRight !== '16px') {
      throw new Error(
        `Hall group must have 16px inline margins, got ${hallsStyle.marginLeft} / ${hallsStyle.marginRight}`,
      )
    }
    const hallGap = halls[1]!.getBoundingClientRect().left - halls[0]!.getBoundingClientRect().right
    if (Math.abs(hallGap - 16) > 0.5) {
      throw new Error(`Hall buttons must have a 16px gap, got ${hallGap}px`)
    }
    if (halls[0]?.getAttribute('aria-checked') !== 'true') {
      throw new Error('The first hall must be selected by default')
    }

    halls[1]?.click()
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
    if (halls[1]?.getAttribute('aria-checked') !== 'true') {
      throw new Error('Clicking a hall must select it')
    }
    if (halls[0]?.getAttribute('aria-checked') !== 'false') {
      throw new Error('Hall selection must be exclusive')
    }
  },
}

export const NoHallSwitcher: Story = {
  name: 'No Hall Switcher (CN)',
  globals: {
    viewport: { value: 'yamiDesktopLg', isRotated: false },
  },
  render: () => <Header {...createHeaderProps('zh')} />,
  parameters: {
    docs: {
      description: {
        story:
          'The CN storefront ships no hall switcher. `Header` then separates the lockup from the locale / deliver-to group with a rule, matching production.',
      },
    },
  },
  play: async ({ canvasElement }) => {
    if (canvasElement.querySelector('[data-slot="header-halls"]')) {
      throw new Error('CN storefront must not render a hall switcher')
    }
    const zip = canvasElement.querySelector<HTMLElement>('[data-slot="header-zipcode"]')
    if (!zip) throw new Error('Deliver-to control did not render')

    // The lockup must not sit flush against the locale / deliver-to group.
    const brand = canvasElement.querySelector<HTMLElement>('[data-slot="header-brand"]')
    if (!brand) throw new Error('Brand lockup did not render')
    const gap = zip.getBoundingClientRect().left - brand.getBoundingClientRect().right
    if (gap < 8) {
      throw new Error(`Expected a separating rule before locale / deliver-to, gap was ${gap}px`)
    }
  },
}

export const PromotionBadges: Story = {
  globals: {
    viewport: { value: 'yamiDesktopLg', isRotated: false },
  },
  render: (_args, { globals }) => <Header {...createHeaderProps(localeFromGlobals(globals.locale))} />,
  parameters: {
    docs: {
      description: {
        story:
          'Promotion counts and flags sit in the category entry’s top-right corner and are clipped to one line, so a multi-badge entry cannot change the row height. Red here is permitted only because these are promotions (rule `red-usage`). EN badges Health; CN badges 厨电家电.',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const badges = canvasElement.querySelector<HTMLElement>(
      '[data-slot="header-category-badges"]',
    )
    if (!badges) throw new Error('Promotion badges did not render')

    const first = badges.firstElementChild as HTMLElement | null
    if (!first) throw new Error('Badge stack is empty')
    if (getComputedStyle(first).color !== 'rgb(224, 0, 0)') {
      throw new Error('Promotion badges must use --text-emphasis')
    }

    // Clipped to a single line regardless of how many badges are supplied.
    const lineHeight = Number.parseFloat(getComputedStyle(first).lineHeight)
    if (badges.getBoundingClientRect().height > lineHeight + 1) {
      throw new Error('Badge stack must clip to one line')
    }

    // Must stay inside the rail row and anchor to the category's top-right.
    const rail = canvasElement.querySelector<HTMLElement>('[data-slot="header-categories"]')
    if (!rail) throw new Error('Category rail did not render')
    const category = badges.closest<HTMLElement>('[data-slot="header-category"]')
    if (!category) throw new Error('Promotion badge category did not render')
    const badgesBox = badges.getBoundingClientRect()
    const categoryBox = category.getBoundingClientRect()
    if (badgesBox.top < rail.getBoundingClientRect().top) {
      throw new Error('Promotion badges must not overflow above the category rail')
    }
    const topGap = badgesBox.top - categoryBox.top
    const rightGap = categoryBox.right - badgesBox.right
    if (topGap < 0 || topGap > 8 || rightGap < 0 || rightGap > 8) {
      throw new Error(
        `Promotion badges must sit in the category top-right corner, got top ${topGap}px and right ${rightGap}px`,
      )
    }
  },
}

export const CategoryRail: Story = {
  globals: {
    viewport: { value: 'yamiDesktopLg', isRotated: false },
  },
  render: (_args, { globals }) => {
    const locale = localeFromGlobals(globals.locale)
    const site = headerStorefront[locale]
    return (
      <HeaderCategoryRail
        categories={createHeaderCategories(locale)}
        ariaLabel={site.categoriesLabel}
        previousLabel={site.previousCategoriesLabel}
        nextLabel={site.nextCategoriesLabel}
      />
    )
  },
  play: async ({ canvasElement, globals }) => {
    const locale = localeFromGlobals(globals.locale)
    const site = headerStorefront[locale]
    const rail = canvasElement.querySelector<HTMLElement>('[data-slot="header-categories"]')
    const list = canvasElement.querySelector<HTMLElement>('[data-slot="header-categories-list"]')
    if (!rail || !list) throw new Error('Category rail did not render')
    const label = rail.querySelector<HTMLElement>('[data-slot="header-category-label"]')
    if (!label) throw new Error('Category label did not render')
    if (getComputedStyle(label).fontSize !== '12px') {
      throw new Error(
        `Category labels must remain 12px at compact widths, got ${getComputedStyle(label).fontSize}`,
      )
    }

    const next = [...rail.querySelectorAll<HTMLButtonElement>('button')].find(
      (button) => button.getAttribute('aria-label') === site.nextCategoriesLabel,
    )
    if (!next) throw new Error('Next categories control did not render')
    const railBox = rail.getBoundingClientRect()
    const nextRightGap = railBox.right - next.getBoundingClientRect().right
    if (Math.abs(nextRightGap - 48) > 1) {
      throw new Error(`Next categories control must sit 48px from the right, got ${nextRightGap}px`)
    }
    const nextMask = rail.querySelector<HTMLElement>(
      '[data-slot="header-category-control-mask"][data-direction="next"]',
    )
    if (!nextMask) throw new Error('Next categories gradient mask did not render')
    const nextMaskBox = nextMask.getBoundingClientRect()
    const nextMaskRightGap = railBox.right - nextMaskBox.right
    if (
      Math.abs(nextMaskRightGap - 48) > 1 ||
      Math.abs(nextMaskBox.width - 64) > 1 ||
      Math.abs(nextMaskBox.height - railBox.height) > 1
    ) {
      throw new Error('Next categories gradient mask must be 64px wide and align with the control')
    }
    if (!getComputedStyle(nextMask).backgroundImage.includes('linear-gradient')) {
      throw new Error('Next categories control must include an edge gradient mask')
    }

    list.scrollTo({ left: list.scrollWidth - list.clientWidth, behavior: 'auto' })

    let previous: HTMLButtonElement | undefined
    for (let attempt = 0; attempt < 20 && !previous; attempt += 1) {
      await new Promise<void>((resolve) => setTimeout(resolve, 50))
      previous = [...rail.querySelectorAll<HTMLButtonElement>('button')].find(
        (button) => button.getAttribute('aria-label') === site.previousCategoriesLabel,
      )
    }
    if (!previous) throw new Error('Previous categories control did not render')
    const previousLeftGap = previous.getBoundingClientRect().left - railBox.left
    if (Math.abs(previousLeftGap - 48) > 1) {
      throw new Error(
        `Previous categories control must sit 48px from the left, got ${previousLeftGap}px`,
      )
    }
    const previousMask = rail.querySelector<HTMLElement>(
      '[data-slot="header-category-control-mask"][data-direction="previous"]',
    )
    if (!previousMask) throw new Error('Previous categories gradient mask did not render')
    const previousMaskBox = previousMask.getBoundingClientRect()
    const previousMaskLeftGap = previousMaskBox.left - railBox.left
    if (
      Math.abs(previousMaskLeftGap - 48) > 1 ||
      Math.abs(previousMaskBox.width - 64) > 1 ||
      Math.abs(previousMaskBox.height - railBox.height) > 1
    ) {
      throw new Error('Previous categories gradient mask must be 64px wide and align with the control')
    }
    if (!getComputedStyle(previousMask).backgroundImage.includes('linear-gradient')) {
      throw new Error('Previous categories control must include an edge gradient mask')
    }
  },
}

export const Mobile: Story = {
  name: 'Mobile (<1024px)',
  globals: {
    viewport: { value: 'yamiMobile', isRotated: false },
  },
  render: (_args, { globals }) => <Header {...createHeaderProps(localeFromGlobals(globals.locale))} />,
  parameters: {
    docs: {
      description: {
        story:
          'Below `--breakpoints-desktop` the band swaps to the mobile chrome (Figma `2725:151904`): a 56px brand bar carrying the Mobile lockup, deliver-to, and inbox, over a 36px search field with visual search. The hall switcher, locale flag, account, cart, and category rail have no mobile counterpart and drop out entirely — this is a different anatomy, not a reflow.',
      },
    },
  },
  play: async ({ canvasElement, globals }) => {
    await validateMobileBand(canvasElement, headerStorefront[localeFromGlobals(globals.locale)])
  },
}

export const DarkTheme: Story = {
  globals: {
    theme: 'dark',
    viewport: { value: 'yamiDesktopLg', isRotated: false },
  },
  render: (_args, { globals }) => <Header {...createHeaderProps(localeFromGlobals(globals.locale))} />,
  parameters: {
    docs: {
      description: {
        story:
          'The Fill lockup carries a `#222222` wordmark, which is invisible on a dark band. `darkLogo` / `darkMobileLogo` supply the same locked lockup with a white wordmark, and `.dark` swaps the file in CSS — the mark and wordmark are never assembled in code, which the brand guidelines forbid.',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const lockups = [
      ...canvasElement.querySelectorAll<HTMLImageElement>('[data-slot="header-brand"] img'),
    ]
    if (lockups.length !== 2) {
      throw new Error(`Expected a light and a dark lockup, found ${lockups.length}`)
    }

    const light = lockups.find((image) => image.dataset.theme === 'light')
    const dark = lockups.find((image) => image.dataset.theme === 'dark')
    if (!light || !dark) throw new Error('Lockups must declare which theme they serve')
    if (getComputedStyle(light).display !== 'none') {
      throw new Error('The light lockup must be hidden on a dark band')
    }
    if (getComputedStyle(dark).display === 'none') {
      throw new Error('The dark lockup must be shown on a dark band')
    }

    // display:none drops the hidden lockup from the accessibility tree, so the
    // brand slot must still expose exactly one name.
    if (!dark.alt) throw new Error('The dark lockup must carry the brand accessible name')

    // The white wordmark is the whole point — a dark lockup that still ships
    // #222222 would pass every geometric check and be unreadable.
    const source = decodeURIComponent(dark.getAttribute('src') ?? '')
    if (source.includes('#222222')) {
      throw new Error('The dark lockup must not keep the #222222 wordmark')
    }
    if (!/#FFFFFF/i.test(source)) {
      throw new Error('The dark lockup must paint the wordmark white')
    }
    // The mark stays brand red in both themes.
    if (!/#FF0000/i.test(source)) {
      throw new Error('The dark lockup must keep the brand-red mark')
    }
  },
}

export const Playground: Story = {}
