"use client"

import {
  createContext,
  forwardRef,
  useContext,
  useId,
  useMemo,
  useState,
  type ButtonHTMLAttributes,
  type HTMLAttributes,
  type KeyboardEvent,
  type ReactNode,
} from "react"

import styles from "./Tabs.module.css"

export type TabsValue = string
export type TabsOrientation = "horizontal" | "vertical"
export type TabsActivationMode = "automatic" | "manual"
export type TabsVariant = "primary" | "secondary" | "tertiary"
export type TabsStyleVariant = "a" | "b"

export interface TabsProps extends HTMLAttributes<HTMLDivElement> {
  value?: TabsValue
  defaultValue?: TabsValue
  onValueChange?: (value: TabsValue) => void
  orientation?: TabsOrientation
  activationMode?: TabsActivationMode
  children?: ReactNode
}

export interface TabsListProps extends HTMLAttributes<HTMLDivElement> {
  variant?: TabsVariant
  styleVariant?: TabsStyleVariant
  inverse?: boolean
  fullWidth?: boolean
  skeleton?: boolean
  skeletonCount?: number
  children?: ReactNode
}

export interface TabsTriggerProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "type"> {
  value: TabsValue
  controls?: string
  leftIcon?: ReactNode
  rightIcon?: ReactNode
  children?: ReactNode
}

export interface TabsContentProps extends HTMLAttributes<HTMLDivElement> {
  value: TabsValue
  children?: ReactNode
}

interface TabsContextValue {
  value: TabsValue | undefined
  setValue: (value: TabsValue) => void
  orientation: TabsOrientation
  activationMode: TabsActivationMode
  baseId: string
}

const TabsContext = createContext<TabsContextValue | null>(null)

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ")
}

function useTabsContext(component: string) {
  const context = useContext(TabsContext)

  if (!context) {
    throw new Error(`${component} must be rendered inside <Tabs>.`)
  }

  return context
}

function toIdPart(value: TabsValue) {
  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")

  return normalized || "tab"
}

function getTabId(baseId: string, value: TabsValue) {
  return `${baseId}-tab-${toIdPart(value)}`
}

function getPanelId(baseId: string, value: TabsValue) {
  return `${baseId}-panel-${toIdPart(value)}`
}

function getEnabledTabs(list: HTMLElement) {
  return Array.from(list.querySelectorAll<HTMLButtonElement>('[role="tab"]:not([aria-disabled="true"])'))
}

function getNextIndex(currentIndex: number, tabCount: number, direction: 1 | -1) {
  return (currentIndex + direction + tabCount) % tabCount
}

function revealTab(tab: HTMLButtonElement, orientation: TabsOrientation) {
  const list = tab.closest<HTMLElement>('[role="tablist"]')
  if (!list) return

  const tabRect = tab.getBoundingClientRect()
  const listRect = list.getBoundingClientRect()

  if (orientation === "vertical") {
    if (tabRect.top < listRect.top) {
      list.scrollTop += tabRect.top - listRect.top
    } else if (tabRect.bottom > listRect.bottom) {
      list.scrollTop += tabRect.bottom - listRect.bottom
    }
    return
  }

  if (list.scrollWidth <= list.clientWidth) return

  const tabCenter = tabRect.left + tabRect.width / 2
  const listCenter = listRect.left + listRect.width / 2
  const prefersReducedMotion =
    tab.ownerDocument.defaultView?.matchMedia("(prefers-reduced-motion: reduce)")
      .matches ?? false

  list.scrollTo({
    left: list.scrollLeft + tabCenter - listCenter,
    behavior: prefersReducedMotion ? "auto" : "smooth",
  })
}

export const Tabs = forwardRef<HTMLDivElement, TabsProps>(function Tabs(
  {
    value,
    defaultValue,
    onValueChange,
    orientation = "horizontal",
    activationMode = "automatic",
    className,
    id,
    children,
    ...rest
  },
  ref,
) {
  const generatedId = useId()
  const [internalValue, setInternalValue] = useState<TabsValue | undefined>(defaultValue)
  const selectedValue = value ?? internalValue
  const baseId = id ?? generatedId

  const context = useMemo<TabsContextValue>(
    () => ({
      value: selectedValue,
      orientation,
      activationMode,
      baseId,
      setValue: (nextValue) => {
        if (value === undefined) {
          setInternalValue(nextValue)
        }

        onValueChange?.(nextValue)
      },
    }),
    [activationMode, baseId, onValueChange, orientation, selectedValue, value],
  )

  return (
    <TabsContext.Provider value={context}>
      <div
        {...rest}
        ref={ref}
        id={id}
        className={cx(styles.root, className)}
        data-slot="tabs"
        data-orientation={orientation}
      >
        {children}
      </div>
    </TabsContext.Provider>
  )
})

