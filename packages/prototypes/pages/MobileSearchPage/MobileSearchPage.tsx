"use client";

import { useRef, useState, type FormEvent } from "react";

import styles from "./MobileSearchPage.module.css";
import {
  coffeeSuggestions,
  hotDeals,
  popularSearches,
  recentSearches,
} from "./fixtures";
import type { MobileSearchPageProps } from "./MobileSearchPage.types";

const backIcon = new URL(
  "../../../design-system/assets/icons/action/arrow-left.svg",
  import.meta.url,
).href;
const cameraIcon = new URL(
  "../../../design-system/assets/icons/action/camera.svg",
  import.meta.url,
).href;
const closeIcon = new URL(
  "../../../design-system/assets/icons/action/close.svg",
  import.meta.url,
).href;
const deleteIcon = new URL(
  "../../../design-system/assets/icons/action/delete.svg",
  import.meta.url,
).href;
const searchIcon = new URL(
  "../../../design-system/assets/icons/action/search.svg",
  import.meta.url,
).href;
const arrowDownIcon = new URL(
  "../../../design-system/assets/icons/system/arrow-down.svg",
  import.meta.url,
).href;
const hotIcon = new URL("../SearchResultsPage/assets/hot.svg", import.meta.url).href;

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function MobileSearchPage({
  initialQuery = "",
  backHref,
  className,
  ...rest
}: MobileSearchPageProps) {
  const [query, setQuery] = useState(initialQuery);
  const [showRecent, setShowRecent] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);
  const hasQuery = query.trim().length > 0;

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
  }

  return (
    <div
      {...rest}
      className={cx(styles.root, className)}
      data-slot="mobile-search-page"
      data-state={hasQuery ? "suggestions" : "discovery"}
    >
      <header className={styles.header} data-slot="mobile-search-header">
        <a
          className={styles.back}
          data-slot="mobile-search-back"
          href={backHref}
          target={backHref ? "_top" : undefined}
          aria-label="Back"
          onClick={(event) => {
            if (backHref) return;
            event.preventDefault();
            window.history.back();
          }}
        >
          <img src={backIcon} alt="" width={24} height={24} />
        </a>
        <form className={styles.search} role="search" onSubmit={submitSearch}>
          <input
            ref={inputRef}
            autoFocus
            type="search"
            autoComplete="off"
            aria-label="Search"
            placeholder="Best 300K Asian products to explore"
            value={query}
            onChange={(event) => setQuery(event.currentTarget.value)}
          />
          {hasQuery ? (
            <button
              className={`${styles.fieldAction} ${styles.clearAction}`}
              type="button"
              aria-label="Clear search"
              onClick={() => {
                setQuery("");
                inputRef.current?.focus();
              }}
            >
              <img src={closeIcon} alt="" width={20} height={20} />
            </button>
          ) : (
            <button
              className={styles.fieldAction}
              type="button"
              aria-label="Search by photo"
            >
              <img src={cameraIcon} alt="" width={20} height={20} />
            </button>
          )}
          <button className={styles.submit} type="submit" aria-label="Search">
            <img src={searchIcon} alt="" width={20} height={20} />
          </button>
        </form>
      </header>

      {hasQuery ? (
        <main className={styles.suggestions} data-slot="mobile-search-suggestions">
          {coffeeSuggestions.map((suggestion, index) => (
            <button
              className={styles.suggestion}
              key={`${suggestion.label}-${index}`}
              type="button"
              onClick={() => {
                setQuery(suggestion.label);
                inputRef.current?.focus();
              }}
            >
              <span className={styles.suggestionMedia}>
                {suggestion.image ? (
                  <img src={suggestion.image} alt="" width={40} height={40} />
                ) : (
                  <img
                    className={styles.suggestionPlaceholderIcon}
                    src={searchIcon}
                    alt=""
                    width={24}
                    height={24}
                  />
                )}
              </span>
              <span>{suggestion.label}</span>
              <img className={styles.fillIcon} src={backIcon} alt="" width={16} height={16} />
            </button>
          ))}
        </main>
      ) : (
        <main className={styles.discovery} data-slot="mobile-search-discovery">
          {showRecent && (
            <section className={styles.section}>
              <div className={styles.sectionHeading}>
                <h2>Recent Searches</h2>
                <button type="button" aria-label="Clear recent searches" onClick={() => setShowRecent(false)}>
                  <img src={deleteIcon} alt="" width={20} height={20} />
                </button>
              </div>
              <div className={styles.recentTags}>
                {recentSearches.map((item) => (
                  <a key={item.label} href={item.href} target="_top">{item.label}</a>
                ))}
                <button className={styles.more} type="button" aria-label="More recent searches">
                  <img src={arrowDownIcon} alt="" width={16} height={16} />
                </button>
              </div>
            </section>
          )}

          <section className={styles.section}>
            <h2>Popular Searches</h2>
            <ol className={styles.popular}>
              {popularSearches.map((item) => (
                <li key={item.label}>
                  <a href={item.href} target="_top">
                    <span>{item.label}</span>
                  </a>
                </li>
              ))}
            </ol>
          </section>

          <section className={styles.hotDeals}>
            <h2><img src={hotIcon} alt="" width={16} height={16} /> Hot Deals</h2>
            <ul>
              {hotDeals.map((deal, index) => (
                <li key={`${deal.label}-${index}`}>
                  <a href={deal.href} target="_top">
                    <div className={styles.hotDealRow}>
                      <div className={styles.hotDealMarker} aria-hidden="true">•</div>
                      <span>{deal.label}</span>
                      {deal.badge && <em>{deal.badge}</em>}
                    </div>
                  </a>
                </li>
              ))}
            </ul>
          </section>
        </main>
      )}
    </div>
  );
}
