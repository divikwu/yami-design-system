/**
 * Badge — small pill-shaped label for product status, promotion, and counts.
 *
 * Four parallel APIs:
 *   1. Abstract (lower level): color × emphasis
 *        color: red | blue | green | purple | yellow | neutral
 *        emphasis: primary (solid) | secondary (tinted)
 *   2. Size: sm (20px height / 12px type) | md (24px / 14px)
 *   3. Surface tone: dark | light | dark-outline | light-outline
 *      Tone takes visual priority while preserving Badge size and radius.
 *   4. Semantic shortcut (mirrors Figma `Badge / Mobile` + `Badge / PC`):
 *        type='sale' | 'low-price' | 'discount' | 'new' | 'hot' | 'exclusive'
 *             | 'choice' | 'best-sellers' | 'price'
 *      Each `type` resolves to a preset (color, emphasis). Explicit color
 *      / emphasis props win over the preset — useful when a product team
 *      needs a one-off override without changing the type vocabulary.
 *
 * Rule no-emoji: badge text must be plain ("NEW", "SALE", "–10%").
 */

import { forwardRef, type HTMLAttributes } from 'react'

import styles from './Badge.module.css'

/**
 * Flag prefix used by 'exclusive' (purple) + 'choice' (blue) types.
 * Mirrors packages/design-system/assets/badges/flag-cap-{purple,blue}.svg
 * (26×20, fills color-purple-700 / color-blue-700 with white Y monogram).
 * Inlined here so the Badge ships self-contained — no SVG-loader assumption.
 */
function FlagPrefix({ color }: { color: 'purple' | 'blue' }) {
  const fill = color === 'purple' ? '#531EE3' : '#005CC2'
  return (
    <svg
      className={styles.flag}
      width="26"
      height="20"
      viewBox="0 0 26 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M0 0H26C23.6989 0 21.7421 1.67919 21.3927 3.95363L19.4491 16.6073C19.1493 18.559 17.4701 20 15.4954 20H0V0Z"
        fill={fill}
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12.7184 12.7198C13.238 12.1982 14.0806 12.1982 14.6003 12.7198L14.6505 12.7731C15.1193 13.2974 15.1025 14.1046 14.6003 14.6088C14.0806 15.1304 13.238 15.1304 12.7184 14.6088C12.1987 14.0872 12.1987 13.2414 12.7184 12.7198ZM13.3334 5L15 6.66625L13.3334 8.3325L11.6667 9.99884L10.0001 11.6651L8.3333 13.3313L6.6667 14.9975L5 13.3313L8.3333 9.99884L6.6667 8.3325L5 6.66625L6.6667 5L8.3333 6.66625L10.0001 8.3325L11.6667 6.66625L13.3334 5Z"
        fill="white"
      />
    </svg>
  )
}

const TYPE_FLAGS: Partial<Record<string, 'purple' | 'blue'>> = {
  exclusive: 'purple',
  choice: 'blue',
}

export type BadgeColor = 'red' | 'blue' | 'green' | 'purple' | 'yellow' | 'neutral'
export type BadgeEmphasis = 'primary' | 'secondary'
export type BadgeSize = 'sm' | 'md'
export type BadgeTone = 'dark' | 'light' | 'dark-outline' | 'light-outline'
export type BadgeType =
  | 'price'
  | 'sale'
  | 'low-price'
  | 'discount'
  | 'new'
  | 'hot'
  | 'exclusive'
  | 'choice'
  | 'best-sellers'

/**
 * Semantic `type` → (color, emphasis) preset map.
 * Mirrors Figma `Badge / Mobile` + `Badge / PC` Type variants.
 * Update both lock-step when a new Type variant ships in Figma.
 */
const TYPE_PRESETS: Record<BadgeType, { color: BadgeColor; emphasis: BadgeEmphasis }> = {
  price: { color: 'neutral', emphasis: 'primary' },
  sale: { color: 'red', emphasis: 'secondary' },
  'low-price': { color: 'red', emphasis: 'secondary' },
  discount: { color: 'red', emphasis: 'secondary' },
  new: { color: 'purple', emphasis: 'secondary' },
  hot: { color: 'purple', emphasis: 'secondary' },
  exclusive: { color: 'purple', emphasis: 'secondary' },
  choice: { color: 'blue', emphasis: 'secondary' },
  'best-sellers': { color: 'yellow', emphasis: 'secondary' },
}

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  /** Color maps to semantic badge tokens. Default: 'neutral'. Use 'red' only for promotion/urgency. */
  color?: BadgeColor
  /** 'primary' = solid bg, high contrast. 'secondary' = tinted bg, softer. Default: 'primary'. */
  emphasis?: BadgeEmphasis
  /** Geometry tier. Default: 'sm' (20px / 12px). 'md' = 24px / 14px. */
  size?: BadgeSize
  /** Optional background-polarity treatment matching Tag tones while retaining Badge geometry. */
  tone?: BadgeTone
  /**
   * Semantic shortcut matching Figma's Type variant. Sets (color, emphasis)
   * from the preset map. Explicit color / emphasis props still win when both
   * are provided — useful for one-off overrides.
   */
  type?: BadgeType
}

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(function Badge(
  {
    color,
    emphasis,
    size = 'sm',
    tone,
    type,
    className,
    children,
    ...rest
  },
  ref,
) {
  const preset = type ? TYPE_PRESETS[type] : undefined
  const resolvedColor = color ?? preset?.color ?? 'neutral'
  const resolvedEmphasis = emphasis ?? preset?.emphasis ?? 'primary'
  const flag = type ? TYPE_FLAGS[type] : undefined

  const classes = [styles.badge, className].filter(Boolean).join(' ')
  return (
    <span
      // Spread consumer rest first so component-controlled data-* + className
      // always win — keeps the variant-selector contract stable.
      {...rest}
      ref={ref}
      className={classes}
      data-slot="badge"
      data-color={resolvedColor}
      data-emphasis={resolvedEmphasis}
      data-size={size}
      data-tone={tone}
      data-type={type}
      data-flag={flag}
    >
      {flag && <FlagPrefix color={flag} />}
      {children}
    </span>
  )
})
