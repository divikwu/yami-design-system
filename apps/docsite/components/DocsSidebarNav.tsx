"use client";

import { ArrowDown01Icon, ArrowUpRight01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";
import { useId, useState } from "react";

import { docGroups } from "../lib/docs-navigation";

import type { DocNavItem } from "./DocsMobileControls";
import styles from "./DocPage.module.css";

type DocGroup = DocNavItem["group"];

export function DocsSidebarNav({
  label,
  groups,
  items,
  onNavigate,
}: {
  label: string;
  groups: Record<DocGroup, string>;
  items: DocNavItem[];
  onNavigate?: () => void;
}) {
  const instanceId = useId();
  const [expandedGroups, setExpandedGroups] = useState<Record<DocGroup, boolean>>({
    start: true,
    ai: true,
    collaboration: true,
    resources: true,
  });
  const entryItem = items.find((item) => item.group === "start");

  return (
    <nav className={styles.sidebarNav} aria-label={label}>
      {entryItem ? (
        <div className={styles.sidebarItems}>
          <Link href={entryItem.href} aria-current={entryItem.current ? "page" : undefined} onClick={onNavigate}>
            {entryItem.title}
          </Link>
        </div>
      ) : null}
      {docGroups.map((group) => {
        const groupItems = items.filter((item) => item.group === group && item.slug !== entryItem?.slug);
        const headingId = `docs-sidebar-${instanceId}-${group}`;
        const contentId = `${headingId}-items`;
        const expanded = expandedGroups[group];

        return (
          <section className={styles.sidebarSection} key={group} aria-labelledby={headingId}>
            <h2 className={styles.sidebarSectionTitle} id={headingId}>{groups[group]}</h2>
            <button
              className={styles.sidebarGroupButton}
              type="button"
              aria-expanded={expanded}
              aria-controls={contentId}
              onClick={() => setExpandedGroups((current) => ({ ...current, [group]: !current[group] }))}
            >
              <span>{groups[group]}</span>
              <span className={styles.sidebarGroupIcon} data-expanded={expanded} aria-hidden="true">
                <HugeiconsIcon icon={ArrowDown01Icon} size={14} strokeWidth={1.5} />
              </span>
            </button>
            <div
              className={styles.sidebarNestedItems}
              id={contentId}
              role="group"
              aria-labelledby={headingId}
              aria-hidden={!expanded}
              inert={!expanded}
              data-expanded={expanded}
            >
              <div className={styles.sidebarNestedItemsInner}>
                {groupItems.map((item) => (
                  <Link key={item.slug} href={item.href} aria-current={item.current ? "page" : undefined} target={item.external ? "_blank" : undefined} rel={item.external ? "noreferrer" : undefined} onClick={onNavigate}>
                    {item.title}{item.external ? <HugeiconsIcon icon={ArrowUpRight01Icon} size={14} aria-hidden="true" /> : null}
                  </Link>
                ))}
              </div>
            </div>
          </section>
        );
      })}
    </nav>
  );
}
