/**
 * Footer.figma.tsx — PC Figma Code Connect binding.
 *
 * The binding targets the verified 1920px PC variant. The 1440px and 1024px
 * variants are represented by the component's responsive CSS.
 */

import { figma } from '@figma/code-connect'

import { Footer } from './Footer'
import type { FooterColumn } from './Footer.types'

const FIGMA_FILE = 'https://www.figma.com/design/6oOAy72DBff4P6NzJYc2hi/YAMI-UI-UX-Guidelines'

const columns: FooterColumn[] = [
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

figma.connect(Footer, `${FIGMA_FILE}?node-id=6970-69276`, {
  props: {},
  example: () => (
    <Footer
      columns={columns}
      socialLinks={[
        {
          id: 'facebook',
          label: 'Facebook',
          icon: { src: '/images/social/facebook.svg', alt: '' },
        },
      ]}
      subscribe={{
        title: "Let's keep in touch",
        label: 'Email',
        placeholder: 'Email',
        submitLabel: 'Subscribe',
      }}
      appTitle="Shop on the go. Get the app."
      appLinks={[
        { id: 'app-store', label: 'App Store' },
        { id: 'google-play', label: 'Google Play' },
      ]}
      copyright={[
        '© Copyright 2012-2019 Yamibuy.com 140 South State College Blvd, Suite 300, Brea, CA 92821',
        "Yamibuy.com is operated by Transocean Resources Management, Inc. Yamibuy.com holds a valid California seller's permit.",
        'For more merchant information please contact help@yamibuy.com',
        'All rights reserved by Yamibuy.com',
      ]}
    />
  ),
})
