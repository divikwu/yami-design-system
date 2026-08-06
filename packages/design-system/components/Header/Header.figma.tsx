/**
 * Header.figma.tsx — PC Figma Code Connect binding.
 *
 * Mobile header is a separate component and gets its own binding when it ships.
 */

import { figma } from '@figma/code-connect'

import { Header } from './Header'
import type { HeaderCategory, HeaderImage } from './Header.types'

const FIGMA_FILE = 'https://www.figma.com/design/6oOAy72DBff4P6NzJYc2hi/YAMI-UI-UX-Guidelines'

/**
 * Brand lockup comes from the DS logo library, picked by storefront language.
 * Paths must stay literal so Vite can resolve `new URL(...)`.
 */
const LOGOS: Record<'en' | 'zh', HeaderImage> = {
  en: { src: new URL('../../assets/logos/yami-ui-en-pc-fill.svg', import.meta.url).href, alt: 'YAMI' },
  zh: { src: new URL('../../assets/logos/yami-ui-cn-pc-fill.svg', import.meta.url).href, alt: '亚米' },
}

const categories: HeaderCategory[] = [
  { id: 'categories', label: 'Categories', href: '/en/category/all' },
  {
    id: 'health',
    label: 'Health',
    href: '/en/c/health/7',
    image: { src: '/images/categories/health.png', alt: 'Health' },
    badges: ['999+'],
  },
]

figma.connect(Header, `${FIGMA_FILE}?node-id=5777-562353`, {
  props: {},
  example: () => (
    <Header
      logo={LOGOS.en}
      halls={[
        { id: 'all', label: 'All' },
        { id: 'beauty', label: 'Beauty' },
      ]}
      zipcode={{ code: '91789', label: 'Deliver to' }}
      categories={categories}
      searchPlaceholder="Best 300K Asian products to explore"
      account={{ label: 'Sign In / Sign Up', href: '/en/account' }}
      locale={{
        label: 'EN',
        flag: { src: '/images/flags/us.svg', alt: 'United States' },
      }}
      cart={{ label: 'Shopping cart', href: '/en/cart', count: 0 }}
    />
  ),
})
