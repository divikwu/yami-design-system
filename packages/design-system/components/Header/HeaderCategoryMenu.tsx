'use client'

import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent, type RefObject } from 'react'
import { ResponsiveImage } from '../ResponsiveImage'
import type { HeaderCategoryMenuData, HeaderCategoryMenuItem } from './Header.types'
import styles from './HeaderCategoryMenu.module.css'

const arrow = new URL('./assets/category-menu/arrow-right.svg', import.meta.url).href
const SUBMENU_SWITCH_DELAY = 60
const SUBMENU_AIM_DELAY = 300
const SUBMENU_AIM_TOLERANCE = 16
const POINTER_SAMPLE_DISTANCE = 4

type PointerPoint = { x: number; y: number }

function firstExpandableChildId(item: HeaderCategoryMenuItem | undefined) {
  return item?.children?.find((child) => child.children?.length)?.id
}

export function HeaderCategoryMenu({ id, data, headerRef, anchorRef, triggerElement, initialItemId, autoFocus, keyboardOpen, onClose }: {
  id: string
  data: HeaderCategoryMenuData
  headerRef: RefObject<HTMLElement | null>
  anchorRef: RefObject<HTMLButtonElement | null>
  triggerElement: HTMLElement | null
  initialItemId?: string
  autoFocus: boolean
  keyboardOpen: boolean
  onClose: (restoreFocus?: boolean) => void
}) {
  const initialFirst = data.items.find((item) => item.id === initialItemId) ?? data.items[0]
  const [firstId, setFirstId] = useState(initialFirst?.id)
  const [secondId, setSecondId] = useState(() => firstExpandableChildId(initialFirst))
  const [position, setPosition] = useState({ top: 0, left: 0, scrimTop: 0 })
  const menuRef = useRef<HTMLElement>(null)
  const submenuTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const pointerHistoryRef = useRef<PointerPoint | undefined>(undefined)
  const keyboardMode = useRef(keyboardOpen)
  const first = data.items.find((item) => item.id === firstId) ?? data.items[0]
  const second = first?.children?.find((item) => item.id === secondId)
  const columns = [data.items, first?.children ?? [], second?.children ?? []]
  const columnCount = second?.children?.length ? 3 : 2
  const imagePresentation = data.presentation === 'images'
  const hasThirdColumn = initialFirst?.children?.some((child) => child.children?.length)
  const positioningColumnCount = hasThirdColumn ? 3 : 2
  const positioningWidth = imagePresentation && positioningColumnCount === 3
    ? 938
    : positioningColumnCount * 249

  useLayoutEffect(() => {
    function measure() {
      const header = headerRef.current?.getBoundingClientRect()
      const anchor = anchorRef.current?.getBoundingClientRect()
      if (!header || !anchor) return
      const trigger = triggerElement?.getBoundingClientRect() ?? anchor
      const top = Math.max(0, header.bottom)
      // Align the second column after the 248px root column and 1px menu border.
      const left = Math.max(
        anchor.left,
        Math.min(trigger.left - 249, window.innerWidth - positioningWidth - anchor.left),
      )
      setPosition({ top, left, scrimTop: Math.max(0, header.bottom) })
    }
    measure()
    const observer = new ResizeObserver(measure)
    if (headerRef.current) observer.observe(headerRef.current)
    window.addEventListener('resize', measure)
    window.addEventListener('scroll', measure, true)
    return () => {
      observer.disconnect()
      window.removeEventListener('resize', measure)
      window.removeEventListener('scroll', measure, true)
    }
  }, [positioningWidth, headerRef, anchorRef, triggerElement])

  useLayoutEffect(() => {
    const nextFirst = data.items.find((item) => item.id === initialItemId) ?? data.items[0]
    setFirstId(nextFirst?.id)
    setSecondId(firstExpandableChildId(nextFirst))
  }, [data.items, initialItemId])

  useLayoutEffect(() => {
    const requestedId = initialItemId ?? data.items[0]?.id
    const rootItems = menuRef.current?.querySelectorAll<HTMLElement>(
      '[data-level="0"] [data-item-id]',
    )
    const requestedRoot = [...(rootItems ?? [])].find(
      (item) => item.dataset.itemId === requestedId,
    )
    requestedRoot?.scrollIntoView({ block: 'nearest', inline: 'nearest' })
  }, [data.items, initialItemId])

  useLayoutEffect(() => {
    if (autoFocus) {
      const rootItems = menuRef.current?.querySelectorAll<HTMLElement>(
        '[data-level="0"] [data-item-id]',
      )
      const requestedRoot = [...(rootItems ?? [])].find(
        (item) => item.dataset.itemId === initialItemId,
      )
      const focusTarget =
        requestedRoot ?? menuRef.current?.querySelector<HTMLElement>('button, a[href]')
      focusTarget?.focus()
    }
  }, [autoFocus, initialItemId])

  useLayoutEffect(() => {
    keyboardMode.current = keyboardOpen
  }, [keyboardOpen])

  useEffect(() => () => clearTimeout(submenuTimerRef.current), [])

  useEffect(() => {
    const menu = menuRef.current!
    const trigger = triggerElement
    if (!trigger) return undefined
    let closeTimer: ReturnType<typeof setTimeout> | undefined
    const triggerBounds = trigger.getBoundingClientRect()
    let previousPoint = { x: triggerBounds.left + triggerBounds.width / 2, y: triggerBounds.top + triggerBounds.height / 2 }
    let corridorOrigin: typeof previousPoint | undefined
    let inCorridor = false
    const inside = (target: EventTarget | null) => target instanceof Node && (menu.contains(target) || trigger.contains(target))
    function cancelClose() {
      clearTimeout(closeTimer)
      closeTimer = undefined
      corridorOrigin = undefined
      inCorridor = false
    }
    function scheduleClose(delay: number) {
      clearTimeout(closeTimer)
      closeTimer = setTimeout(() => {
        if (!keyboardMode.current) onClose(menu.contains(document.activeElement))
      }, delay)
    }
    function towardsMenu(point: typeof previousPoint) {
      if (!corridorOrigin || point.y <= previousPoint.y) return false
      const bounds = menu.getBoundingClientRect()
      const height = bounds.top + 8 - corridorOrigin.y
      if (height <= 0) return false
      const progress = (point.y - corridorOrigin.y) / height
      // A triangle from the exit point to the panel's upper edge, not an overlay.
      return progress >= 0 && progress <= 1
        && point.x >= corridorOrigin.x + (bounds.left - corridorOrigin.x) * progress - 8
        && point.x <= corridorOrigin.x + (bounds.right - corridorOrigin.x) * progress + 8
    }
    function leave(event: globalThis.PointerEvent) {
      if (event.pointerType !== 'mouse' || inside(event.relatedTarget) || keyboardMode.current) return
      cancelClose()
      if (event.currentTarget === trigger) corridorOrigin = previousPoint
      inCorridor = towardsMenu({ x: event.clientX, y: event.clientY })
      scheduleClose(inCorridor ? 350 : 200)
    }
    function move(event: globalThis.PointerEvent) {
      if (event.pointerType !== 'mouse') return
      const point = { x: event.clientX, y: event.clientY }
      if (inside(event.target)) cancelClose()
      else if (closeTimer !== undefined && !keyboardMode.current) {
        if (towardsMenu(point)) {
          inCorridor = true
          scheduleClose(350)
        } else if (inCorridor) {
          inCorridor = false
          scheduleClose(200)
        }
      }
      previousPoint = point
    }
    function pointerDown() {
      keyboardMode.current = false
    }
    function dismiss(event: globalThis.KeyboardEvent) {
      if (inside(event.target)) {
        keyboardMode.current = true
        cancelClose()
      }
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose(true)
      }
    }
    // Hovering another parent can remove the focused child and return focus to body.
    document.addEventListener('keydown', dismiss)
    document.addEventListener('pointermove', move)
    for (const region of [menu, trigger]) {
      region.addEventListener('pointerenter', cancelClose)
      region.addEventListener('pointerleave', leave)
      region.addEventListener('pointerdown', pointerDown)
    }
    return () => {
      cancelClose()
      document.removeEventListener('keydown', dismiss)
      document.removeEventListener('pointermove', move)
      for (const region of [menu, trigger]) {
        region.removeEventListener('pointerenter', cancelClose)
        region.removeEventListener('pointerleave', leave)
        region.removeEventListener('pointerdown', pointerDown)
      }
    }
  }, [onClose, triggerElement])

  function cancelSubmenuSelect() {
    clearTimeout(submenuTimerRef.current)
    submenuTimerRef.current = undefined
  }

  function select(item: HeaderCategoryMenuItem, level: number) {
    cancelSubmenuSelect()
    if (level === 0) {
      setFirstId(item.id)
      setSecondId(firstExpandableChildId(item))
    } else if (level === 1) {
      setSecondId(item.id)
    }
  }

  function trackPointer(event: PointerEvent<HTMLElement>) {
    if (event.pointerType !== 'mouse') return
    const point = { x: event.clientX, y: event.clientY }
    const current = pointerHistoryRef.current
    if (current && Math.hypot(point.x - current.x, point.y - current.y) < POINTER_SAMPLE_DISTANCE) return
    pointerHistoryRef.current = point
  }

  function movingTowardSubmenu(level: number, point: PointerPoint) {
    const previous = pointerHistoryRef.current
    const nextColumn = menuRef.current?.querySelector<HTMLElement>(`[data-level="${level + 1}"]`)
    if (!previous || !nextColumn || point.x <= previous.x) return false
    const bounds = nextColumn.getBoundingClientRect()
    const distanceX = point.x - previous.x
    const projectedY = previous.y
      + (point.y - previous.y) * ((bounds.left - previous.x) / distanceX)
    return point.x < bounds.left
      && projectedY >= bounds.top - SUBMENU_AIM_TOLERANCE
      && projectedY <= bounds.bottom + SUBMENU_AIM_TOLERANCE
  }

  function scheduleSelect(item: HeaderCategoryMenuItem, level: number, event: PointerEvent<HTMLElement>) {
    cancelSubmenuSelect()
    if (level >= 2) return
    const active = level === 0 ? item.id === first?.id : item.id === second?.id
    if (active) return
    const delay = movingTowardSubmenu(level, { x: event.clientX, y: event.clientY })
      ? SUBMENU_AIM_DELAY
      : SUBMENU_SWITCH_DELAY
    submenuTimerRef.current = setTimeout(() => select(item, level), delay)
  }

  function handleKeys(event: KeyboardEvent<HTMLElement>, item: HeaderCategoryMenuItem, level: number) {
    const list = event.currentTarget.closest('ul')!
    const siblings = Array.from(list.querySelectorAll<HTMLElement>('button, a[href]'))
    const index = siblings.indexOf(event.currentTarget)
    if (imagePresentation && level === 2 && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) {
      event.preventDefault()
      if (event.key === 'ArrowLeft' && index % 3 === 0) {
        menuRef.current?.querySelector<HTMLElement>('[data-level="1"] [aria-expanded="true"]')?.focus()
      } else {
        const offset = event.key === 'ArrowUp' ? -3 : event.key === 'ArrowDown' ? 3 : event.key === 'ArrowLeft' ? -1 : 1
        if (event.key !== 'ArrowRight' || index % 3 !== 2) siblings[index + offset]?.focus()
      }
      return
    }
    const offsets: Record<string, number> = { ArrowDown: 1, ArrowUp: -1 }
    if (event.key in offsets) {
      event.preventDefault()
      siblings[(index + offsets[event.key]! + siblings.length) % siblings.length]?.focus()
    } else if (event.key === 'Home' || event.key === 'End') {
      event.preventDefault()
      siblings[event.key === 'Home' ? 0 : siblings.length - 1]?.focus()
    } else if (event.key === 'ArrowRight' && item.children?.length && level < 2) {
      event.preventDefault()
      const childSelector = `[data-level="${level + 1}"] button, [data-level="${level + 1}"] a[href]`
      const visibleChild = (level === 0 ? first?.id : second?.id) === item.id
        ? menuRef.current?.querySelector<HTMLElement>(childSelector)
        : null
      select(item, level)
      if (visibleChild) visibleChild.focus()
      else requestAnimationFrame(() => menuRef.current?.querySelector<HTMLElement>(childSelector)?.focus())
    } else if (event.key === 'ArrowLeft' && level > 0) {
      event.preventDefault()
      menuRef.current?.querySelector<HTMLElement>(`[data-level="${level - 1}"] [aria-expanded="true"]`)?.focus()
    }
  }

  return (
    <div className={styles.overlay} style={{ '--category-menu-top': `${position.top}px` } as CSSProperties}>
      <button
        className={styles.scrim}
        style={{ top: position.scrimTop }}
        data-slot="header-category-scrim"
        type="button"
        tabIndex={-1}
        aria-label={data.closeLabel}
        onClick={() => onClose(true)}
      />
      <nav
        id={id}
        ref={menuRef}
        className={`${styles.menu}${imagePresentation ? ` ${styles.imagesMenu}` : ''}`}
        style={{ left: position.left }}
        aria-label={data.label}
        data-slot="header-category-menu"
        data-columns={columnCount}
        data-presentation={imagePresentation ? 'images' : 'text'}
        onPointerMove={trackPointer}
        onPointerLeave={cancelSubmenuSelect}
        onBlur={(event) => {
          const next = event.relatedTarget
          if (next instanceof Element && !event.currentTarget.contains(next) && next !== triggerElement && !next.closest('[data-slot="header-category-scrim"]')) onClose()
        }}
      >
        {columns.slice(0, columnCount).map((items, level) => (
          <ul
            className={`${styles.column}${imagePresentation && level === 2 ? ` ${styles.imageColumn}` : ''}`}
            key={`${level}-${level === 0 ? 'root' : level === 1 ? first?.id : second?.id}`}
            id={`${id}-level-${level}`}
            aria-label={level === 0 ? data.label : level === 1 ? first?.label : second?.label}
            data-level={level}
          >
            {items.map((item) => {
              const branch = level < 2 && Boolean(item.children?.length)
              const active = level === 0 ? item.id === first?.id : level === 1 && item.id === second?.id
              const content = <>
                {level === 0 && item.image && <ResponsiveImage className={styles.icon} source={(active && item.activeImage ? item.activeImage : item.image).src} alt="" width={20} height={20} />}
                {imagePresentation && level === 2 && item.image && <span className={styles.imageFrame} data-image-ratio={item.imageRatio ?? 1}>
                  <ResponsiveImage source={item.image.src} alt="" width={item.imageRatio === 2 ? 160 : 80} height={80} loading="lazy" />
                </span>}
                <span className={styles.label}>{item.label}</span>
                {branch && <img className={styles.arrow} src={arrow} width={16} height={16} alt="" />}
              </>
              const shared = {
                className: styles.item,
                title: imagePresentation && level === 2 ? item.label : undefined,
                'data-item-id': item.id,
                'data-active': active || undefined,
                style: {
                  '--category-font-color': item.fontColor,
                } as CSSProperties,
                onPointerEnter: (event: PointerEvent<HTMLElement>) => {
                  if (event.pointerType === 'mouse') scheduleSelect(item, level, event)
                },
                onFocus: () => select(item, level),
                onKeyDown: (event: KeyboardEvent<HTMLElement>) => handleKeys(event, item, level),
              }
              return <li key={item.id}>
                {branch ? (
                  <button {...shared} type="button" aria-expanded={active} aria-controls={active ? `${id}-level-${level + 1}` : undefined} onClick={() => select(item, level)}>{content}</button>
                ) : (
                  <a {...shared} href={item.href} onClick={() => onClose()}>{content}</a>
                )}
              </li>
            })}
          </ul>
        ))}
      </nav>
    </div>
  )
}
