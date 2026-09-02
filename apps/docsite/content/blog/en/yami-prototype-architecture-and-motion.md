---
slug: yami-prototype-architecture-and-motion
title: YAMI Prototype Architecture and Design Implementation
description: "How React, Storybook, Canvas, design tokens, and restrained motion connect component development, page composition, and repeatable verification."
date: "2026-09-01"
category: engineering
authors: ["YAMI Design System Team"]
tags: ["Architecture", "Prototyping", "Motion", "Testing"]
relatedDocs: ["prepare-environment", "browse-components", "create-components"]
cover:
  src: "/images/blog/prototype-architecture.webp"
coverAlt: "The YAMI prototype architecture"
---

YAMI prototypes are neither static pages detached from code nor a single application that owns every capability. The system has three layers that remain independent but composable: React prototypes own the pages, Storybook provides inspection and verification, and Canvas controls paths, devices, locales, themes, and design directions.

This separation lets the same page behave as an operable prototype while also participating in component review and automated tests. A page does not need to know whether Storybook or Canvas is rendering it, and the design system does not depend on either application framework.

## Three layers with distinct responsibilities

The first layer is `@yami/prototypes`. It contains page prototypes such as Ecommerce Home, Topic Landing Page, Search Results, and Product Detail. It directly uses React, YAMI Design System, and shared data contracts, without depending on Next.js or a motion framework.

The second layer is Storybook. It loads stories from the design system and prototype pages, then provides controls, bilingual content, light and dark themes, and multiple device viewports in an isolated environment. Component documentation, accessibility checks, and browser tests run here as well.

The third layer is Canvas. This Next.js prototype workbench manages pages, route previews, device widths, locales, themes, and design directions. Canvas consumes prototypes rather than owning them, so workbench state does not leak into deliverable pages.

| Layer | Primary responsibility | Core technology |
| --- | --- | --- |
| Prototypes | Page structure, component composition, and serializable directions | React, TypeScript, CSS Modules |
| Storybook | Isolated inspection, documentation, interaction, and accessibility verification | Storybook, Vite, Vitest, Playwright |
| Canvas | Route, device, locale, theme, and direction previews | Next.js, React, Motion |

## React owns pages; the design system owns rules

Prototype pages use React 19 and TypeScript 6. Pages receive content, state, and navigation behavior through props, then compose real components from `@yami/design-system`. Shared data structures live in `@yami/contracts`, preventing each page from defining another version of the same interface.

Styling uses CSS Modules rather than Tailwind, styled-components, or Emotion. Color, typography, spacing, radius, and responsive values come from CSS Custom Properties generated from DTCG tokens. Pages decide how components are arranged, but they do not bypass components to reinvent visual rules.

Checkbox, RadioGroup, and selected popover interactions use Base UI as an unstyled behavioral foundation. Base UI handles underlying keyboard paths, focus, and ARIA semantics; YAMI components continue to own their structure, tokens, and visual states.

The dependency direction remains explicit:

- Prototypes may use the design system, but the design system cannot depend on prototypes.
- The design system does not depend on Next.js, Canvas, or Motion.
- Pages can replace data and navigation implementations without copying components.
- Storybook and Canvas consume the same prototypes instead of maintaining two versions.

## Storybook is the prototype verification environment

YAMI uses Storybook 10 with React Vite to render components and pages. Global controls provide Chinese, English, light, dark, and preset viewports from 360px to 1920px, allowing the same story to be reviewed repeatedly under stable conditions.

Storybook also connects three official capabilities. Docs generates guidance from components and stories. Accessibility checks common a11y rules. Vitest turns stories into component tests that run in the browser. Vite provides the build pipeline, while Playwright executes interaction and browser tests in Chromium.

A story therefore does more than display a component. The same stable state can support human review, interaction assertions, accessibility checks, and regression testing. Component states, test inputs, and documentation examples are less likely to drift apart.

## Motion begins with native CSS

Prototype pages and design-system components do not directly depend on Motion, GSAP, Lottie, or react-spring. Everyday feedback is implemented with CSS `transition`, `@keyframes`, native smooth scrolling, and limited `requestAnimationFrame` coordination.

YAMI motion is functional first. Color explains a state change before movement adds direction or continuity. Frequent interactions remain fast. Less frequent page changes may take longer, but motion must never block input.

The current timing tiers include:

- 100–150ms for frequent Button, Card, and menu state changes.
- 150ms for overlays and dropdowns entering or leaving.
- 300ms for page or primary-content fades.
- 1000–1500ms linear loops for loading spinners and skeleton shimmer.

Hover and press do not scale components or change shadows; they adjust background color. A ProductCard image may zoom to `1.03` inside fixed card geometry, while the card and grid positions remain stable. Height, width, font size, border width, and grid reflow are not animated because they can introduce layout jank.

Every nonessential transition responds to `prefers-reduced-motion`. When a user enables reduced motion, transitions and decorative animation complete immediately while essential loading feedback remains available.

## Motion stays in the Canvas shell

Canvas uses `motion/react` for transitions owned by the workbench, not by the design system. The control panel enters with opacity and an 8px offset. Changing the page path fades the preview in from 8px below over 300ms. Changing a design direction uses a 200ms opacity fade.

URL parameters select these transitions, and `useReducedMotion` automatically follows the system preference. The movement communicates that the preview context changed without altering the behavior of components inside the prototype.

Keeping Motion in Canvas has two benefits. Deliverable components avoid an additional runtime dependency, and Storybook still shows their foundational behavior. The workbench can provide useful transition feedback without controlling how downstream applications render prototypes.

## Tests cover different layers

Vitest handles fast tests for components, data transforms, and page logic. Storybook Test runs stories in a browser. Playwright verifies rendered behavior, keyboard interaction, and responsive layouts. Axe adds automated accessibility checks.

Repository validation also covers TypeScript, package boundaries, the component catalog, generated files, token references, and design principles. The goal is not to make one tool prove everything. Each class of risk should be caught at the layer best equipped to observe it.

Visual review still matters. Tests can prove that elements exist, operations succeed, and rules are not violated, but bilingual wrapping, image crops, content density, and page rhythm require inspection at target viewports. Storybook supplies stable inputs, while Canvas supplies a continuous experience; together they make human judgments reproducible.

## Restrained dependencies keep prototypes portable

The prototype layer intentionally avoids Tailwind, CSS-in-JS, GSAP, Lottie, and spring animation libraries. These tools are not forbidden in principle. React, CSS Modules, design tokens, and native browser capabilities already cover the current requirements.

When a new capability genuinely requires a more complex timeline or state-driven animation, the first question is whether it belongs to a page, a component, or the workbench. The dependency should then live with the smallest owner. This prevents one local effect from adding runtime cost to the entire design system.

The value of the YAMI prototype architecture is not the number of technologies involved, but the clarity of their boundaries: React pages remain reusable, the design system remains independent, Storybook preserves verifiable states, Canvas provides continuous previews, and motion appears only when it helps explain change.
