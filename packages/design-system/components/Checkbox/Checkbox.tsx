"use client"

import { Checkbox as CheckboxPrimitive } from "@base-ui/react/checkbox"
import { forwardRef } from "react"

import styles from "./Checkbox.module.css"

export type CheckboxProps = CheckboxPrimitive.Root.Props

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ")
}

export const Checkbox = forwardRef<HTMLElement, CheckboxProps>(function Checkbox(
  { className, ...props },
  ref,
) {
  const mergedClassName = (state: CheckboxPrimitive.Root.State) =>
    cx(
      styles.root,
      (state.checked || state.indeterminate) && styles.selected,
      state.indeterminate && styles.indeterminate,
      typeof className === "function" ? className(state) : className,
    )

  return (
    <CheckboxPrimitive.Root
      {...props}
      ref={ref}
      className={mergedClassName}
      data-slot="checkbox"
    >
      <CheckboxPrimitive.Indicator
        className={styles.indicator}
        data-slot="checkbox-indicator"
      >
        <svg className={styles.checkIcon} aria-hidden="true" viewBox="0 0 14 14">
          <path d="M3 7.1 5.55 9.5 11 4.5" />
        </svg>
        <svg className={styles.mixedIcon} aria-hidden="true" viewBox="0 0 14 14">
          <path d="M3 7h8" />
        </svg>
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  )
})
