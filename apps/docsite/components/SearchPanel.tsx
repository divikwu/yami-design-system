"use client";

import { Cancel01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Button, Sheet } from "@yami/design-system";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";

import type { SearchEntry, SearchEntryType, SearchResult } from "../lib/search";
import { rankSearchEntries } from "../lib/search";
import { searchIcon } from "./assets";
import styles from "./SearchPanel.module.css";

interface SearchPanelCopy {
  title: string;
  placeholder: string;
  hint: string;
  noResults: string;
  close: string;
  navigate: string;
  select: string;
  groupLabels: Record<SearchEntryType, string>;
}

interface SearchPanelProps {
  open: boolean;
  onClose: () => void;
  entries: SearchEntry[];
  copy: SearchPanelCopy;
}

function resultHref(result: SearchResult): string {
  const heading = result.headings.find((item) => item.text === result.match);
  return heading ? `${result.href}#${heading.id}` : result.href;
}

export function SearchPanel({ open, onClose, entries, copy }: SearchPanelProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const optionRefs = useRef<Array<HTMLAnchorElement | null>>([]);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const searchResults = useMemo(() => rankSearchEntries(entries, query), [entries, query]);
  const results = useMemo<SearchResult[]>(
    () => query
      ? searchResults
      : entries
        .filter((entry) => entry.type === "doc")
        .map((entry) => ({ ...entry, score: 0, match: entry.title })),
    [entries, query, searchResults],
  );

  useEffect(() => setActiveIndex(0), [query]);
  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);
  useEffect(() => {
    if (!open) return undefined;
    const frame = window.requestAnimationFrame(() => inputRef.current?.focus({ preventScroll: true }));
    return () => window.cancelAnimationFrame(frame);
  }, [open]);
  useEffect(() => {
    if (!open) return;
    optionRefs.current[activeIndex]?.scrollIntoView({ block: "nearest" });
  }, [activeIndex, open]);

  const grouped = useMemo(() => {
    const groups = new Map<SearchEntryType, Array<SearchResult & { index: number }>>();
    results.forEach((result, index) => {
      const current = groups.get(result.type) ?? [];
      current.push({ ...result, index });
      groups.set(result.type, current);
    });
    return groups;
  }, [results]);

  function chooseResult(index: number): void {
    const result = results[index];
    if (!result) return;
    router.push(resultHref(result));
    onClose();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>): void {
    if (results.length === 0) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((value) => (value + 1) % results.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((value) => (value - 1 + results.length) % results.length);
    } else if (event.key === "Enter") {
      event.preventDefault();
      chooseResult(activeIndex);
    }
  }

  return (
    <Sheet
      open={open}
      title={copy.title}
      closeLabel={copy.close}
      onClose={onClose}
      size="full"
      contentPadding="none"
      data-slot="docsite-search"
      className={styles.panel}
      footer={(
        <div className={styles.shortcuts} aria-hidden="true">
          <span><kbd>↑↓</kbd>{copy.navigate}</span>
          <span><kbd>↵</kbd>{copy.select}</span>
          <span><kbd>Esc</kbd>{copy.close}</span>
        </div>
      )}
    >
      <div className={styles.searchField}>
        <img className={styles.icon} src={searchIcon} alt="" width={16} height={16} />
        <input
          ref={inputRef}
          autoFocus
          className={styles.control}
          aria-label={copy.title}
          aria-describedby="docsite-search-hint"
          placeholder={copy.placeholder}
          value={query}
          onChange={(event) => setQuery(event.currentTarget.value)}
          onKeyDown={handleKeyDown}
          role="combobox"
          aria-expanded="true"
          aria-autocomplete="list"
          aria-controls="docsite-search-results"
          aria-activedescendant={results[activeIndex] ? `search-result-${activeIndex}` : undefined}
        />
        <p id="docsite-search-hint" className={styles.visuallyHidden}>{copy.hint}</p>
        <Button
          className={styles.close}
          variant="tertiary"
          form="icon"
          size="sm"
          aria-label={copy.close}
          onClick={onClose}
        >
          <HugeiconsIcon icon={Cancel01Icon} size={20} strokeWidth={1.5} aria-hidden="true" />
        </Button>
      </div>

      <div
        id="docsite-search-results"
        className={styles.results}
        role={results.length > 0 ? "listbox" : undefined}
        aria-label={results.length > 0 ? copy.title : undefined}
      >
        {results.length === 0 ? (
          <p className={styles.empty} role="status">{copy.noResults}</p>
        ) : (
          Array.from(grouped.entries()).map(([type, group]) => (
            <section key={type} className={styles.group} role="group" aria-label={copy.groupLabels[type]}>
              <h3 className={styles.groupTitle} aria-hidden="true">{copy.groupLabels[type]}</h3>
              {group.map((result) => (
                <Link
                  id={`search-result-${result.index}`}
                  key={result.id}
                  href={resultHref(result)}
                  className={styles.result}
                  ref={(element) => {
                    optionRefs.current[result.index] = element;
                  }}
                  role="option"
                  aria-selected={activeIndex === result.index}
                  data-active={activeIndex === result.index || undefined}
                  onMouseEnter={() => setActiveIndex(result.index)}
                  onClick={onClose}
                >
                  <strong>{result.title}</strong>
                </Link>
              ))}
            </section>
          ))
        )}
      </div>
    </Sheet>
  );
}
