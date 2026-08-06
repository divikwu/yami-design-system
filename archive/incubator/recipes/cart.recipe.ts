import type { PageRecipe } from './types'

/**
 * cart — shopping cart page.
 *
 * Layout (desktop, 2-column):
 *   [cart items list                   | order summary]
 *   [promo input                       | checkout CTA]
 *   [recommendations carousel]
 *
 * Mobile collapses to single column with summary pinned to bottom
 * (sticky footer with surface color and spacing for separation).
 */
export const cartRecipe: PageRecipe = {
  id: 'cart',
  title: 'Shopping cart',
  description:
    "Cart page with line items, quantity controls, promo code input, order summary, and checkout emphasis CTA. Single emphasis button: 'Checkout'.",

  platforms: ['web'],

  slots: [
    {
      name: 'pageHeading',
      required: true,
      description:
        "Page heading — 'Cart · 购物车' (from copy-library/ui/labels.i18n.json#section.cart).",
      props: {
        text: 'Cart · 购物车',
      },
    },
    {
      name: 'emptyState',
      required: false,
      condition: '!$data.items || $data.items.length === 0',
      description:
        'Empty-cart message using copy from copy-library/ui/empty-states.i18n.json#emptyCart: title + subtitle + "Start Shopping" button.',
      props: {
        title: '$data.empty.title',
        subtitle: '$data.empty.subtitle',
        action: '$data.empty.action',
      },
    },
    {
      name: 'itemsList',
      required: true,
      condition: '$data.items && $data.items.length > 0',
      description:
        'List of cart line items. Each item is a Card padding="md" bordered with: image, brand+title, price, quantity stepper (2 Button iconOnly + Input number), remove Button tertiary iconOnly. Dividers between items.',
      props: {
        items: '$data.items',
      },
    },
    {
      name: 'promoInput',
      component: 'Input',
      required: false,
      description:
        "Promo code input. label='Promo Code · 优惠码' + 'Apply · 应用' suffix button. On apply, displays applied coupon as Badge color=\"red\" with remove button.",
      props: {
        label: 'Promo Code · 优惠码',
        placeholder: 'Enter code',
        suffix: 'ApplyButton',
      },
    },
    {
      name: 'appliedCoupon',
      component: 'Badge',
      required: false,
      condition: '$data.appliedCoupon',
      description:
        "Applied coupon pill. Badge color='red' size='md'. Shows savings amount in bilingual notification.",
      props: {
        color: 'red',
        children: '$data.appliedCoupon.label',
      },
    },
    {
      name: 'orderSummary',
      component: 'Card',
      required: true,
      condition: '$data.items && $data.items.length > 0',
      description:
        'Order summary card — subtotal, shipping, tax, total. Card padding="md". Total row uses --font-size-heading-sm --font-weight-emphasize. Price numbers in GT Walsheim.',
      props: {
        padding: 'md',
        subtotal: '$data.summary.subtotal',
        shipping: '$data.summary.shipping',
        tax: '$data.summary.tax',
        total: '$data.summary.total',
      },
    },
    {
      name: 'checkoutCta',
      component: 'Button',
      required: true,
      condition: '$data.items && $data.items.length > 0',
      description:
        "THE emphasis CTA. variant='emphasis' size='lg' fullWidth. Label: 'Checkout · 结账' (from copy-library#checkout). This is the single emphasis button on the page.",
      props: {
        variant: 'emphasis',
        size: 'lg',
        fullWidth: true,
        children: 'Checkout · 结账',
      },
    },
    {
      name: 'recommendations',
      component: 'ProductCard',
      required: false,
      condition: '$data.recommendations',
      description:
        "'You may also like · 猜你喜欢' — horizontal product card rail. Shows up when cart has > 0 items, encourages add-on purchases.",
      props: {
        items: '$data.recommendations',
        layout: 'scroll-x',
      },
    },
  ],

  rules: [
    'Exactly 1 emphasis button: Checkout. Quantity +/− are primary size="sm" iconOnly. Remove item is tertiary iconOnly. Apply promo is primary size="md".',
    'Cart items use Card bordered=true (dense grid exception for card-no-border rule).',
    'Divider strength="default" between items.',
    'Prices in GT Walsheim (numerals-font rule).',
    'Empty state renders WITHOUT summary / checkout button / recommendations. Just the empty-state messaging + shopping CTA.',
    'On mobile, order summary + checkout button are sticky at the bottom with surface color and spacing separation.',
    "Free shipping threshold hint: if subtotal < $35, show helper text 'Add $X more for free shipping' — caller provides this copy in $data.summary.freeShippingHint.",
  ],

  dataSchema: {
    type: 'object',
    properties: {
      items: {
        type: 'array',
        description: 'Cart line items. Empty or undefined → empty state renders.',
        items: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            image: { type: 'string' },
            imageAlt: { type: 'string' },
            brand: { type: 'string' },
            title: { type: 'string' },
            priceCurrent: { type: 'string', description: 'Per-unit price formatted' },
            quantity: { type: 'number' },
            maxQuantity: { type: 'number' },
            outOfStock: { type: 'boolean' },
          },
          required: ['id', 'title', 'priceCurrent', 'quantity'],
        },
      },
      empty: {
        type: 'object',
        description:
          'Copy for empty-cart state (from copy-library/ui/empty-states.i18n.json#emptyCart).',
        properties: {
          title: { type: 'string', example: 'Your cart is empty · 购物车是空的' },
          subtitle: { type: 'string' },
          action: { type: 'string', example: 'Start Shopping · 开始购物' },
        },
      },
      summary: {
        type: 'object',
        description: 'Money totals. All values pre-formatted as strings.',
        properties: {
          subtotal: { type: 'string', example: '$42.97' },
          shipping: { type: 'string', example: 'Free' },
          tax: { type: 'string', example: '$3.44' },
          total: { type: 'string', example: '$46.41' },
          freeShippingHint: {
            type: 'string',
            description: "Optional — e.g. 'Add $12.03 more for free shipping'.",
          },
        },
        required: ['subtotal', 'total'],
      },
      appliedCoupon: {
        type: 'object',
        description: 'Applied coupon info. Omit if no coupon.',
        properties: {
          code: { type: 'string' },
          label: { type: 'string', example: 'FIRST10 · save $5' },
          removable: { type: 'boolean' },
        },
      },
      recommendations: {
        type: 'array',
        items: { type: 'object' },
      },
    },
  },

  contextQuestions: [
    'What is the free-shipping threshold? · 免运费门槛金额？',
    'Does the store support guest checkout? · 是否支持游客结账？',
    'Show promo code input, or is promo applied via account? · 是否展示优惠码输入框？',
    'Include "You may also like" recommendations row? · 是否包含推荐商品行？',
    'Mobile: sticky checkout footer, or inline? · 移动端：结账按钮是否固定底部？',
  ],

  reference: 'pages/templates/web/Cart.tsx',

  referencedComponents: ['Card', 'Button', 'Input', 'Badge', 'Divider', 'ProductCard'],

  interactions: [
    {
      name: 'focus checkout action',
      selector: 'button',
      action: 'focus',
      expect: { visible: true },
    },
  ],
}
