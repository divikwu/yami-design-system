import type { PageRecipe } from './types'

/**
 * product-list — category browse / search results page.
 *
 * Layout: [search input] [category pills] [sort control] [product grid]
 *   All slots use only components that exist in Phase 5:
 *     Input, Badge (as static pill), Button, ProductCard, Divider.
 */
export const productListRecipe: PageRecipe = {
  id: 'product-list',
  title: 'Product list',
  description:
    'Category browse, search results, "Today\'s Deals" — any page that displays a grid of products with optional filtering and sorting. Default columns: 2 on mobile, 3 tablet, 4 desktop.',

  platforms: ['web'],

  slots: [
    {
      name: 'pageHeading',
      required: true,
      description:
        "Section title using copy-patterns.md lead-with-action style (e.g. 'Shop by Category · 按分类购物'). Renders as <h1> with --font-size-heading-xl.",
      props: {
        text: '$data.heading',
      },
    },
    {
      name: 'search',
      component: 'Input',
      required: false,
      condition: '$data.showSearch',
      description:
        'Search input with prefix icon. Placeholder from copy-library/ui/labels.i18n.json#nav.search.',
      props: {
        type: 'search',
        placeholder: 'Search YAMI · 搜索',
        'aria-label': 'Search',
        fullWidth: true,
      },
    },
    {
      name: 'categoryFilters',
      required: false,
      condition: '$data.categories',
      description:
        'Horizontal scroll row of category pills. Each pill is a Button variant="secondary" size="sm" — clicking applies/removes the filter. Active state wraps with Badge color="neutral" emphasis="primary".',
      props: {
        categories: '$data.categories',
        activeCategory: '$data.activeCategory',
      },
    },
    {
      name: 'sortControl',
      component: 'Button',
      required: false,
      description:
        "Right-aligned sort dropdown trigger. variant='tertiary' size='sm' with text like 'Sort: Popular'. Clicking opens a menu (future <Menu> component; Phase 6 uses native <select> fallback).",
      props: {
        variant: 'tertiary',
        size: 'sm',
        children: 'Sort: $data.sortLabel',
      },
    },
    {
      name: 'productGrid',
      component: 'ProductCard',
      required: true,
      description:
        'Responsive grid of ProductCard. columns: 2 (mobile) / 3 (tablet) / 4 (desktop-lg). Each item binds $data.products[i] to ProductCard props via template iteration.',
      props: {
        items: '$data.products',
        columns: { mobile: 2, tablet: 3, 'desktop-lg': 4 },
      },
    },
    {
      name: 'loadMore',
      component: 'Button',
      required: false,
      condition: '$data.hasMore',
      description: 'Load-more CTA below the grid. Centered, size="lg" variant="primary".',
      props: {
        variant: 'primary',
        size: 'lg',
        children: 'Load More · 加载更多',
      },
    },
  ],

  rules: [
    'At most 1 Button variant="emphasis" on screen (design.md emphasis-limit). The product grid has no emphasis buttons; each ProductCard uses primary small iconOnly Add buttons.',
    'ProductCard onAddToCart stops event propagation — tapping the card navigates to PDP, tapping + adds to cart.',
    'Categories rendered as Button secondary pills, NOT Badge (Badge is non-interactive).',
    'Search, sort, and category filters are optional — the recipe gracefully renders with just [heading] + [grid] when no filter data is provided.',
    'Page margin: --layout-page-margin-default (16 mobile / 48 desktop).',
  ],

  dataSchema: {
    type: 'object',
    properties: {
      heading: {
        type: 'string',
        description: "Page title. Bilingual with middle dot — 'Shop by Category · 按分类购物'.",
        example: "Today's Deals · 今日特惠",
      },
      showSearch: {
        type: 'boolean',
        description: 'Render the search input row.',
        example: true,
      },
      categories: {
        type: 'array',
        description: 'Category filter pills. Omit to hide the filter row.',
        items: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            label: { type: 'string', description: 'Bilingual label, e.g. "Snacks · 零食"' },
          },
          required: ['id', 'label'],
        },
      },
      activeCategory: {
        type: 'string',
        description: "Currently selected category id. Undefined = 'All'.",
      },
      sortLabel: {
        type: 'string',
        description: "Current sort option label, e.g. 'Popular' or 'Price: Low to High'.",
        example: 'Popular',
      },
      products: {
        type: 'array',
        description: 'Products to render in the grid. Each item maps to ProductCard props.',
        items: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            href: { type: 'string', description: 'PDP link (e.g. /product/:id)' },
            image: { type: 'string' },
            imageAlt: { type: 'string' },
            brand: { type: 'string' },
            title: { type: 'string' },
            priceCurrent: { type: 'string', description: "Formatted string, e.g. '$12.99'" },
            priceOriginal: { type: 'string', description: 'Strike-through original price' },
            rating: { type: 'number' },
            ratingCount: { type: 'string', description: "Formatted count, e.g. '1.2k'" },
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
          required: ['id', 'title', 'priceCurrent'],
        },
      },
      hasMore: {
        type: 'boolean',
        description:
          'Whether more products are available beyond the current page. Toggles Load More button.',
      },
    },
    required: ['heading', 'products'],
  },

  contextQuestions: [
    'What is the page heading (bilingual, e.g. "Snacks · 零食")? · 页面标题是什么（双语，如 "零食 · Snacks"）？',
    'How many products in the first batch, and is there more to load? · 首批展示多少件商品？是否分页？',
    'Show the search input row? · 是否显示搜索框？',
    'Show category filter pills? If yes, which categories? · 是否显示分类筛选？有哪些分类？',
    'Default sort order? · 默认排序方式？',
  ],

  reference: 'pages/templates/web/ProductList.tsx',

  referencedComponents: ['Input', 'Button', 'ProductCard'],

  interactions: [
    {
      name: 'focus product-list action',
      selector: 'button',
      action: 'focus',
      expect: { visible: true },
    },
  ],
}
