import type { ButtonHTMLAttributes } from 'react'

import styles from './ProductCardAddButton.module.css'

export type ProductCardAddButtonProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'children'
>

/**
 * ProductCardAddButton — quick-add action for ProductCard.
 *
 * Mirrors Figma `Button / add to cart` (2410:30647): a 40px mobile /
 * 40px circular quick-add control with a cart-add icon.
 */
export function ProductCardAddButton({
  'aria-label': ariaLabel = 'Add to cart',
  className,
  type = 'button',
  ...props
}: ProductCardAddButtonProps) {
  return (
    <button
      {...props}
      type={type}
      aria-label={ariaLabel}
      className={[styles.root, className].filter(Boolean).join(' ')}
      data-slot="product-card-add-button"
    >
      <svg
        className={styles.icon}
        aria-hidden="true"
        viewBox="0 0 24 24"
        fill="none"
        focusable="false"
      >
        <path
          d="M17.4636 8H21.9509L20.5916 13.6748L19.1335 13.3252L20.0496 9.5H3.95093L6.20483 18.9248C6.24416 19.0884 6.33735 19.2346 6.46948 19.3389C6.60162 19.443 6.76508 19.4999 6.93335 19.5H13.9324V21H6.93237C6.42729 20.9996 5.93632 20.8295 5.53979 20.5166C5.14333 20.2038 4.86377 19.7664 4.74585 19.2754L2.04956 8H6.53687L9.03687 3H14.9636L17.4636 8ZM18.2498 16.75H20.9998V18.25H18.2498V21H16.7498V18.25H13.9998V16.75H16.7498V14H18.2498V16.75ZM8.21362 8H15.7869L14.0369 4.5H9.96362L8.21362 8Z"
          fill="currentColor"
        />
      </svg>
    </button>
  )
}
