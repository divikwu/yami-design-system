/**
 * Demo content for Header stories, examples, and the EcommerceHome page.
 *
 * Mirrors the production www.yami.com chrome. Shared so the page template and
 * the component story cannot drift — the same rail, copy, and brand assets back
 * both. Destinations are opt-in via `href`: the component story renders
 * everything non-navigating (production wires these through the CMS), while a
 * page template passes a builder to get real anchors.
 */

import type {
  HeaderCategory,
  HeaderHall,
  HeaderProps,
  HeaderSearchPanel,
} from './Header.types'

export type HeaderLocale = 'en' | 'zh'

/** Builds a destination per slot. Omit to render everything non-navigating. */
export interface HeaderFixtureOptions {
  href?: (slot: string) => string
}

const logoEn = new URL('../../assets/logos/yami-ui-en-pc-fill.svg', import.meta.url).href
const logoZh = new URL('../../assets/logos/yami-ui-cn-pc-fill.svg', import.meta.url).href
// Below 1024px the band uses the Mobile lockup variant — its own mark /
// wordmark proportions, not the PC file scaled down.
const mobileLogoEn = new URL('../../assets/logos/yami-ui-en-mobile-fill.svg', import.meta.url).href
const mobileLogoZh = new URL('../../assets/logos/yami-ui-cn-mobile-fill.svg', import.meta.url).href
// Dark surfaces get the same locked lockup with a white wordmark — the Fill
// wordmark is #222222 and vanishes on a dark band.
const darkLogoEn = new URL('../../assets/logos/yami-ui-en-pc-fill-inverse.svg', import.meta.url).href
const darkLogoZh = new URL('../../assets/logos/yami-ui-cn-pc-fill-inverse.svg', import.meta.url).href
const darkMobileLogoEn = new URL('../../assets/logos/yami-ui-en-mobile-fill-inverse.svg', import.meta.url).href
const darkMobileLogoZh = new URL('../../assets/logos/yami-ui-cn-mobile-fill-inverse.svg', import.meta.url).href
// Locale flag comes from the maintained DS icon set (Assets → Icons → area),
// not from this component's fixture folder.
const flagUs = new URL('../../assets/icons/area/united-states.svg', import.meta.url).href
const SEARCH_SUGGESTION_IMAGES = {
  mat: new URL('./assets/search-suggestions/mat.jpeg', import.meta.url).href,
  'matcha bowl': new URL('./assets/search-suggestions/matcha-bowl.jpeg', import.meta.url).href,
  'matcha cake': new URL('./assets/search-suggestions/matcha-cake.png', import.meta.url).href,
  'matcha candy': new URL('./assets/search-suggestions/matcha-candy.png', import.meta.url).href,
  'matcha chocolate': new URL('./assets/search-suggestions/matcha-chocolate.jpeg', import.meta.url).href,
  'matcha cookie': new URL('./assets/search-suggestions/matcha-cookie.jpeg', import.meta.url).href,
  'matcha latte': new URL('./assets/search-suggestions/matcha-latte.jpeg', import.meta.url).href,
  'matcha powder': new URL('./assets/search-suggestions/matcha-powder.jpeg', import.meta.url).href,
  'matcha set': new URL('./assets/search-suggestions/matcha-set.jpeg', import.meta.url).href,
  'matcha snack': new URL('./assets/search-suggestions/matcha-snack.jpeg', import.meta.url).href,
  'matcha whisk': new URL('./assets/search-suggestions/matcha-whisk.jpeg', import.meta.url).href,
  matcha: new URL('./assets/search-suggestions/matcha.png', import.meta.url).href,
} as const

