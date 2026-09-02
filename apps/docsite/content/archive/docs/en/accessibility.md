---
slug: accessibility
title: Accessibility
description: "Treat keyboard use, semantics, focus, contrast, and touch targets as completion criteria for every component and page."
group: foundations
order: 150
keywords: ["accessibility", "keyboard", "focus", "ARIA", "contrast"]
updatedAt: "2026-08-29"
sourceRefs:
  - packages/design-system/DESIGN.md
  - packages/design-system/components/Sheet/usage.md
  - packages/design-system/components/Input/usage.md
  - packages/design-system/principles/validators/focus-style.ts
  - packages/design-system/principles/validators/tap-target.ts
---

Accessibility is not a release-stage patch. Component semantics and keyboard behavior, page heading structure, and content readability are designed together.

## Use native semantics

Navigation uses links, actions use buttons, and form fields have visible labels. Primary navigation uses `<nav>` with links; Tabs switch related content within one page.

ARIA fills gaps that native semantics cannot express. Do not rebuild a button with `role="button"`, and do not add duplicate labels just to satisfy an automated check.

## Keyboard paths

Every interaction supports Tab, Shift+Tab, Enter, or Space. Overlays also support Escape, contain focus where required, and restore focus when closed.

The search panel supports Arrow Up and Arrow Down, Enter to open, and Escape to close, then returns focus to its trigger. The mobile menu follows the same principle.

## Visible focus

Interactive elements use the shared 2px black outer outline with a 2px offset. Focus cannot rely on color alone and cannot be clipped by radius or overflow.

Use `focus-visible` for keyboard feedback. Never remove outlines globally.

## Contrast and state

Body copy, secondary text, actions, and borders meet contrast targets in light and dark themes. Error, success, selection, and disabled states cannot rely on color alone.

Disabled states use dedicated background, text, and border tokens. Reducing opacity on the whole element makes content and focus unpredictable and is prohibited.

## Verification

Automated axe checks find structural issues but do not replace manual use. Every delivery includes:

1. Complete the core task with a keyboard only.
2. Check screen-reader names and state announcements.
3. Verify 200% zoom and a 402px viewport.
4. Check contrast and focus in both themes.
5. Enable reduced motion and confirm the content remains understandable.
