/**
 * Divider — separator between content sections.
 *
 * Two strengths matching the YAMI layout divider spec:
 *   default  — 1px, low-emphasis structure
 *   emphasis — 2px, stronger section separation
 *
 * Both strengths support inverse rendering on the active theme's opposite-polarity surface.
 *
 * Renders as semantic <hr> when horizontal and a decorative
 * <span aria-hidden="true"> when vertical.
 */

import type { HTMLAttributes } from 'react'

import styles from './Divider.module.css'

export type DividerStrength = 'default' | 'emphasis'

export type DividerOrientation = 'horizontal' | 'vertical'

export interface DividerProps extends Omit<HTMLAttributes<HTMLElement>, 'role'> {
  /** Visual weight. Default: 'default' (1px). */
  strength?: DividerStrength
  /** Use inverse divider tokens on the active theme's opposite-polarity surface. Default: false. */
  inverse?: boolean
  /** Orientation. Default: 'horizontal'. */
  orientation?: DividerOrientation
}

export function Divider({
  strength = 'default',
  inverse = false,
  orientation = 'horizontal',
  className,
  ...rest
}: DividerProps) {
  const classes = [styles.divider, styles[orientation], styles[strength], inverse && styles.inverse, className]
    .filter(Boolean)
    .join(' ')
  if (orientation === 'horizontal') {
    return <hr {...rest} className={classes} data-slot="divider" />
  }
  // Vertical dividers are visual-only. <hr> is spec-locked horizontal,
  // so we use a decorative <span aria-hidden="true">. Screen readers
  // learn list/group structure from the semantic parent (ul, dl, role=list),
  // not from vertical separator glyphs.
  return <span {...rest} aria-hidden="true" className={classes} data-slot="divider" />
}