const SEARCH_PANEL_EN = {
  recentTitle: 'Recent Searches',
  clearLabel: 'Clear',
  recent: ['Coffee', 'korean spicy noodle', 'Japanese candy', 'ramen', 'coffee', 'wet wipes', 'milk tea'],
  popularTitle: 'Popular Searches',
  popular: [
    { label: "Father's Day Gifts" },
    { label: 'C-Beauty Spotlight' },
    { label: 'Monchhichi, Hello Kitty, and More!' },
    { label: 'Natural Korean Skincare iUNIK New' },
    { label: 'Natural Korean Skincare iUNIK New' },
    { label: 'K-Pharmacy Trendy Picks Hot' },
  ],
  hotDealsTitle: 'Hot Deals',
  hotDeals: [
    { label: "Father's Day Gifts" },
    { label: 'C-Beauty Spotlight', badge: 'Sale' },
    { label: 'Monchhichi, Hello Kitty, and More!', badge: 'Sale' },
    { label: 'Natural Korean Skincare iUNIK New' },
    { label: 'Natural Korean Skincare iUNIK New', badge: 'New' },
    { label: 'K-Pharmacy Trendy Picks Hot' },
  ],
  suggestions: [
    'mat',
    'matcha bowl',
    'matcha cake',
    'matcha candy',
    'matcha chocolate',
    'matcha cookie',
    'matcha latte',
    'matcha powder',
    'matcha set',
    'matcha snack',
    'matcha whisk',
    'matcha',
  ].map((label) => ({
    label,
    image: {
      src: SEARCH_SUGGESTION_IMAGES[label as keyof typeof SEARCH_SUGGESTION_IMAGES],
      alt: label,
    },
  })),
} satisfies HeaderSearchPanel
/**
 * Category artwork, mirrored from the production PC header.
 *
 * Paths must stay literal — Vite only resolves `new URL(...)` statically, and a
 * template literal degrades to a dynamic import that serves a JS module
 * instead of the image.
 *
 * A few slugs carry a `-zh` suffix: the EN and CN storefronts are separate CMS
 * feeds and ship different artwork for those categories.
 */
const ARTWORK = {
  'summer-picks': new URL('./assets/summer-picks.png', import.meta.url).href,
  'summer-picks-zh': new URL('./assets/summer-picks-zh.png', import.meta.url).href,
  snack: new URL('./assets/snack.png', import.meta.url).href,
  grocery: new URL('./assets/grocery.png', import.meta.url).href,
  beverage: new URL('./assets/beverage.png', import.meta.url).href,
  beauty: new URL('./assets/beauty.png', import.meta.url).href,
  'personal-care': new URL('./assets/personal-care.png', import.meta.url).href,
  'personal-care-zh': new URL('./assets/personal-care-zh.png', import.meta.url).href,
  home: new URL('./assets/home.png', import.meta.url).href,
  electronics: new URL('./assets/electronics.png', import.meta.url).href,
  'baby-and-mom': new URL('./assets/baby-and-mom.png', import.meta.url).href,
  health: new URL('./assets/health.png', import.meta.url).href,
  clothing: new URL('./assets/clothing.png', import.meta.url).href,
  gifts: new URL('./assets/gifts.png', import.meta.url).href,
  'k-trend': new URL('./assets/k-trend.png', import.meta.url).href,
  'greater-china': new URL('./assets/greater-china.png', import.meta.url).href,
  japan: new URL('./assets/japan.png', import.meta.url).href,
  korea: new URL('./assets/korea.png', import.meta.url).href,
  'southeast-asia': new URL('./assets/southeast-asia.png', import.meta.url).href,
  'best-sellers': new URL('./assets/best-sellers.png', import.meta.url).href,
  'new-arrivals': new URL('./assets/new-arrivals.png', import.meta.url).href,
  brands: new URL('./assets/brands.png', import.meta.url).href,
  sale: new URL('./assets/sale.png', import.meta.url).href,
  'influencer-picks': new URL('./assets/influencer-picks.png', import.meta.url).href,
  subscribe: new URL('./assets/subscribe.png', import.meta.url).href,
  'gift-card': new URL('./assets/gift-card.png', import.meta.url).href,
}

type ArtworkSlug = keyof typeof ARTWORK

interface CategoryFixture {
  id: string
  label: string
  /** Undefined for the leading entry, which renders the built-in grid glyph. */
  slug?: ArtworkSlug
  badges?: string[]
  startsGroup?: boolean
}

