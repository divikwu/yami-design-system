/**
 * @yami/design-system pages/recipes barrel.
 *
 * Every recipe exported here gets picked up by MCP `list_page_templates`
 * and `get_page_recipe` (Phase 5 build-recipe-index scans this file).
 *
 * Adding a new recipe:
 *   1. Create <slug>.recipe.ts with the PageRecipe shape from types.ts
 *   2. Export here + add to RECIPES_BY_ID
 *   3. Add a matching template at pages/templates/{platform}/<Title>.tsx
 *   4. Reference the template path in the recipe's `reference` field
 */

import { cartRecipe } from './cart.recipe'
import { productDetailRecipe } from './product-detail.recipe'
import { productListRecipe } from './product-list.recipe'
import type { PageRecipe } from './types'

export { cartRecipe } from './cart.recipe'
export { productDetailRecipe } from './product-detail.recipe'
export { productListRecipe } from './product-list.recipe'
export type { DataSchema, FieldSpec, FieldType, PageRecipe, Platform, SlotSpec } from './types'

export const ALL_RECIPES: readonly PageRecipe[] = Object.freeze([
  productListRecipe,
  productDetailRecipe,
  cartRecipe,
])

export const RECIPES_BY_ID: Readonly<Record<string, PageRecipe>> = Object.freeze(
  Object.fromEntries(ALL_RECIPES.map((r) => [r.id, r])),
)
