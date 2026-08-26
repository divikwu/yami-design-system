import type { ComponentProps } from 'react'
import type { ImageLoadingStrategy, ImageSource } from '../image.types'

/** An image slot. Category artwork, the brand lockup, and the locale flag are all images. */
export interface HeaderImage {
  src: ImageSource
  alt: string
}

/**
 * One storefront hall — the `All | Beauty` switcher left of the search field.
 *
 * Halls scope the whole storefront, not the search query. They sit in the brand
 * group for that reason.
 */
export interface HeaderHall {
  id: string
  label: string
}

/** One category entry in the second header row. */
export interface HeaderCategory {
  id: string
  /** Visible label under the artwork. Truncates at 76px. */
  label: string
  /** Destination for the category. Omit while navigation is not configured. */
  href?: string
  /**
   * Category artwork, rendered as a 24px `<img>` so campaign teams reskin
   * categories without a component release. Omit for the leading
   * "Categories" entry, which uses the built-in grid glyph.
   */
  image?: HeaderImage
  /**
   * Promotion count or flag anchored to the category's top-right corner, e.g.
   * `"999+"` or `"NEW"`. Promotion-only — see rule `red-usage`. Multiple
   * entries stack.
   */
  badges?: string[]
  /** Renders a vertical divider before this entry, opening a regional group. */
  startsGroup?: boolean
}

/** Deliver-to control beside the locale switcher and before the search field. */
export interface HeaderZipcode {
  /** Displayed postal code. */
  code: string
  /** Localized accessible name, e.g. "Deliver to". */
  label: string
  href?: string
}

export interface HeaderAccount {
  /** Visible label and accessible name, e.g. "Sign In / Sign Up". */
  label: string
  /** Destination for account access. Omit while navigation is not configured. */
  href?: string
}

export interface HeaderLocale {
  /** Short locale code shown beside the flag, e.g. "EN". */
  label: string
  /** Country flag artwork, rendered at 24px. */
  flag: HeaderImage
  href?: string
}

/**
 * Message centre entry, below 1024px only. The PC band routes messages through
 * the account menu instead, so this has no desktop counterpart.
 */
export interface HeaderInbox {
  /** Visible label under the icon and accessible name, e.g. "Inbox". */
  label: string
  /** Destination for the message centre. Omit while navigation is not configured. */
  href?: string
}

export interface HeaderCart {
  /**
   * Localized accessible name. The count is folded in by the component,
   * e.g. "Shopping cart, 3 items" — the chrome shows no visible count.
  */
  label: string
  /** Destination for the cart. Omit while navigation is not configured. */
  href?: string
  count?: number
}

export interface HeaderSearchTag {
  label: string
  /** Optional decorative artwork rendered before the label. */
  image?: HeaderImage
  /** Optional destination. Omit to fill the search field when selected. */
  href?: string
  /** Optional promotional suffix such as "Sale" or "New". */
  badge?: string
}

export interface HeaderSearchSuggestion {
  label: string
  image: HeaderImage
}

/** Content shown below the PC search field while it is active. */
export interface HeaderSearchPanel {
  recentTitle: string
  clearLabel: string
  recent: Array<string | HeaderSearchTag>
  popularTitle: string
  popular: HeaderSearchTag[]
  hotDealsTitle: string
  hotDeals: HeaderSearchTag[]
  suggestions: HeaderSearchSuggestion[]
}

export interface HeaderProps extends Omit<ComponentProps<'header'>, 'children'> {
  /** Mobile chrome anatomy. `pdp` uses the single-row H5 PDP navigation below 1024px. */
  mobileVariant?: 'default' | 'pdp'
  /** Brand lockup — `assets/logos/yami-ui-<lang>-pc-fill.svg`, 52px tall at PC. */
  logo: HeaderImage
  /**
   * Brand lockup below 1024px — `assets/logos/yami-ui-en-mobile-fill.svg`,
   * 28px tall in every locale. It is a distinct Figma variant with its own mark /
   * wordmark proportions, not the PC one scaled down. Falls back to `logo`.
   */
  mobileLogo?: HeaderImage
  /**
   * Brand lockup on dark surfaces — `assets/logos/yami-ui-<lang>-pc-fill-inverse.svg`.
   * Same locked lockup as `logo` with a white wordmark; the `#222222` wordmark
   * is invisible on a dark band. Swapped by CSS, not JS. Omit and the band
   * keeps `logo` in dark mode.
   */
  darkLogo?: HeaderImage
  /** Dark-surface counterpart to `mobileLogo`. Omit to keep `mobileLogo`. */
  darkMobileLogo?: HeaderImage
  /** Destination for the brand lockup. Omit while navigation is not configured. */
  homeHref?: string

  /** Storefront halls. Omit for a single-hall storefront. */
  halls?: HeaderHall[]
  /** Controlled active hall id. Uncontrolled selection falls back to the first hall. */
  hallId?: string
  onHallChange?: (hallId: string) => void

  /** Deliver-to control. Omit to hide it. */
  zipcode?: HeaderZipcode

  /** Category rail entries, in display order. */
  categories: HeaderCategory[]

  searchPlaceholder?: string
  /** Controlled query. Leave undefined for an uncontrolled field. */
  searchValue?: string
  onSearchValueChange?: (value: string) => void
  onSearchSubmit?: (query: string) => void
  /** PC search discovery content. Omit to keep the field without a popover. */
  searchPanel?: HeaderSearchPanel
  /** Destination opened when the mobile search field is activated. */
  mobileSearchHref?: string
  /** Visual search, mobile field only. Omit while the entry is not configured. */
  onScan?: () => void

  account: HeaderAccount
  locale: HeaderLocale
  cart: HeaderCart
  /** Message centre entry, rendered below 1024px only. Omit to hide it. */
  inbox?: HeaderInbox

  /** Localized accessible name for the banner landmark. */
  ariaLabel?: string
  /** Localized accessible name for the hall switcher. */
  hallsLabel?: string
  /** Localized accessible name for the category rail. */
  categoriesLabel?: string
  /** Localized accessible name for the search landmark and submit control. */
  searchLabel?: string
  /** Localized accessible name for the mobile field's visual-search control. */
  scanLabel?: string
  /** Localized accessible name for the rail's forward paging control. */
  nextCategoriesLabel?: string
  /** Localized accessible name for the rail's backward paging control. */
  previousCategoriesLabel?: string
  imageLoadingStrategy?: ImageLoadingStrategy
}

export interface HeaderSearchProps {
  placeholder: string
  value: string | undefined
  onValueChange: ((value: string) => void) | undefined
  onSubmit: ((query: string) => void) | undefined
  searchLabel: string
  panel?: HeaderSearchPanel
  /** Destination opened when the mobile field is activated. */
  openHref?: string
  /**
   * `pc` is the 40px field embedded in the utility row. `mobile` is the 36px
   * field on its own row below the brand bar, which carries an extra
   * visual-search control. Defaults to `pc`.
   */
  variant?: 'pc' | 'mobile'
  /** Accessible name for the visual-search control. Required by `mobile`. */
  scanLabel?: string
  onScan?: () => void
}

export interface HeaderCategoryRailProps {
  categories: HeaderCategory[]
  ariaLabel: string
  previousLabel: string
  nextLabel: string
  imageLoadingStrategy?: ImageLoadingStrategy
}
