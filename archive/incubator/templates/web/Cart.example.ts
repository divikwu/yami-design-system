import type { CartProps } from './Cart'

/**
 * Canonical example data for CartTemplate.
 *
 * Co-located with the template so both are typechecked together — any
 * prop-shape change breaks this file at build time. Consumed by
 * compose_page scaffold mode and by apps/docs for the live example page.
 *
 * Data is on-brand (YAMI's Asian-grocery catalog); prices and copy stay
 * in sync with copy-library/ui/empty-states.i18n.json#emptyCart. Numbers
 * should be kept plausibly consistent (subtotal = sum of line items) so
 * the example renders like a real cart, not a debug fixture.
 */
export const cartExampleData: CartProps = {
  items: [
    {
      id: 'sku-nongshim-shin-ramyun',
      brand: 'Nongshim',
      title: 'Shin Ramyun Gourmet Spicy · 辛拉面',
      priceCurrent: '$12.99',
      quantity: 2,
      maxQuantity: 10,
      imageAlt: 'Nongshim Shin Ramyun 5-pack',
    },
    {
      id: 'sku-calbee-jagabee',
      brand: 'Calbee',
      title: 'Jagabee Potato Sticks Salted · 薯条三兄弟',
      priceCurrent: '$4.49',
      quantity: 3,
      maxQuantity: 12,
      imageAlt: 'Calbee Jagabee 90g box',
    },
    {
      id: 'sku-pocky-matcha',
      brand: 'Glico',
      title: 'Pocky Matcha · 百奇抹茶味',
      priceCurrent: '$3.99',
      quantity: 4,
      imageAlt: 'Glico Pocky matcha flavor',
    },
  ],
  empty: {
    title: 'Your cart is empty · 购物车是空的',
    subtitle: 'Browse our catalog to discover Asian groceries delivered to your door.',
    action: 'Start Shopping · 开始购物',
  },
  summary: {
    subtotal: '$42.40',
    shipping: 'Free',
    tax: '$3.39',
    total: '$45.79',
    freeShippingHint: 'Free shipping unlocked · 已享免运费',
  },
  appliedCoupon: {
    code: 'FIRST10',
    label: 'FIRST10 · save $5',
    removable: true,
  },
  recommendations: [
    {
      id: 'sku-meiji-hello-panda',
      title: 'Meiji Hello Panda Chocolate · 小熊饼干',
      priceCurrent: '$2.99',
      imageAlt: 'Meiji Hello Panda box',
    },
    {
      id: 'sku-ito-en-oi-ocha',
      title: 'Ito En Oi Ocha Green Tea · 绿茶',
      priceCurrent: '$2.49',
      imageAlt: 'Ito En Oi Ocha bottle',
    },
  ],
}
