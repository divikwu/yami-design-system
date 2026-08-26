import { Header } from './Header'
import type { HeaderCategory, HeaderImage } from './Header.types'

/**
 * Brand lockup comes from the DS logo library, never a host-app copy. PC follows
 * the storefront language; Mobile always uses the English YAMI lockup. Paths
 * must stay literal so Vite can resolve `new URL(...)`.
 */
const LOGOS: Record<'en' | 'zh', HeaderImage> = {
  en: { src: new URL('../../assets/logos/yami-ui-en-pc-fill.svg', import.meta.url).href, alt: 'YAMI' },
  zh: { src: new URL('../../assets/logos/yami-ui-cn-pc-fill.svg', import.meta.url).href, alt: '亚米' },
}

/** Below 1024px the band uses the Mobile lockup variant, rendered 28px tall. */
const MOBILE_LOGO: HeaderImage = {
  src: new URL('../../assets/logos/yami-ui-en-mobile-fill.svg', import.meta.url).href,
  alt: 'YAMI',
}

const categories: HeaderCategory[] = [
  {
    // No image — the leading entry renders the built-in grid glyph.
    id: 'categories',
    label: 'Categories',
    href: '/en/category/all',
  },
  {
    id: 'health',
    label: 'Health',
    href: '/en/c/health/7',
    image: { src: '/images/categories/health.png', alt: 'Health' },
    badges: ['999+', 'NEW'],
  },
  {
    id: 'greater-china',
    label: 'Greater China Region',
    href: '/en/pages/china',
    image: { src: '/images/categories/greater-china.png', alt: 'Greater China Region' },
    startsGroup: true,
  },
]

export function PcHeader() {
  return (
    <Header
      logo={LOGOS.en}
      mobileLogo={MOBILE_LOGO}
      homeHref="/en"
      halls={[
        { id: 'all', label: 'All' },
        { id: 'beauty', label: 'Beauty' },
      ]}
      zipcode={{ code: '91789', label: 'Deliver to', href: '/en/delivery' }}
      categories={categories}
      searchPlaceholder="Best 300K Asian products to explore"
      onSearchSubmit={(query) => {
        window.location.assign(`/en/search?q=${encodeURIComponent(query)}`)
      }}
      account={{ label: 'Sign In / Sign Up', href: '/en/account' }}
      locale={{
        label: 'EN',
        flag: { src: '/images/flags/us.svg', alt: 'United States' },
        href: '/en/locale',
      }}
      cart={{ label: 'Shopping cart', href: '/en/cart', count: 0 }}
      inbox={{ label: 'Inbox', href: '/en/message' }}
      scanLabel="Search by photo"
      onScan={() => {
        window.location.assign('/en/visual-search')
      }}
    />
  )
}
