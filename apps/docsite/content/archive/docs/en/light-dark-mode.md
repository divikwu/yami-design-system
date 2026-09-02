---
slug: light-dark-mode
title: Light & Dark Mode
description: "Keep one semantic token system stable across themes while preventing first-paint flashes and component-level forks."
group: foundations
order: 140
keywords: ["light", "dark", "theme", "system preference", "color scheme"]
updatedAt: "2026-08-29"
sourceRefs:
  - packages/design-system/DESIGN.md
  - packages/design-system/tokens/themes/dark.tokens.json
  - packages/design-system/generated/tokens.css
  - packages/design-system/assets/logos/README.md
---

YAMI switches dark mode with a `.dark` class on the root element. Components always consume the same semantic variables. They do not accept a separate `dark` prop or maintain a second set of business colors.

## Theme source

A first visit follows the system `prefers-color-scheme` setting. After a person explicitly selects light or dark, persist that value and treat it as authoritative. System changes affect the page only when no saved selection exists.

All applications follow the same priority:

1. A saved user choice.
2. The current system setting.
3. Light mode when the system setting is unavailable.

## Prevent first-paint flashes

Apply the theme class to `<html>` before React hydrates. A small inline script reads only the controlled theme key and synchronizes `color-scheme`. The hydrated control then reflects the current state.

```js
const saved = localStorage.getItem("yami-docsite-theme");
const dark = saved ? saved === "dark" : matchMedia("(prefers-color-scheme: dark)").matches;
document.documentElement.classList.toggle("dark", dark);
```

## Semantic mapping

Dark overrides live in token sources. A page writes semantic variables such as `var(--text-primary)` and `var(--surface-primary)` and does not create `.dark .component` color branches in application CSS.

An inverse surface means the opposite polarity within the current theme, not a fixed black background. Text, focus treatment, and the logo in an inverse area use matching inverse tokens and assets.

## Verification checklist

- Refresh does not show a light flash.
- A saved choice survives the next visit.
- With no saved choice, the page follows system changes.
- The official inverse lockup appears on a dark background.
- Focus, disabled states, tables, and code blocks remain legible.
