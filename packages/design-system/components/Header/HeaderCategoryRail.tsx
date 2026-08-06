'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

import styles from './Header.module.css'
import type { HeaderCategoryRailProps } from './Header.types'

const allIcon = new URL('../../assets/icons/base/all.svg', import.meta.url).href

/**
 * Boundary tolerance in px. Fractional `scrollWidth` / `clientWidth` leave the
 * resting `scrollLeft` a hair short of the computed maximum, so a 1px epsilon
 * reports "not at the end" at the true end and leaves a dead pager mounted.
 */
const EDGE_EPSILON = 2

function ChevronIcon({ direction }: { direction: 'left' | 'right' }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d={direction === 'left' ? 'm10 3-5 5 5 5' : 'm6 3 5 5-5 5'}
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

/**
 * Second header row — category entries as artwork + label, with edge paging.
 *
 * Paging controls overlay the rail edges and are removed at the boundaries
 * rather than disabled, matching the production header (which sets
 * `display: none` on the spent control) and keeping the row height fixed.
 */
export function HeaderCategoryRail({
  categories,
  ariaLabel,
  previousLabel,
  nextLabel,
}: HeaderCategoryRailProps) {
  const railRef = useRef<HTMLUListElement>(null)
  const [edges, setEdges] = useState({ atStart: true, atEnd: true })

  const updateEdges = useCallback(() => {
    const rail = railRef.current
    if (!rail) return
    const maxScrollLeft = Math.max(0, rail.scrollWidth - rail.clientWidth)
    setEdges({
      atStart: rail.scrollLeft <= EDGE_EPSILON,
      atEnd: rail.scrollLeft >= maxScrollLeft - EDGE_EPSILON,
    })
  }, [])

  useEffect(() => {
    updateEdges()
    const rail = railRef.current
    if (!rail || typeof ResizeObserver === 'undefined') return undefined
    const observer = new ResizeObserver(updateEdges)
    observer.observe(rail)
    return () => observer.disconnect()
  }, [categories.length, updateEdges])

  function scrollRail(direction: -1 | 1) {
    const rail = railRef.current
    if (!rail) return
    const reduceMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    // Page by the viewport minus one entry so the boundary entry stays visible
    // as an anchor between pages.
    const entry = rail.firstElementChild as HTMLElement | null
    const step = Math.max(rail.clientWidth - (entry?.offsetWidth ?? 0), 1)

    if (typeof rail.scrollBy === 'function') {
      rail.scrollBy({ left: direction * step, behavior: reduceMotion ? 'auto' : 'smooth' })
    } else {
      rail.scrollLeft += direction * step
      updateEdges()
    }
  }

  return (
    <nav className={styles.rail} data-slot="header-categories" aria-label={ariaLabel}>
      <ul
        ref={railRef}
        className={styles.railList}
        data-slot="header-categories-list"
        onScroll={updateEdges}
      >
        {categories.map((category) => (
          <li
            key={category.id}
            className={styles.railItem}
            data-group-start={category.startsGroup || undefined}
          >
            {category.startsGroup && (
              <span className={styles.railGroupDivider} aria-hidden="true" />
            )}
            <a className={styles.category} href={category.href} data-slot="header-category">
              {category.badges && category.badges.length > 0 && (
                <span className={styles.categoryBadges} data-slot="header-category-badges">
                  {category.badges.map((badge) => (
                    <span key={badge} className={styles.categoryBadge}>
                      {badge}
                    </span>
                  ))}
                </span>
              )}
              <span className={styles.categoryMedia}>
                {category.image ? (
                  <img
                    className={styles.categoryImage}
                    src={category.image.src}
                    alt={category.image.alt}
                    width={24}
                    height={24}
                    loading="lazy"
                    decoding="async"
                  />
                ) : (
                  <span
                    className={styles.categoryBuiltinIcon}
                    data-slot="header-all-icon"
                    aria-hidden="true"
                    style={{ ['--category-icon' as string]: `url("${allIcon}")` }}
                  />
                )}
              </span>
              <span className={styles.categoryLabel} data-slot="header-category-label">
                {category.label}
              </span>
            </a>
          </li>
        ))}
      </ul>

      {!edges.atStart && (
        <>
          <span
            className={`${styles.railControlMask} ${styles.railControlMaskPrevious}`}
            data-slot="header-category-control-mask"
            data-direction="previous"
            aria-hidden="true"
          />
          <button
            className={`${styles.railControl} ${styles.railControlPrevious}`}
            type="button"
            aria-label={previousLabel}
            onClick={() => scrollRail(-1)}
          >
            <ChevronIcon direction="left" />
          </button>
        </>
      )}
      {!edges.atEnd && (
        <>
          <span
            className={`${styles.railControlMask} ${styles.railControlMaskNext}`}
            data-slot="header-category-control-mask"
            data-direction="next"
            aria-hidden="true"
          />
          <button
            className={`${styles.railControl} ${styles.railControlNext}`}
            type="button"
            aria-label={nextLabel}
            onClick={() => scrollRail(1)}
          >
            <ChevronIcon direction="right" />
          </button>
        </>
      )}
    </nav>
  )
}
