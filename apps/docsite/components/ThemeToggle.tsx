"use client";

import { Moon02Icon, Sun03Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Button } from "@yami/design-system";
import { useEffect, useState } from "react";

import { resolveTheme, themeStorageKey, type Theme } from "../lib/theme";
import styles from "./ThemeToggle.module.css";

interface ThemeToggleProps {
  lightLabel: string;
  darkLabel: string;
  themeLabel: string;
  compact?: boolean;
  onChange?: () => void;
}

const themeEvent = "yami-docsite-theme-change";

function applyTheme(theme: Theme): void {
  const root = document.documentElement;
  root.classList.toggle("dark", theme === "dark");
  root.dataset.theme = theme;
  root.style.colorScheme = theme;
}

function readTheme(): Theme {
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

export function ThemeToggle({ lightLabel, darkLabel, themeLabel, compact = false, onChange }: ThemeToggleProps) {
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const stored = window.localStorage.getItem(themeStorageKey);
    const initial = resolveTheme(stored, media.matches);
    applyTheme(initial);
    setTheme(initial);

    const handleSystemChange = (event: MediaQueryListEvent) => {
      if (window.localStorage.getItem(themeStorageKey)) return;
      const next = resolveTheme(null, event.matches);
      applyTheme(next);
      setTheme(next);
    };
    const handleThemeChange = () => setTheme(readTheme());

    media.addEventListener("change", handleSystemChange);
    window.addEventListener(themeEvent, handleThemeChange);
    return () => {
      media.removeEventListener("change", handleSystemChange);
      window.removeEventListener(themeEvent, handleThemeChange);
    };
  }, []);

  const nextTheme: Theme = theme === "dark" ? "light" : "dark";
  const nextLabel = nextTheme === "dark" ? darkLabel : lightLabel;
  const icon = nextTheme === "dark" ? Moon02Icon : Sun03Icon;
  const accessibleLabel = `${themeLabel}: ${nextLabel}`;

  return (
    <Button
      className={styles.button}
      variant="tertiary"
      form={compact ? "icon" : "inline"}
      size={compact ? "sm" : "md"}
      aria-label={accessibleLabel}
      title={compact ? accessibleLabel : undefined}
      data-testid="theme-toggle"
      onClick={() => {
        window.localStorage.setItem(themeStorageKey, nextTheme);
        applyTheme(nextTheme);
        setTheme(nextTheme);
        window.dispatchEvent(new Event(themeEvent));
        onChange?.();
      }}
    >
      {compact ? (
        <HugeiconsIcon
          className={styles.icon}
          icon={icon}
          size={20}
          strokeWidth={1.5}
          aria-hidden="true"
        />
      ) : (
        <span suppressHydrationWarning>{nextLabel}</span>
      )}
    </Button>
  );
}
