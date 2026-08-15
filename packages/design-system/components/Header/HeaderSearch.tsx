'use client'

import { useId, useRef, useState } from 'react'
import { ResponsiveImage } from '../ResponsiveImage'

import styles from './Header.module.css'
import type { HeaderSearchProps, HeaderSearchTag } from './Header.types'

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
  panel,
  openHref,
  variant = 'pc',
  scanLabel,
  onScan,
}: HeaderSearchProps) {
  const isMobile = variant === 'mobile'
  const [draftValue, setDraftValue] = useState(value ?? '')
  const [isOpen, setIsOpen] = useState(false)
  const [recentCleared, setRecentCleared] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const panelId = useId()
  const query = value ?? draftValue
  const canOpenPanel = !isMobile && panel !== undefined

  function openMobileSearch() {
    if (isMobile && openHref) window.location.assign(openHref)
  }

  function updateValue(nextValue: string) {
    if (value === undefined) setDraftValue(nextValue)
    onValueChange?.(nextValue)
  }

  function chooseQuery(nextValue: string) {
    updateValue(nextValue)
    inputRef.current?.focus()
  }

  function renderTag(tag: HeaderSearchTag, key: string) {
    const content = (
      <>
        {tag.label}
        {tag.badge && <em>{tag.badge}</em>}
      </>
    )

    return tag.href ? (
      <a key={key} href={tag.href}>
        {content}
      </a>
    ) : (
      <button key={key} type="button" onClick={() => chooseQuery(tag.label)}>
        {content}
      </button>
    )
  }

  const discoveryGroups = panel
    ? [
        {
          id: 'popular',
          title: panel.popularTitle,
          tags: panel.popular,
        },
        {
          id: 'hot-deals',
          title: panel.hotDealsTitle,
          tags: panel.hotDeals,
        },
      ]
    : []

  return (
    <form
      className={isMobile ? `${styles.search} ${styles.searchMobile}` : styles.search}
      data-slot="header-search"
      data-variant={variant}
      data-open={isOpen || undefined}
      role="search"
      aria-label={searchLabel}
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          setIsOpen(false)
          inputRef.current?.blur()
        }
      }}
      onSubmit={(event) => {
        event.preventDefault()
        const field = event.currentTarget.elements.namedItem('q')
        setIsOpen(false)
        onSubmit?.(field instanceof HTMLInputElement ? field.value : '')
      }}
    >
      <input
        ref={inputRef}
        className={styles.searchField}
        data-slot="header-search-field"
        name="q"
        type="search"
        autoComplete="off"
        placeholder={placeholder}
        aria-label={searchLabel}
        aria-expanded={canOpenPanel ? isOpen : undefined}
        aria-controls={canOpenPanel ? panelId : undefined}
        aria-haspopup={canOpenPanel ? 'dialog' : undefined}
        value={query}
        onFocus={() => {
          if (isMobile && openHref) {
            openMobileSearch()
            return
          }
          if (canOpenPanel) setIsOpen(true)
        }}
        onClick={openMobileSearch}
        onChange={(event) => updateValue(event.currentTarget.value)}
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

      {canOpenPanel && isOpen && (
        <>
          <button
            className={styles.searchScrim}
            type="button"
            aria-label={`Close ${searchLabel.toLowerCase()}`}
            onClick={() => setIsOpen(false)}
          />
          <div
            className={styles.searchPanel}
            data-slot="header-search-panel"
            data-state={query.trim() ? 'suggestions' : 'discovery'}
            id={panelId}
            role="dialog"
            aria-label={`${searchLabel} suggestions`}
          >
            {query.trim() ? (
              <div className={styles.searchSuggestionGrid}>
                {panel.suggestions.map((suggestion, index) => {
                  const matchLength = Math.min(query.trim().length, suggestion.label.length)
                  return (
                    <button
                      key={suggestion.label}
                      className={styles.searchSuggestion}
                      data-selected={index === 0 || undefined}
                      type="button"
                      onClick={() => chooseQuery(suggestion.label)}
                    >
                      <span className={styles.searchSuggestionMedia}>
                        <ResponsiveImage
                          source={suggestion.image.src}
                          alt={suggestion.image.alt}
                          width={200}
                          height={200}
                        />
                      </span>
                      <span className={styles.searchSuggestionLabel}>
                        {suggestion.label.slice(0, matchLength)}
                        <strong>{suggestion.label.slice(matchLength)}</strong>
                      </span>
                    </button>
                  )
                })}
              </div>
            ) : (
              <>
                {!recentCleared && panel.recent.length > 0 && (
                  <section className={styles.searchPanelSection}>
                    <div className={styles.searchPanelHeading}>
                      <h2>{panel.recentTitle}</h2>
                      <button type="button" onClick={() => setRecentCleared(true)}>
                        {panel.clearLabel}
                      </button>
                    </div>
                    <div className={styles.searchTags}>
                      {panel.recent.map((recent, index) => {
                        const tag = typeof recent === 'string' ? { label: recent } : recent
                        return renderTag(tag, `recent-${tag.label}-${index}`)
                      })}
                    </div>
                  </section>
                )}
                {discoveryGroups.map((group) => (
                  <section className={styles.searchPanelSection} key={group.id}>
                    <div className={styles.searchPanelHeading}>
                      <h2>{group.title}</h2>
                    </div>
                    <div className={styles.searchTags}>
                      {group.tags.map((tag, index) =>
                        renderTag(tag, `${group.id}-${tag.label}-${index}`),
                      )}
                    </div>
                  </section>
                ))}
              </>
            )}
          </div>
        </>
      )}
    </form>
  )
}
