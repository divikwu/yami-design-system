/**
 * @yami/design-system components barrel.
 *
 * Re-exports every public component + its types. Consumers can import
 * either from the barrel (tree-shakeable bundlers) or from the direct
 * path (keeps diff churn low when reorganizing):
 *
 *   import { Button } from '@ds/components'
 *   import { Button } from '@ds/components/Button'
 *
 * Component addition checklist:
 *   1. Add component directory under components/<Name>/ with source, styles,
 *      meta.json, usage.md, examples.tsx, Storybook, Code Connect, and index.ts
 *   2. Add `export * from './<Name>'` here
 *   3. Add a registry item when the component has a maintained Storybook Showcase
 *   4. Phase 5 build-component-index scans this directory tree
 */

export * from './Badge'
export * from './ActivityPageHeader'
export * from './Billboard'
export * from './AspectRatio'
export * from './BrandProductRail'
export * from './ThemeHero'
export * from './Button'
export * from './Card'
export * from './Checkbox'
export * from './Divider'
export * from './Footer'
export * from './Header'
export * from './HorizontalScrollList'
export * from './Input'
export * from './HeroBanner'
export * from './ProductCard'
export * from './ProductList'
export * from './ReviewList'
export * from './ThemeProductList'
export * from './RadioGroup'
export * from './ShortcutRail'
export * from './SocialMediaGallery'
export * from './Tabs'
export * from './TrendingSearches'
