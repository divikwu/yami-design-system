/**
 * Demo content for Footer stories and examples.
 *
 * Copy follows the English Figma Footer variants so the story exercises the
 * same five groups and four visual columns at every PC breakpoint.
 * Destinations are deliberately omitted — the footer is CMS-routed in
 * production, and the DS renders unlinked labels when `href` is absent.
 *
 * Social and app-store glyphs come from the maintained DS set. The payment
 * marks use the exact exported artwork from the Footer closing-bar Figma
 * nodes, so the fixture matches the production-sized marks without relying on
 * the site's private icon font.
 */

import type {
  FooterAppLink,
  FooterColumn,
  FooterLegalLink,
  FooterPaymentMark,
  FooterSocialLink,
} from './Footer.types'

export type FooterLocale = 'en' | 'zh'

/* `new URL(..., import.meta.url)` only resolves when the path is a static string
 * literal — Vite cannot analyze a template literal, which yields a broken image.
 * Each glyph therefore gets its own literal. */
const socialIcons = {
  facebook: new URL('../../assets/icons/social-monochrome/facebook.svg', import.meta.url).href,
  twitter: new URL('../../assets/icons/social-monochrome/twitter.svg', import.meta.url).href,
  youtube: new URL('../../assets/icons/social-monochrome/youtube.svg', import.meta.url).href,
  instagram: new URL('../../assets/icons/social-monochrome/instagram.svg', import.meta.url).href,
  reddit: new URL('../../assets/icons/social-monochrome/reddit.svg', import.meta.url).href,
} as const

const appIcons = {
  appStore: new URL('../../assets/icons/social/apple.svg', import.meta.url).href,
  googlePlay: new URL('../../assets/icons/social/google-play.svg', import.meta.url).href,
} as const

const paymentIcons = {
  inc500: new URL('./assets/payment/inc-500.png', import.meta.url).href,
  ssl: new URL('./assets/payment/ssl-site-seal.png', import.meta.url).href,
  visa: new URL('./assets/payment/visa.png', import.meta.url).href,
  mastercard: new URL('./assets/payment/mastercard.png', import.meta.url).href,
  discover: new URL('./assets/payment/discover.png', import.meta.url).href,
  americanExpress: new URL('./assets/payment/american-express.png', import.meta.url).href,
  paypal: new URL('./assets/payment/paypal.png', import.meta.url).href,
  unionpay: new URL('./assets/payment/unionpay.png', import.meta.url).href,
  alipay: new URL('./assets/payment/alipay.png', import.meta.url).href,
  wechatpay: new URL('./assets/payment/wechatpay.png', import.meta.url).href,
} as const

export const footerCopy = {
  en: {
    ariaLabel: 'YAMI',
    subscribeTitle: "Let's keep in touch",
    subscribeLabel: 'Email',
    subscribePlaceholder: 'Email',
    subscribeSubmit: 'Subscribe',
    appTitle: 'Shop on the go. Get the app.',
    copyright: [
      '© Copyright 2012-2019 Yamibuy.com 140 South State College Blvd, Suite 300, Brea, CA 92821',
      "Yamibuy.com is operated by Transocean Resources Management, Inc. Yamibuy.com holds a valid California seller's permit.",
      'For more merchant information please contact help@yamibuy.com',
      'All rights reserved by Yamibuy.com',
    ],
  },
  zh: {
    ariaLabel: '亚米',
    subscribeTitle: '保持联系',
    subscribeLabel: '邮箱',
    subscribePlaceholder: '邮箱',
    subscribeSubmit: '订阅',
    appTitle: '下载亚米 App，随时随地购物。',
    copyright: [
      '© 版权所有 2012-2019 Yamibuy.com 140 South State College Blvd, Suite 300, Brea, CA 92821',
      'Yamibuy.com 由 Transocean Resources Management, Inc. 运营，并持有有效的加州卖家许可证。',
      '如需更多商家信息，请联系 help@yamibuy.com',
      'Yamibuy.com 保留所有权利。',
    ],
  },
} satisfies Record<
  FooterLocale,
  {
    ariaLabel: string
    subscribeTitle: string
    subscribeLabel: string
    subscribePlaceholder: string
    subscribeSubmit: string
    appTitle: string
    copyright: readonly string[]
  }
>

const columnsEn: FooterColumn[] = [
  {
    id: 'column-1',
    groups: [
      {
        id: 'about',
        title: 'About Yami',
        links: [
          { id: 'about-us', label: 'About Us' },
          { id: 'quality', label: 'Quality Guarantee' },
          { id: 'sell-on-yami', label: 'Sell on Yami' },
          { id: 'contact', label: 'Contact Us' },
          { id: 'join', label: 'Join Us' },
        ],
      },
    ],
  },
  {
    id: 'column-2',
    groups: [
      {
        id: 'my-yami',
        title: 'My Yami',
        links: [
          { id: 'points', label: 'Points' },
          { id: 'rewards', label: 'Rewards' },
          { id: 'referral', label: 'Referral Program' },
        ],
      },
    ],
  },
  {
    id: 'column-3',
    groups: [
      {
        id: 'help',
        title: 'Help',
        links: [
          { id: 'faq', label: 'FAQ' },
          { id: 'fulfilled', label: 'Fulfilled by Yami' },
          { id: 'marketplace', label: 'Yami Marketplace' },
          { id: 'returns', label: 'Return Policy' },
          { id: 'price-protection', label: 'Price Protection Policy' },
          { id: 'one-day', label: '1-Day Delivery' },
        ],
      },
    ],
  },
  {
    id: 'column-4',
    groups: [
      {
        id: 'make-money',
        title: 'Make Money with Us',
        links: [
          { id: 'sell', label: 'Sell Products on Yami' },
          { id: 'supply', label: 'Supply to Yami' },
        ],
      },
      {
        id: 'contact',
        title: 'Contact Us',
        links: [
          { id: 'phone', label: '1 800 407 9710' },
          { id: 'email', label: 'help@yamibuy.com' },
          { id: 'feedback', label: 'Feedback' },
        ],
      },
    ],
  },
]

