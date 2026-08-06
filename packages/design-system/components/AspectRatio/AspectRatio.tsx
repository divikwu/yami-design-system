import type { CSSProperties, HTMLAttributes } from 'react'

import styles from './AspectRatio.module.css'

export interface AspectRatioProps extends HTMLAttributes<HTMLDivElement> {
  /** Width divided by height, for example 1 for square or 16 / 9 for landscape. */
  ratio: number
  'data-slot'?: string
}

type AspectRatioStyle = CSSProperties & {
  '--aspect-ratio': number
}

/** Constrains arbitrary content to a caller-provided width-to-height ratio. */
export function AspectRatio({
  ratio,
  className,
  style,
  'data-slot': dataSlot = 'aspect-ratio',
  ...props
}: AspectRatioProps) {
  return (
    <div
      {...props}
      className={[styles.root, className].filter(Boolean).join(' ')}
      style={{ ...style, '--aspect-ratio': ratio } as AspectRatioStyle}
      data-slot={dataSlot}
    />
  )
}