/** EN storefront rail — 24 entries. */
const CATEGORIES_EN: CategoryFixture[] = [
  { id: 'categories', label: 'Categories' },
  { id: 'summer-picks', label: 'Summer Picks', slug: 'summer-picks' },
  { id: 'snack', label: 'Snack', slug: 'snack' },
  { id: 'grocery', label: 'Grocery', slug: 'grocery' },
  { id: 'beverage', label: 'Beverage', slug: 'beverage' },
  { id: 'beauty', label: 'Beauty', slug: 'beauty' },
  { id: 'personal-care', label: 'Personal Care', slug: 'personal-care' },
  { id: 'home', label: 'Home', slug: 'home' },
  { id: 'electronics', label: 'Electronics', slug: 'electronics' },
  { id: 'baby-and-mom', label: 'Baby & Mom', slug: 'baby-and-mom' },
  { id: 'health', label: 'Health', slug: 'health', badges: ['999+', 'NEW'] },
  { id: 'clothing', label: 'Clothing', slug: 'clothing' },
  { id: 'gifts', label: 'Gifts', slug: 'gifts' },
  { id: 'k-trend', label: 'K-Trend', slug: 'k-trend' },
  {
    id: 'greater-china',
    label: 'Greater China Region',
    slug: 'greater-china',
    startsGroup: true,
  },
  { id: 'japan', label: 'Japan', slug: 'japan' },
  { id: 'korea', label: 'Korea', slug: 'korea' },
  { id: 'southeast-asia', label: 'Southeast Asia', slug: 'southeast-asia' },
  { id: 'best-sellers', label: 'Best Sellers', slug: 'best-sellers' },
  { id: 'new-arrivals', label: 'New Arrivals', slug: 'new-arrivals' },
  { id: 'brands', label: 'Brands', slug: 'brands' },
  { id: 'sale', label: 'Sale', slug: 'sale' },
  { id: 'subscribe', label: 'Subscribe', slug: 'subscribe' },
  { id: 'gift-card', label: 'Gift Card', slug: 'gift-card' },
]

/** CN storefront rail — 25 entries, its own labels, order, and badge target. */
const CATEGORIES_ZH: CategoryFixture[] = [
  { id: 'categories', label: '全部分类' },
  { id: 'summer-picks', label: '凉夏好物', slug: 'summer-picks-zh' },
  { id: 'snack', label: '零食', slug: 'snack' },
  { id: 'grocery', label: '速食粮油', slug: 'grocery' },
  { id: 'beverage', label: '饮料', slug: 'beverage' },
  { id: 'beauty', label: '美妆', slug: 'beauty' },
  { id: 'personal-care', label: '个护', slug: 'personal-care-zh' },
  { id: 'electronics', label: '厨电家电', slug: 'electronics', badges: ['100+', '上新'] },
  { id: 'home', label: '家居生活', slug: 'home' },
  { id: 'health', label: '健康保健', slug: 'health' },
  { id: 'baby-and-mom', label: '母婴辅食', slug: 'baby-and-mom' },
  { id: 'clothing', label: '服装', slug: 'clothing' },
  { id: 'gifts', label: '送礼指南', slug: 'gifts' },
  { id: 'k-trend', label: '遇见首尔', slug: 'k-trend' },
  { id: 'greater-china', label: '大中华', slug: 'greater-china', startsGroup: true },
  { id: 'japan', label: '日本', slug: 'japan' },
  { id: 'korea', label: '韩国', slug: 'korea' },
  { id: 'southeast-asia', label: '东南亚', slug: 'southeast-asia' },
  { id: 'best-sellers', label: '热销榜单', slug: 'best-sellers' },
  { id: 'brands', label: '全部品牌', slug: 'brands' },
  { id: 'new-arrivals', label: '新品', slug: 'new-arrivals' },
  { id: 'sale', label: '折扣', slug: 'sale' },
  { id: 'influencer-picks', label: '网红好味', slug: 'influencer-picks' },
  { id: 'subscribe', label: '订阅福利', slug: 'subscribe' },
  { id: 'gift-card', label: '亚米礼卡', slug: 'gift-card' },
]

/**
 * Per-locale storefront chrome.
 *
 * `halls` is EN-only: the CN storefront ships no hall switcher, and separates
 * the lockup from the deliver-to control with a rule instead.
 */
