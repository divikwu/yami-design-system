/**
 * Manually-maintained index of design principles.
 *
 * Each entry corresponds to a rule declared in ../design.md with a
 * matching <!-- rule-id: xxx --> marker and a validator file at
 * ./validators/<rule-id>.ts.
 *
 * CI check:principles-sync enforces three-way consistency:
 *   design.md rule-ids == this array's ruleIds == validators/ file names
 *
 * To add a new rule: see docs/guides/adding-design-rule.md
 */

import type { Principle } from './schema'
import { borderStrength } from './validators/border-strength'
import { cardNoBorder } from './validators/card-no-border'
import { elevationOnPress } from './validators/elevation-on-press'
import { emphasisLimit } from './validators/emphasis-limit'
import { focusStyle } from './validators/focus-style'
import { noCustomRadii } from './validators/no-custom-radii'
import { noDecorativeMedia } from './validators/no-decorative-media'
import { noEmoji } from './validators/no-emoji'
import { noOpacityDisabled } from './validators/no-opacity-disabled'
import { numeralsFont } from './validators/numerals-font'
import { redUsage } from './validators/red-usage'
import { semanticColorOnly } from './validators/semantic-color-only'
import { tapTarget } from './validators/tap-target'
import { tokenExists } from './validators/token-exists'
import { typeHierarchy } from './validators/type-hierarchy'

// `as const satisfies readonly Principle[]` gives us two things at once:
// 1. Each ruleId is narrowed to its literal type (used below to derive
//    PrincipleRuleId for compile-time checking in multi-agent-contract.ts)
// 2. The array is still type-checked against Principle (severity variants,
//    required fields, etc. — so typos here fail locally instead of at callers)
// The exported `principles` stays `readonly Principle[]` to preserve the
// previous call-site ergonomics (for-of / .map / .filter all work readonly).
const principlesData = [
  // Color
  {
    ruleId: 'red-usage',
    title: '红色使用',
    severity: 'error',
    description: '两个红：#FF0000 (--color-brand-red) 仅用于 Logo / brand mark；#E00000 (--color-red-500) 仅用于 Emphasis CTA / promo & urgency / error。两者不可互换，禁止装饰用途',
    validator: redUsage,
  },
  {
    ruleId: 'semantic-color-only',
    title: '语义色限制',
    severity: 'error',
    description: 'Blue / green / purple / yellow 只用于 semantic status 或 badge palette，不得装饰',
    validator: semanticColorOnly,
  },

  // Typography
  {
    ruleId: 'numerals-font',
    title: '数字字体',
    severity: 'warning',
    description:
      '所有数字必须使用 GT Walsheim，即使在中文字符串中。Phase 6.5 static stub; Phase 8.5 visual enforcer (needs rendered-DOM font resolution).',
    validator: numeralsFont,
  },
  {
    ruleId: 'type-hierarchy',
    title: '字体层级上限',
    severity: 'warning',
    description: '每页最多 4 个字体层级',
    validator: typeHierarchy,
  },

  // Spacing / radii / depth
  {
    ruleId: 'no-custom-radii',
    title: '圆角限制',
    severity: 'error',
    description: '不得自定义 radii，只用 semantic slots（12 / 8 / 9999 / 4）',
    validator: noCustomRadii,
  },
  {
    ruleId: 'elevation-on-press',
    title: '交互不加 shadow',
    severity: 'error',
    description: 'Hover / press 只能改 color（-active token variant），不得添加或改变 box-shadow',
    validator: elevationOnPress,
  },
  {
    ruleId: 'no-opacity-disabled',
    title: 'Disabled 状态',
    severity: 'error',
    description: 'Disabled 必须用 --button-disabled + --text-disabled token，不得用 opacity',
    validator: noOpacityDisabled,
  },

  // Focus / borders
  {
    ruleId: 'focus-style',
    title: '焦点样式',
    severity: 'error',
    description: 'Focus 必须 2px 外描边 --border-focus (black)，禁止蓝色 ring',
    validator: focusStyle,
  },
  {
    ruleId: 'border-strength',
    title: '边框强度',
    severity: 'warning',
    description: '边框只能用 default (8%) / focus (87%) / attention (red) 三级',
    validator: borderStrength,
  },

  // Components
  {
    ruleId: 'emphasis-limit',
    title: 'Emphasis 数量',
    severity: 'error',
    description: 'Emphasis Button 每屏最多 1 个',
    validator: emphasisLimit,
  },
  {
    ruleId: 'card-no-border',
    title: 'Card 无默认边框',
    severity: 'warning',
    description: 'Cards 默认无 border 且无 shadow；仅密集列表可用 --border-default (8%)',
    validator: cardNoBorder,
  },

  // Accessibility
  {
    ruleId: 'tap-target',
    title: '触摸区域',
    severity: 'warning',
    description:
      'iOS ≥ 44×44pt, Android ≥ 48×48dp；用 padding 扩大而非放大可见元素。Phase 6.5 static warn; Phase 8.5 visual enforcer (needs rendered bounding box).',
    validator: tapTarget,
  },

  // Token integrity
  {
    ruleId: 'token-exists',
    title: 'Token 必须真实存在',
    severity: 'error',
    description:
      '所有 var(--name) 引用必须在 tokens.css 中真实声明，禁止捏造看似合理但不存在的 token 名',
    validator: tokenExists,
  },

  // Imagery / patterns
  {
    ruleId: 'no-emoji',
    title: 'UI 禁用 emoji',
    severity: 'error',
    description: '产品 UI 不得使用 emoji（authoring docs 用 ✅❌ 是例外）',
    validator: noEmoji,
  },
  {
    ruleId: 'no-decorative-media',
    title: '装饰媒体禁用',
    severity: 'error',
    description: '禁止 glassmorphism / 手绘插图 / 未注册 serif 与花体字 / 图案纹理 / 软粉色调',
    validator: noDecorativeMedia,
  },
] as const satisfies readonly Principle[]

export const principles: readonly Principle[] = principlesData

/**
 * Union of every registered principle's ruleId — derived from `principlesData`,
 * so adding a rule (ruleId literal + entry) automatically widens this type and
 * no hand-maintained list can drift. Used by
 * `@yami/harness/runner/multi-agent-contract` to tighten `Violation.ruleId`
 * beyond plain `string`.
 */
export type PrincipleRuleId = (typeof principlesData)[number]['ruleId']

// Derived: rule-id → Principle lookup
export const principlesById: Record<string, Principle> = Object.fromEntries(
  principles.map((p) => [p.ruleId, p]),
)

// Derived: list of all rule-ids (for check:principles-sync)
export const ruleIds: string[] = principles.map((p) => p.ruleId)
