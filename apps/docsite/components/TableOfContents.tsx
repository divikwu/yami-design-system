"use client";

import type { ContentHeading } from "../lib/content";
import { useActiveHeading } from "./useActiveHeading";
import styles from "./TableOfContents.module.css";

export function TableOfContents({ headings, label }: { headings: ContentHeading[]; label: string }) {
  const activeId = useActiveHeading(headings);

  return (
    <nav
      className={styles.root}
      aria-label={label}
    >
      <ol>
        {headings.map((heading) => (
          <li key={heading.id} data-level={heading.level}>
            <a href={`#${heading.id}`} aria-current={activeId === heading.id ? "location" : undefined}>
              {heading.text}
            </a>
          </li>
        ))}
      </ol>
      <span className={styles.track} aria-hidden="true" />
    </nav>
  );
}
