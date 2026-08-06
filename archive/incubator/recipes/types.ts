/**
 * PageRecipe — structured spec for a generatable page.
 *
 * Consumed by @yami/mcp-server compose_page tool (Phase 7). A recipe
 * describes the layout, data contract, and constraints of a page
 * type without committing to specific pixel-level rendering — that's
 * the template's job. The compose_page tool uses a recipe + the user's
 * data to produce concrete JSX.
 *
 * Key design choices:
 *   1. slots[] is an ordered list, not a nested tree. Simple layout
 *      patterns (header / main / footer, or single-column scroll) are
 *      the most common e-commerce page shapes. Complex layouts belong
 *      in a template, not the recipe.
 *   2. Data binding uses "$data.fieldName" string literals rather than
 *      JS expressions. compose_page resolves these at generation time.
 *   3. dataSchema is a JSON-Schema subset — enough for compose_page to
 *      verify the caller provided all required fields before generating.
 *   4. contextQuestions is the Planner's escape hatch: when data is
 *      insufficient, compose_page returns these questions for the user
 *      to answer before generation.
 *   5. referencedComponents is explicit so MCP can sanity-check every
 *      slot component exists before compose_page runs.
 */

export type Platform = 'web' | 'app'

/** A slot is one positional component or layout region in the page. */
export interface SlotSpec {
  /** Stable identifier — used for conditional overrides and compose_page
   *  per-slot customization (e.g. "override hero with campaign banner"). */
  name: string
  /** YAMI component name (matches components/<Name>/ directory).
   *  Undefined = custom layout region (e.g. a plain <section> wrapper). */
  component?: string
  /** Whether this slot must render. Optional slots are rendered only
   *  when the condition (if any) evaluates true AND data is present. */
  required: boolean
  /** Prose expression evaluated against $data at compose time.
   *  E.g. "$data.campaign" → render only when campaign is truthy. */
  condition?: string
  /**
   *  Default / expected props. String values starting with "$data." are
   *  data bindings resolved at generation time. Other values are literals.
   *  For repeated slots (grid of N cards), the component-level iteration
   *  is implicit — the slot receives an array and the template iterates.
   */
  props?: Record<string, unknown>
  /** Human-readable description of what this slot is for. */
  description?: string
}

export type FieldType = 'string' | 'number' | 'boolean' | 'array' | 'object'

/** JSON-Schema subset describing one field in dataSchema.properties. */
export interface FieldSpec {
  type: FieldType
  description?: string
  /** For type='array' — the item shape. */
  items?: FieldSpec
  /** For type='object' — nested properties. */
  properties?: Record<string, FieldSpec>
  /** For type='object' — which child properties are required. */
  required?: string[]
  /** For type='string' — restrict to a fixed set. */
  enum?: string[]
  /** Example value for documentation / compose_page fallback generation. */
  example?: unknown
}

/** Data contract for a page — what the caller must pass to compose_page. */
export interface DataSchema {
  type: 'object'
  properties: Record<string, FieldSpec>
  required?: string[]
}

export interface PageRecipe {
  /** kebab-case identifier. Matches the filename (product-list.recipe.ts). */
  id: string
  /** Human title, shown in list_page_templates MCP output. */
  title: string
  /** One-paragraph description — helps Planner choose between recipes. */
  description: string
  /** Which platforms this recipe targets. Phase 6 ships web only. */
  platforms: Platform[]
  /** Ordered list of slots. */
  slots: SlotSpec[]
  /** Prose constraints that apply to the whole recipe, not one slot.
   *  e.g. "HeroBanner inside Emphasis CTA ≤ 1". compose_page propagates
   *  these into validate_design after generation. */
  rules: string[]
  /** Data contract — what the caller must provide. */
  dataSchema: DataSchema
  /** Questions the Planner asks when data is insufficient or ambiguous.
   *  Always bilingual (CN / EN) per content/bilingual.md. */
  contextQuestions: string[]
  /** Path to the reference JSX template (relative to @ds root). */
  reference?: string
  /** Components actually used in this recipe, flattened for MCP validation. */
  referencedComponents: string[]
  /** Browser-verifiable interaction assertions required by client-runtime components. */
  interactions?: Array<{
    name: string
    selector: string
    action: 'click' | 'fill' | 'press' | 'focus'
    value?: string
    expect?: {
      selector?: string
      visible?: boolean
      attribute?: string
      equals?: string
      textIncludes?: string
    }
  }>
}