export const TabsList = forwardRef<HTMLDivElement, TabsListProps>(function TabsList(
  {
    variant = "primary",
    styleVariant = "a",
    inverse = false,
    fullWidth = false,
    skeleton = false,
    skeletonCount = 4,
    className,
    children,
    onKeyDown,
    ...rest
  },
  ref,
) {
  const context = useTabsContext("TabsList")
  const isSegmented = variant === "primary" && styleVariant === "b"

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    onKeyDown?.(event)

    if (event.defaultPrevented || skeleton) return

    const isHorizontal = context.orientation === "horizontal"
    const forwardKey = isHorizontal ? "ArrowRight" : "ArrowDown"
    const backwardKey = isHorizontal ? "ArrowLeft" : "ArrowUp"
    const isForward = event.key === forwardKey
    const isBackward = event.key === backwardKey
    const isHome = event.key === "Home"
    const isEnd = event.key === "End"

    if (!isForward && !isBackward && !isHome && !isEnd) return

    const tabs = getEnabledTabs(event.currentTarget)
    if (tabs.length === 0) return

    const activeElement = event.currentTarget.ownerDocument.activeElement
    let currentIndex = tabs.indexOf(activeElement as HTMLButtonElement)

    if (currentIndex === -1) {
      currentIndex = tabs.findIndex((tab) => tab.getAttribute("aria-selected") === "true")
    }

    if (currentIndex === -1) {
      currentIndex = 0
    }

    let nextIndex = currentIndex
    if (isHome) nextIndex = 0
    if (isEnd) nextIndex = tabs.length - 1
    if (isForward) nextIndex = getNextIndex(currentIndex, tabs.length, 1)
    if (isBackward) nextIndex = getNextIndex(currentIndex, tabs.length, -1)

    const nextTab = tabs[nextIndex]
    event.preventDefault()
    nextTab.focus({ preventScroll: true })

    if (context.activationMode === "automatic") {
      nextTab.click()
    } else {
      revealTab(nextTab, context.orientation)
    }
  }

  const listClassName = cx(styles.list, className)

  if (skeleton) {
    const skeletonItems = Array.from({ length: skeletonCount }, (_, index) => (
      <span
        key={index}
        className={cx(styles.skeletonItem, index === 0 && styles.skeletonItemWide)}
      />
    ))

    return (
      <div
        {...rest}
        ref={ref}
        className={listClassName}
        data-slot="tabs-list"
        data-variant={variant}
        data-style={styleVariant}
        data-inverse={inverse || undefined}
        data-full-width={fullWidth || undefined}
        data-skeleton="true"
        aria-hidden="true"
      >
        {isSegmented ? <div className={styles.track}>{skeletonItems}</div> : skeletonItems}
      </div>
    )
  }

  return (
    <div
      {...rest}
      ref={ref}
      role="tablist"
      aria-orientation={context.orientation}
      className={listClassName}
      data-slot="tabs-list"
      data-variant={variant}
      data-style={styleVariant}
      data-inverse={inverse || undefined}
      data-full-width={fullWidth || undefined}
      onKeyDown={handleKeyDown}
    >
      {isSegmented ? <div className={styles.track}>{children}</div> : children}
    </div>
  )
})

export const TabsTrigger = forwardRef<HTMLButtonElement, TabsTriggerProps>(function TabsTrigger(
  {
    value,
    controls,
    disabled = false,
    leftIcon,
    rightIcon,
    className,
    children,
    onClick,
    ...rest
  },
  ref,
) {
  const context = useTabsContext("TabsTrigger")
  const selected = context.value === value
  const noSelectionYet = context.value === undefined
  const tabId = getTabId(context.baseId, value)
  const panelId = getPanelId(context.baseId, value)

  return (
    <button
      {...rest}
      ref={ref}
      id={tabId}
      type="button"
      role="tab"
      className={cx(styles.trigger, className)}
      data-slot="tabs-trigger"
      aria-selected={selected}
      aria-controls={controls ?? panelId}
      aria-disabled={disabled || undefined}
      tabIndex={disabled ? -1 : selected || noSelectionYet ? 0 : -1}
      data-state={selected ? "active" : "inactive"}
      data-disabled={disabled || undefined}
      onClick={(event) => {
        if (disabled) {
          event.preventDefault()
          return
        }

        onClick?.(event)

        if (!event.defaultPrevented) {
          const tab = event.currentTarget
          context.setValue(value)
          tab.ownerDocument.defaultView?.requestAnimationFrame(() => {
            revealTab(tab, context.orientation)
          })
        }
      }}
    >
      {leftIcon && (
        <span className={styles.icon} data-position="start" aria-hidden="true">
          {leftIcon}
        </span>
      )}
      <span className={styles.label}>{children}</span>
      {rightIcon && (
        <span className={styles.icon} data-position="end" aria-hidden="true">
          {rightIcon}
        </span>
      )}
    </button>
  )
})

export const TabsContent = forwardRef<HTMLDivElement, TabsContentProps>(function TabsContent(
  { value, className, children, ...rest },
  ref,
) {
  const context = useTabsContext("TabsContent")
  const selected = context.value === value
  const tabId = getTabId(context.baseId, value)
  const panelId = getPanelId(context.baseId, value)

  return (
    <div
      {...rest}
      ref={ref}
      id={panelId}
      role="tabpanel"
      aria-labelledby={tabId}
      hidden={!selected}
      tabIndex={0}
      className={cx(styles.content, className)}
      data-slot="tabs-content"
      data-state={selected ? "active" : "inactive"}
    >
      {children}
    </div>
  )
})
