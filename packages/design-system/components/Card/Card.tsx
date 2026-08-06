/**
 * Card — surface primitive for content grouping.
 *
 * Default: no border (rule card-no-border), 12px radius
 * (rule no-custom-radii → --radius-surface-default), no shadow.
 *
 * If a card is clickable, hover/press changes background color. Depth tokens
 * are not part of the current Figma source, so Card does not expose elevation.
 *
 * When rendering as <a> (href provided) or a custom element (as=button),
 * the component picks the right element type while keeping a11y right.
 */

import type {
  ComponentPropsWithoutRef,
  ElementType,
  ForwardedRef,
  ReactElement,
  ReactNode,
} from 'react'
import { forwardRef } from 'react'

import styles from './Card.module.css'

export type CardPadding = 'none' | 'sm' | 'md' | 'lg'
export type CardSurface = 'primary' | 'secondary' | 'inverse'

export interface CardBaseProps {
  /** Inner padding tier. Default: 'md' (16px). */
  padding?: CardPadding
  /** Background surface token. Default: 'primary' (--surface-primary). */
  surface?: CardSurface
  /** Opt-in hairline border. Only use in dense listing grids per design.md. */
  bordered?: boolean
  /**
   * Renders with hover + focus-visible styling. Implicitly when `as="button"` or
   * when `href` is provided (rendered as <a>). Can be set manually for custom
   * interactive wrappers.
   */
  interactive?: boolean
  children?: ReactNode
}

export type CardProps<T extends ElementType = 'div'> = CardBaseProps &
  Omit<ComponentPropsWithoutRef<T>, keyof CardBaseProps | 'as'> & {
    /** Element type to render. Defaults to 'div'. Use 'a' with href for link cards, 'button' for button cards. */
    as?: T
  }

function CardImpl<T extends ElementType = 'div'>(
  {
    as,
    padding = 'md',
    surface = 'primary',
    bordered = false,
    interactive,
    className,
    children,
    ...rest
  }: CardProps<T>,
  ref: ForwardedRef<HTMLElement>,
) {
  const Element = (as ?? 'div') as ElementType

  // Auto-infer interactive when rendering as button or anchor-with-href.
  const restProps = rest as { href?: string }
  const isInteractive =
    interactive ?? (Element === 'button' || (Element === 'a' && !!restProps.href))

  const classes = [
    styles.card,
    styles[`pad-${padding}`],
    styles[`surface-${surface}`],
    bordered && styles.bordered,
    isInteractive && styles.interactive,
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <Element {...rest} ref={ref} className={classes} data-slot="card">
      <div data-slot="card-content">{children}</div>
    </Element>
  )
}

// Polymorphic + forwardRef: cast preserves the generic API for consumers
// while letting React.forwardRef accept the impl. Ref type is widened to
// HTMLElement since `as` can render any element. Concrete tags are still
// type-checked at the JSX site via CardProps<T>['ref'].
export const Card = forwardRef(CardImpl) as <T extends ElementType = 'div'>(
  props: CardProps<T> & { ref?: ForwardedRef<HTMLElement> },
) => ReactElement