const STOREFRONT = {
  en: {
    logo: logoEn,
    mobileLogo: mobileLogoEn,
    darkLogo: darkLogoEn,
    darkMobileLogo: darkMobileLogoEn,
    logoAlt: 'YAMI',
    inbox: 'Inbox',
    scanLabel: 'Search by photo',
    categories: CATEGORIES_EN,
    halls: [
      { id: 'all', label: 'All' },
      { id: 'beauty', label: 'Beauty' },
    ] as HeaderHall[],
    hallsLabel: 'Storefront',
    zipcode: { code: '91789', label: 'Deliver to' },
    searchPlaceholder: 'Best 300K Asian products to explore',
    account: 'Sign In / Sign Up',
    cart: 'Shopping cart',
    localeCode: 'EN',
    localeName: 'United States · English',
    flagAlt: 'United States',
    ariaLabel: 'YAMI',
    categoriesLabel: 'Shop by category',
    searchLabel: 'Search',
    nextCategoriesLabel: 'More categories',
    previousCategoriesLabel: 'Previous categories',
  },
  zh: {
    logo: logoZh,
    mobileLogo: mobileLogoZh,
    darkLogo: darkLogoZh,
    darkMobileLogo: darkMobileLogoZh,
    logoAlt: '亚米',
    inbox: '消息',
    scanLabel: '拍照搜索',
    categories: CATEGORIES_ZH,
    halls: undefined,
    hallsLabel: '商城',
    zipcode: { code: '94199', label: '配送至' },
    searchPlaceholder: '沃集鲜网红爆款来啦',
    account: '登录/注册',
    cart: '购物车',
    localeCode: 'CN',
    localeName: '美国 · 中文',
    flagAlt: '美国',
    ariaLabel: '亚米',
    categoriesLabel: '按分类浏览',
    searchLabel: '搜索',
    nextCategoriesLabel: '更多分类',
    previousCategoriesLabel: '上一组分类',
  },
} as const

function toCategories(fixture: readonly CategoryFixture[]): HeaderCategory[] {
  return fixture.map((entry) => {
    const category: HeaderCategory = {
      id: entry.id,
      label: entry.label,
    }
    if (entry.slug) category.image = { src: ARTWORK[entry.slug], alt: entry.label }
    if (entry.badges) category.badges = [...entry.badges]
    if (entry.startsGroup) category.startsGroup = entry.startsGroup
    return category
  })
}

function createArgs(locale: HeaderLocale): HeaderProps {
  const site = STOREFRONT[locale]
  const args: HeaderProps = {
    logo: { src: site.logo, alt: site.logoAlt },
    mobileLogo: { src: site.mobileLogo, alt: site.logoAlt },
    darkLogo: { src: site.darkLogo, alt: site.logoAlt },
    darkMobileLogo: { src: site.darkMobileLogo, alt: site.logoAlt },
    zipcode: { ...site.zipcode },
    inbox: { label: site.inbox },
    scanLabel: site.scanLabel,
    categories: toCategories(site.categories),
    searchPlaceholder: site.searchPlaceholder,
    searchPanel: locale === 'en' ? SEARCH_PANEL_EN : undefined,
    account: { label: site.account },
    locale: {
      label: site.localeCode,
      flag: { src: flagUs, alt: site.flagAlt },
    },
    cart: { label: site.cart, count: 0 },
    ariaLabel: site.ariaLabel,
    hallsLabel: site.hallsLabel,
    categoriesLabel: site.categoriesLabel,
    searchLabel: site.searchLabel,
    nextCategoriesLabel: site.nextCategoriesLabel,
    previousCategoriesLabel: site.previousCategoriesLabel,
  }
  if (site.halls) args.halls = [...site.halls]
  return args
}

/** The rail for one storefront. */
export function createHeaderCategories(
  locale: HeaderLocale,
  options: HeaderFixtureOptions = {},
): HeaderCategory[] {
  const categories = toCategories(STOREFRONT[locale].categories)
  if (!options.href) return categories
  return categories.map((category) => ({
    ...category,
    href: options.href!(`category-${category.id}`),
  }))
}

/** A complete storefront header. */
export function createHeaderProps(
  locale: HeaderLocale,
  options: HeaderFixtureOptions = {},
): HeaderProps {
  const props = createArgs(locale)
  props.categories = createHeaderCategories(locale, options)
  if (!options.href) return props

  const href = options.href
  props.homeHref = href('home')
  props.account = { ...props.account, href: href('account') }
  props.cart = { ...props.cart, href: href('cart') }
  props.locale = { ...props.locale, href: href('locale') }
  if (props.zipcode) props.zipcode = { ...props.zipcode, href: href('delivery') }
  if (props.inbox) props.inbox = { ...props.inbox, href: href('inbox') }
  return props
}

export { STOREFRONT as headerStorefront }
