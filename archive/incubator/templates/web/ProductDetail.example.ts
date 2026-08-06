import type { ProductDetailProps } from './ProductDetail'

export const productDetailExampleData: ProductDetailProps = {
  breadcrumb: [
    { label: 'Home · 首页', href: '/' },
    { label: 'Snacks · 零食', href: '/category/snacks' },
    { label: 'Chips · 薯片' },
  ],
  product: {
    id: 'sku-calbee-jagabee',
    image: '',
    imageAlt: 'Calbee Jagabee 90g box',
    brand: 'Calbee',
    title: 'Jagabee Potato Sticks Salted · 薯条三兄弟',
    priceCurrent: '$4.49',
    priceOriginal: '$5.49',
    rating: 4.8,
    ratingCount: '1.2k',
    description:
      'Lightly salted potato sticks from Calbee — crispy, bite-size, and hard to stop at one box. A Yami staff favorite since 2021.',
    badges: [{ label: 'Best Seller', color: 'red' }],
  },
  showQuantity: true,
  reviews: {
    average: 4.8,
    count: 1243,
    distribution: [2, 3, 5, 15, 75],
  },
  relatedProducts: [
    {
      id: 'sku-pocky-matcha',
      href: '/product/sku-pocky-matcha',
      title: 'Pocky Matcha · 百奇抹茶味',
      priceCurrent: '$3.99',
      priceOriginal: '$4.99',
      imageAlt: 'Glico Pocky matcha flavor',
    },
    {
      id: 'sku-meiji-hello-panda',
      href: '/product/sku-meiji-hello-panda',
      title: 'Meiji Hello Panda Chocolate · 小熊饼干',
      priceCurrent: '$2.99',
      imageAlt: 'Meiji Hello Panda box',
    },
    {
      id: 'sku-nongshim-shin-ramyun',
      href: '/product/sku-nongshim-shin-ramyun',
      title: 'Shin Ramyun Gourmet Spicy · 辛拉面',
      priceCurrent: '$12.99',
      imageAlt: 'Nongshim Shin Ramyun 5-pack',
    },
  ],
}
