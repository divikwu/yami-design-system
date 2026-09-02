"use client";

import { Cancel01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Button, Sheet } from "@yami/design-system";
import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";

import { brandIcon } from "./assets";
import styles from "./NavigationDrawer.module.css";

export function NavigationDrawer({ open, onClose, title, closeLabel, homeHref, children }: {
  open: boolean;
  onClose: () => void;
  title: string;
  closeLabel: string;
  homeHref: string;
  children: ReactNode;
}) {
  // Sheet owns modal focus and scroll locking; retain it until the exit finishes.
  const [present, setPresent] = useState(open);
  useEffect(() => {
    if (open) setPresent(true);
  }, [open]);

  return (
    <Sheet
      open={open || present}
      onClose={onClose}
      title={title}
      closeLabel={closeLabel}
      size="full"
      contentPadding="none"
      className={styles.drawer}
      data-slot="docsite-menu"
      data-state={open ? "open" : "closing"}
      onClick={(event) => {
        // The transparent dialog fills the viewport; only the panel is content.
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        className={styles.panel}
        data-navigation-panel
        onAnimationEnd={(event) => {
          if (event.target === event.currentTarget && !open) setPresent(false);
        }}
      >
        <div className={styles.header}>
          <Link className={styles.brand} href={homeHref} aria-label="YAMI Design System" onClick={onClose}>
            <img src={brandIcon} width={24} height={24} alt="YAMI" />
          </Link>
          <Button
            className={styles.close}
            variant="tertiary"
            form="icon"
            size="sm"
            aria-label={closeLabel}
            autoFocus
            onClick={onClose}
          >
            <HugeiconsIcon icon={Cancel01Icon} size={20} strokeWidth={1.5} aria-hidden="true" />
          </Button>
        </div>
        <div className={styles.content} data-navigation-content>{children}</div>
      </div>
    </Sheet>
  );
}
