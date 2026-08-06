'use client'

import styles from './Header.module.css'
import type { HeaderSearchProps } from './Header.types'

const cameraIcon = new URL('../../assets/icons/action/camera.svg', import.meta.url).href

function SearchIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <circle cx="8.75" cy="8.75" r="5.25" stroke="currentColor" strokeWidth="1.75" />
      <path
        d="m12.75 12.75 3.75 3.75"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  )
}

/**
 * Search field — 40px pill with an embedded 52 × 32 submit at PC, 36px with a
 * 48 × 28 submit and a visual-search control at mobile.
 *
 * Deliberately not composed from `Input`: the header field is a pill
 * (`--radius-button-primary`) with an embedded submit control and no embedded
 * label, while `Input` is an 8px labelled form field with helper, clear, and
 * error machinery. See usage.md → "Why the search field is not an Input".
 */
export function HeaderSearch({
  placeholder,
  value,
  onValueChange,
  onSubmit,
  searchLabel,
  variant = 'pc',
  scanLabel,
  onScan,
}: HeaderSearchProps) {
  const isMobile = variant === 'mobile'

  return (
    <form
      className={isMobile ? `${styles.search} ${styles.searchMobile}` : styles.search}
      data-slot="header-search"
      data-variant={variant}
      role="search"
      aria-label={searchLabel}
      onSubmit={(event) => {
        event.preventDefault()
        const field = event.currentTarget.elements.namedItem('q')
        onSubmit?.(field instanceof HTMLInputElement ? field.value : '')
      }}
    >
      <input
        className={styles.searchField}
        data-slot="header-search-field"
        name="q"
        type="search"
        autoComplete="off"
        placeholder={placeholder}
        aria-label={searchLabel}
        value={value}
        onChange={(event) => onValueChange?.(event.currentTarget.value)}
      />
      {isMobile && scanLabel && (
        <button
          className={styles.searchScan}
          data-slot="header-search-scan"
          type="button"
          aria-label={scanLabel}
          onClick={onScan}
        >
          <span
            className={styles.searchScanIcon}
            aria-hidden="true"
            style={{ ['--scan-icon' as string]: `url("${cameraIcon}")` }}
          />
        </button>
      )}
      <button className={styles.searchSubmit} type="submit" aria-label={searchLabel}>
        <SearchIcon />
      </button>
    </form>
  )
}
