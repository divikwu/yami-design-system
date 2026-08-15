"use client"

import { Radio as RadioPrimitive } from "@base-ui/react/radio"
import { RadioGroup as RadioGroupPrimitive } from "@base-ui/react/radio-group"

import styles from "./RadioGroup.module.css"

export type RadioGroupProps<Value = unknown> = RadioGroupPrimitive.Props<Value>
export type RadioGroupItemProps<Value = unknown> = RadioPrimitive.Root.Props<Value>

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ")
}
export function RadioGroup<Value>({ className, ...props }: RadioGroupProps<Value>) {
  const mergedClassName =
    typeof className === "function"
      ? (state: RadioGroupPrimitive.State) => cx(styles.group, className(state))
      : cx(styles.group, className)

  return (
    <RadioGroupPrimitive
      {...props}
      className={mergedClassName}
      data-slot="radio-group"
    />
  )
}

export function RadioGroupItem<Value>({ className, ...props }: RadioGroupItemProps<Value>) {
  const mergedClassName = (state: RadioPrimitive.Root.State) =>
    cx(
      styles.item,
      state.checked && styles.selected,
      typeof className === "function" ? className(state) : className,
    )

  return (
    <RadioPrimitive.Root
      {...props}
      className={mergedClassName}
      data-slot="radio-group-item"
    >
      <RadioPrimitive.Indicator className={styles.indicator} data-slot="radio-group-indicator">
        <span className={styles.dot} />
      </RadioPrimitive.Indicator>
    </RadioPrimitive.Root>
  )
}
