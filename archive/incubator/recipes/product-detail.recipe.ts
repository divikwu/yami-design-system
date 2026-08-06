import type { PageRecipe } from './types'

/**
 * product-detail — PDP (product detail page).
 *
 * Layout (desktop, 2-column):
 *   [breadcrumb]
 *   [image gallery | product info + CTAs]
 *   [description]
 *   [reviews summary + list]
 *   [related products row]
 *
 * Mobile collapses to single column. Add-to-cart CTA stays pinned
 * at viewport bottom on mobile (sticky footer — template-level).
 */
export const productDetailRecipe: PageRecipe = {
  id: 'product-detail',
  title: 'Product detail',
  description:
    'Product detail page (PDP). Image gallery + price + add-to-cart emphasis CTA + description + reviews + related products. The single emphasis CTA on the page is the Add-to-Cart button (design.md emphasis-limit).',

  platforms: ['web'],

  slots: [
    {
      name: 'breadcrumb',
      required: false,
      description:
        'Navigation breadcrumb trail. Bilingual — separate CN and EN breadcrumb rows per copy-patterns.md.',
      props: {
        trail: '$data.breadcrumb',
      },
    },
    {
      name: 'imageGallery',
      component: 'Card',
      required: true,
      description:
        'Wrap a product image gallery in a Card. padding="none" for edge-to-edge,. Gallery implementation (thumbnails, zoom) is template-level.',
      props: {
        padding: 'none',
        image: '$data.product.image',
        imageAlt: '$data.product.imageAlt',
      },
    },
    {
      name: 'productInfo',
      required: true,
      description:
        'Brand + title + rating + price block. Use --font-size-heading-2xl for title, --font-size-price-md for current price. Price row uses --text-emphasis red for current, strike-through --text-secondary for original.',
      props: {
        brand: '$data.product.brand',
        title: '$data.product.title',
        rating: '$data.product.rating',
        ratingCount: '$data.product.ratingCount',
        priceCurrent: '$data.product.priceCurrent',
        priceOriginal: '$data.product.priceOriginal',
      },
    },
    {
      name: 'badges',
      component: 'Badge',
      required: false,
      condition: '$data.product.badges',
      description:
        'Up to 2 status/promo badges below the title. red for sale/urgency, blue/purple for NEW/BESTSELLER.',
      props: {
        items: '$data.product.badges',
      },
    },
    {
      name: 'quantitySelector',
      required: false,
      condition: '$data.showQuantity',
      description:
        'Quantity stepper: − [input number] +. Built from two Button size="sm" iconOnly + Input size="md" type="number". Template-level since no Stepper component exists yet.',
      props: {
        min: 1,
        max: '$data.product.maxQuantity',
        default: 1,
      },
    },
    {
      name: 'addToCart',
      component: 'Button',
      required: true,
      description:
        'The canonical emphasis CTA. size="lg" fullWidth on mobile (sticky footer), size="lg" width="auto" on desktop. Label from copy-library/ui/buttons.i18n.json#addToCart or #buyNow.',
      props: {
        variant: 'emphasis',
        size: 'lg',
        fullWidth: true,
        children: 'Add to Cart · 加入购物车',
      },
    },
    {
      name: 'secondaryActions',
      required: false,
      description:
        'Save to favorites / share buttons. Button variant="tertiary" size="md" iconOnly. Placed inline after or below addToCart.',
      props: {
        actions: ['favorite', 'share'],
      },
    },
    {
      name: 'description',
      required: true,
      description:
        'Long product description. Rendered as HTML-safe content in a Card padding="lg" surface="secondary".',
      props: {
        body: '$data.product.description',
      },
    },
    {
      name: 'reviewsSummary',
      component: 'Card',
      required: false,
      condition: '$data.reviews',
      description:
        'Aggregate rating block — avg stars, count, distribution bars. Card padding="md".',
      props: {
        rating: '$data.reviews.average',
        count: '$data.reviews.count',
        distribution: '$data.reviews.distribution',
      },
    },
    {
      name: 'relatedProducts',
      component: 'ProductCard',
      required: false,
      condition: '$data.relatedProducts',
      description:
        'Horizontal scroll row or grid of related products. "Just for You · 为你推荐" section title leads this. Columns: 2 mobile / 4 desktop.',
      props: {
        items: '$data.relatedProducts',
        layout: 'scroll-x',
      },
    },
  ],

  rules: [
    'Exactly 1 emphasis button on the page — the Add-to-Cart (design.md emphasis-limit). Favorite / Share use tertiary or iconOnly variants.',
    'Price current MUST use --text-emphasis (red). Never plain black — red is THE signal that this is a transactional page.',
    'Badges on PDP show the SAME badges as the ProductCard on the list page (consistency across surfaces).',
    'Image alt text required — PDP images are product identity, not decoration.',
    'Rating always shown with count — "4.8 (1.2k)" — isolated "4.8" is semantically weak.',
    'On mobile, Add-to-Cart is a sticky bottom bar separated with surface color and spacing, not shadow.',
  ],

  dataSchema: {
    type: 'object',
    properties: {
      breadcrumb: {
        type: 'array',
        description: 'Breadcrumb trail. Each item: {label, href?}. Omit to hide breadcrumb.',
        items: {
          type: 'object',
          properties: {
            label: { type: 'string' },
            href: { type: 'string' },
          },
          required: ['label'],
        },
      },
      product: {
        type: 'object',
        description: 'The product being viewed.',
        properties: {
          id: { type: 'string' },
          image: { type: 'string' },
          imageAlt: { type: 'string' },
          brand: { type: 'string' },
          title: { type: 'string' },
          priceCurrent: { type: 'string', description: "Formatted — '$12.99'" },
          priceOriginal: { type: 'string' },
          rating: { type: 'number' },
          ratingCount: { type: 'string' },
          maxQuantity: { type: 'number', example: 10 },
          description: { type: 'string' },
          badges: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                label: { type: 'string' },
                color: {
                  type: 'string',
                  enum: ['red', 'blue', 'green', 'purple', 'yellow', 'neutral'],
                },
              },
              required: ['label'],
            },
          },
        },
        required: ['id', 'title', 'priceCurrent', 'image', 'imageAlt', 'description'],
      },
      showQuantity: {
        type: 'boolean',
        description:
          'Whether to render the quantity stepper. false for single-item purchases (e.g. services).',
      },
      reviews: {
        type: 'object',
        description: 'Aggregate reviews block. Omit to hide reviews section.',
        properties: {
          average: { type: 'number' },
          count: { type: 'number' },
          distribution: {
            type: 'array',
            items: { type: 'number' },
            description: 'Array of 5 counts [5-star, 4-star, 3-star, 2-star, 1-star]',
          },
        },
      },
      relatedProducts: {
        type: 'array',
        description: 'Related product tiles. Same shape as product-list products.',
        items: { type: 'object' },
      },
    },
    required: ['product'],
  },

  contextQuestions: [
    'Does this product have variants (size / color / flavor)? · 是否有变体（尺寸 / 颜色 / 口味）？',
    'Show quantity selector? · 是否显示数量选择器？',
    'Show reviews block with distribution bars? · 是否显示评价分布？',
    'Include "Just for You · 为你推荐" related products row? · 是否包含推荐商品行？',
    'Is there a "Save for later / favorite" button? · 是否有收藏按钮？',
  ],

  reference: 'pages/templates/web/ProductDetail.tsx',

  referencedComponents: ['Card', 'Badge', 'Button', 'ProductCard', 'Input'],
}