const columnsZh: FooterColumn[] = [
  {
    id: 'column-1',
    groups: [
      {
        id: 'about',
        title: '关于亚米',
        links: [
          { id: 'about-us', label: '关于我们' },
          { id: 'quality', label: '品质保证' },
          { id: 'sell-on-yami', label: '在亚米售卖' },
          { id: 'contact', label: '联系我们' },
          { id: 'join', label: '加入我们' },
        ],
      },
    ],
  },
  {
    id: 'column-2',
    groups: [
      {
        id: 'my-yami',
        title: '我的亚米',
        links: [
          { id: 'points', label: '积分' },
          { id: 'rewards', label: '奖励' },
          { id: 'referral', label: '推荐计划' },
        ],
      },
    ],
  },
  {
    id: 'column-3',
    groups: [
      {
        id: 'help',
        title: '帮助中心',
        links: [
          { id: 'faq', label: '常见问题' },
          { id: 'fulfilled', label: '亚米自营配送' },
          { id: 'marketplace', label: '亚米商城' },
          { id: 'returns', label: '退货政策' },
          { id: 'price-protection', label: '价格保护政策' },
          { id: 'one-day', label: '次日达' },
        ],
      },
    ],
  },
  {
    id: 'column-4',
    groups: [
      {
        id: 'make-money',
        title: '商家合作',
        links: [
          { id: 'sell', label: '入驻亚米' },
          { id: 'supply', label: '供货亚米' },
        ],
      },
      {
        id: 'contact',
        title: '联系我们',
        links: [
          { id: 'phone', label: '1 800 407 9710' },
          { id: 'email', label: 'help@yamibuy.com' },
          { id: 'feedback', label: '意见反馈' },
        ],
      },
    ],
  },
]

const socialLabels: Record<FooterLocale, Record<string, string>> = {
  en: {
    facebook: 'Facebook',
    twitter: 'X',
    youtube: 'YouTube',
    instagram: 'Instagram',
    reddit: 'Reddit',
  },
  zh: {
    facebook: 'Facebook',
    twitter: 'X',
    youtube: 'YouTube',
    instagram: 'Instagram',
    reddit: 'Reddit',
  },
}

const legalEn: FooterLegalLink[] = [
  { id: 'terms', label: 'Terms of Use' },
  { id: 'privacy', label: 'Privacy Policy' },
  { id: 'cookie', label: 'Cookie Policy' },
  { id: 'accessibility', label: 'Accessibility' },
  {
    id: 'license',
    label: 'Business license',
    ariaLabel:
      'View Business License. This link opens an image file of the business license directly.',
  },
  { id: 'privacy-choices', label: 'Your Privacy Choices' },
]

const legalZh: FooterLegalLink[] = [
  { id: 'terms', label: '使用条款' },
  { id: 'privacy', label: '隐私政策' },
  { id: 'cookie', label: 'Cookie 政策' },
  { id: 'accessibility', label: '无障碍声明' },
  {
    id: 'license',
    label: '营业执照',
    ariaLabel: '查看营业执照。此链接将直接打开营业执照图片文件。',
  },
  { id: 'privacy-choices', label: '隐私选择' },
]

export function createFooterColumns(locale: FooterLocale): FooterColumn[] {
  return locale === 'zh' ? columnsZh : columnsEn
}

export function createFooterSocialLinks(locale: FooterLocale): FooterSocialLink[] {
  const labels = socialLabels[locale]
  return (['facebook', 'twitter', 'youtube', 'instagram', 'reddit'] as const).map((id) => ({
    id,
    label: labels[id],
    icon: { src: socialIcons[id], alt: '' },
  }))
}

export function createFooterAppLinks(): FooterAppLink[] {
  return [
    {
      id: 'app-store',
      label: 'App Store',
      icon: { src: appIcons.appStore, alt: '' },
    },
    {
      id: 'google-play',
      label: 'Google Play',
      icon: { src: appIcons.googlePlay, alt: '' },
    },
  ]
}

export function createFooterPaymentMarks(): FooterPaymentMark[] {
  return [
    { id: 'inc500', label: 'Inc. 500', src: paymentIcons.inc500 },
    { id: 'ssl', label: 'SSL site seal', src: paymentIcons.ssl },
    { id: 'visa', label: 'Visa', src: paymentIcons.visa },
    { id: 'mastercard', label: 'Mastercard', src: paymentIcons.mastercard },
    { id: 'discover', label: 'Discover', src: paymentIcons.discover },
    { id: 'amex', label: 'American Express', src: paymentIcons.americanExpress },
    { id: 'paypal', label: 'PayPal', src: paymentIcons.paypal },
    { id: 'unionpay', label: 'UnionPay', src: paymentIcons.unionpay },
    { id: 'alipay', label: 'Alipay', src: paymentIcons.alipay },
    { id: 'wechatpay', label: 'WeChat Pay', src: paymentIcons.wechatpay },
  ].map(({ id, label, src }) => ({
    id,
    label,
    icon: { src, alt: label },
  }))
}

export function createFooterLegalLinks(locale: FooterLocale): FooterLegalLink[] {
  return locale === 'zh' ? legalZh : legalEn
}
