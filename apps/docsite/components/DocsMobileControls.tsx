"use client";

import { Select } from "@base-ui/react/select";
import { ArrowDown01Icon, Tick02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useEffect, useState } from "react";
import type { SiteCopy } from "../content/site";
import type { ContentHeading } from "../lib/content";
import type { DocGroup } from "../lib/docs-navigation";
import { useActiveHeading } from "./useActiveHeading";
import styles from "./DocsMobileControls.module.css";

export interface DocNavItem {
  slug: string;
  title: string;
  href: string;
  group: DocGroup;
  current: boolean;
  external?: boolean;
}

export function DocsMobileControls({
  headings,
  copy,
}: {
  headings: ContentHeading[];
  copy: Pick<SiteCopy["docs"], "onThisPage">;
}) {
  const activeId = useActiveHeading(headings);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 1025px)");
    const closeOnDesktop = () => { if (desktop.matches) setOpen(false); };
    desktop.addEventListener("change", closeOnDesktop);
    return () => desktop.removeEventListener("change", closeOnDesktop);
  }, []);

  return (
    <div className={styles.root}>
      <Select.Root
        items={headings.map((heading) => ({ value: heading.id, label: heading.text }))}
        value={activeId || null}
        open={open}
        onOpenChange={setOpen}
        modal={false}
        highlightItemOnHover={false}
        onValueChange={(id) => {
          if (!id) return;
          const target = document.getElementById(id);
          target?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
          window.history.replaceState(null, "", `#${id}`);
        }}
      >
        <div className={styles.tocSelect}>
          <Select.Trigger className={styles.trigger} aria-label={copy.onThisPage} data-value={activeId}>
            <Select.Value className={styles.value} placeholder={copy.onThisPage} />
            <Select.Icon className={styles.chevron}>
              <HugeiconsIcon icon={ArrowDown01Icon} size={16} strokeWidth={1.5} aria-hidden="true" />
            </Select.Icon>
          </Select.Trigger>
        </div>
        <Select.Portal>
          <Select.Positioner
            className={styles.positioner}
            role="navigation"
            aria-label={copy.onThisPage}
            sideOffset={4}
            align="start"
            alignItemWithTrigger={false}
            collisionPadding={16}
          >
            <Select.Popup className={styles.popup}>
              <Select.List className={styles.list} aria-label={copy.onThisPage}>
                {headings.map((heading) => (
                  <Select.Item key={heading.id} value={heading.id} data-value={heading.id} className={styles.item}>
                    <Select.ItemText className={styles.itemText}>{heading.text}</Select.ItemText>
                    <Select.ItemIndicator className={styles.indicator}>
                      <HugeiconsIcon icon={Tick02Icon} size={16} strokeWidth={1.5} aria-hidden="true" />
                    </Select.ItemIndicator>
                  </Select.Item>
                ))}
              </Select.List>
            </Select.Popup>
          </Select.Positioner>
        </Select.Portal>
      </Select.Root>
    </div>
  );
}
