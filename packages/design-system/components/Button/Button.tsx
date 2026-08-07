/**
 * Button — YAMI primary interactive element.
 *
 * Mirrors the YAMI UI/UX Guidelines Figma file (Mobile v2 + PC v2):
 *   - variant: 4 hierarchies — emphasis / primary / secondary / tertiary
 *   - form:    3 layout modes — full / inline / icon
 *   - size:    sm (32, product-only) / md (40) / lg (Mobile 48 → PC 56 responsive)
 *   - inverse: false (default surface polarity) / true (opposite surface polarity)
 *
 * A11y contract:
 *   - form="icon" requires an aria-label (enforced at runtime in dev).
 *   - Disabled / loading uses `aria-disabled="true"` over native `disabled`,
 *     keeping the element keyboard-focusable so SR can still announce it.
 *     Clicks are blocked via the onClick guard.
 *   - Loading additionally sets aria-busy="true".
 *   - Focus-visible outline is 2px solid var(--border-focus) with 2px offset
 *     (var(--border-focus-inverse) when inverse=true).
 *
 * Backward compat: legacy props `iconOnly` and `fullWidth` are deprecated
 * but still honored — they map to `form="icon"` / `form="full"` when set.
 * Page templates pre-v0.2.0 continue to work without changes.
 *
 * See meta.json for structured spec, usage.md for narrative.
 */

import { type ButtonHTMLAttributes, forwardRef, type ReactNode } from 'react'

import styles from './Button.module.css'

declare const process: { env?: { NODE_ENV?: string } } | undefined

export type ButtonVariant = 'emphasis' | 'primary' | 'secondary' | 'tertiary'
export type ButtonForm = 'full' | 'inline' | 'icon'
export type ButtonSize = 'sm' | 'md' | 'lg'

export interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'type'> {
  /** Visual role. Default: 'primary'. Only one 'emphasis' button per screen (rule: emphasis-limit). */
  variant?: ButtonVariant
  /**
   * Layout mode (Figma Form axis).
   * - 'inline' (default): content-width, sits in a row
   * - 'full': stretches to container width — page-level CTAs
   * - 'icon': square, icon-only — requires aria-label
   * When omitted, falls back to legacy iconOnly / fullWidth booleans.
   */
  form?: ButtonForm
  /** Height / padding tier. Default: 'md'. 'sm' (32) is product-only — Figma covers md+lg. */
  size?: ButtonSize
  /** When true, swaps to the opposite-polarity token set in either Light or Dark. Default: false. */
  inverse?: boolean
  /** Optional icon rendered before the label. Prefer currentColor-inheriting SVGs from assets/icons/. */
  leftIcon?: ReactNode
  /** Optional icon rendered after the label. */
  rightIcon?: ReactNode
  /** @deprecated — use `form="icon"`. Kept for backward compat. REQUIRES aria-label. */
  iconOnly?: boolean
  /** @deprecated — use `form="full"`. Kept for backward compat. */
  fullWidth?: boolean
  /** Shows a spinner in place of content; sets aria-busy. Still focusable. */
  loading?: boolean
  /** HTML form button type; defaults to 'button' (not 'submit'). Use 'submit' inside <form> explicitly. */
  htmlType?: 'button' | 'submit' | 'reset'
  /** Children become the label text (or icon node if form='icon'). */
  children?: ReactNode
}

function resolveForm(
  form: ButtonForm | undefined,
  iconOnly: boolean,
  fullWidth: boolean,
): ButtonForm {
  if (form) return form
  if (iconOnly) return 'icon'
  if (fullWidth) return 'full'
  return 'inline'
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'primary',
    form,
    size = 'md',
    inverse = false,
    leftIcon,
    rightIcon,
    iconOnly = false,
    fullWidth = false,
    loading = false,
    htmlType = 'button',
    disabled,
    children,
    className,
    onClick,
    'aria-label': ariaLabel,
    ...rest
  },
  ref,
) {
  const effectiveForm = resolveForm(form, iconOnly, fullWidth)
  const isIconOnly = effectiveForm === 'icon'
  const isFullWidth = effectiveForm === 'full'
  const isDevelopment =
    (typeof process !== 'undefined' && process.env?.NODE_ENV === 'development') ||
    Boolean((import.meta as ImportMeta & { env?: { DEV?: boolean } }).env?.DEV)

  if (isDevelopment && isIconOnly && !ariaLabel) {
    console.warn(
      '[Button] form="icon" (or iconOnly) rendered without aria-label. Screen readers will announce "button" with no context.',
    )
  }

  const isInert = Boolean(disabled) || loading

  const classes = [
    styles.button,
    styles[variant],
    styles[size],
    isIconOnly && styles.iconOnly,
    isFullWidth && styles.fullWidth,
    inverse && styles.inverse,
    loading && styles.loading,
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <button
      // Pass-through props first so the component-controlled attributes
      // below (aria-disabled / aria-busy / onClick / type / className /
      // ref) always win over consumer rest. Without this order a
      // consumer could spread `aria-busy={false}` and silently break
      // the loading announcement.
      {...rest}
      ref={ref}
      type={htmlType}
      className={classes}
      data-slot="button"
      aria-disabled={isInert || undefined}
      aria-busy={loading || undefined}
      aria-label={ariaLabel}
      onClick={(e) => {
        if (isInert) {
          e.preventDefault()
          return
        }
        onClick?.(e)
      }}
    >
      {leftIcon && !isIconOnly && <span className={styles.icon}>{leftIcon}</span>}
      {isIconOnly ? (
        <span className={styles.icon}>{children}</span>
      ) : (
        <span className={styles.label}>{children}</span>
      )}
      {rightIcon && !isIconOnly && <span className={styles.icon}>{rightIcon}</span>}
      {loading && <span className={styles.spinner} aria-hidden="true" />}
    </button>
  )
})
