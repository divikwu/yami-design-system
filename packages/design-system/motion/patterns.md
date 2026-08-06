# Motion Patterns

How YAMI animates specific UI interactions. Combining easing + duration from `easing.md` and `durations.md` into concrete patterns.

## Core principles

- **Functional, not decorative** — every animation must communicate state change (what happened, where focus is, what's loading)
- **Color > motion** — state feedback uses color shift (`-active` token variant) first; motion is secondary
- **Never block input** — user interactions during animation must queue / override, not get lost
- **Respect `prefers-reduced-motion`** — honor the user's OS setting, fall back to instant state changes

## Specific patterns

### Button hover / press
```css
.button {
  transition: background-color var(--duration-fast) var(--ease-default);
}
.button:hover { background: var(--button-primary-hover); }
.button:active { background: var(--button-primary-active); }
```
- Only `background-color` animates
- No scale, no shadow change, no rotation
- 100ms duration, default easing

### Modal open / close
```css
.modal-scrim { transition: opacity var(--duration-base) var(--ease-enter); }
.modal { transition: opacity var(--duration-base) var(--ease-enter), transform var(--duration-base) var(--ease-enter); }
.modal[data-state="closing"] { transition-timing-function: var(--ease-exit); }
```
- Scrim fades
- Modal fades + tiny translateY (8px down on exit)
- 150ms, ease-enter / ease-exit

### Dropdown / menu
```css
.dropdown { transition: opacity var(--duration-base) var(--ease-enter), transform var(--duration-base) var(--ease-enter); transform-origin: top; }
```
- Opacity + small scale (0.96 → 1.0) from top origin
- 150ms, ease-enter

### Toast
- **Appear**: slide from top, 150ms, ease-enter, translateY(-8px → 0) + opacity(0 → 1)
- **Dismiss**: fade only (no slide), 200ms, ease-exit
- Auto-dismiss after 4 seconds for info, 8 seconds for error (never auto-dismiss if user hasn't seen it — use IntersectionObserver)

### Page transition
- Static navbars (top/bottom) remain
- Main content area: opacity-fade 300ms, ease-default
- No slide, no horizontal motion (feels phone-app-ish, we're cross-platform)

### Loading states
- **Spinner**: linear 1s rotate, `var(--ease-linear)`
- **Skeleton shimmer**: linear, 1.5s, left-to-right translate
- **Progress bar**: linear on value change, 150ms (visible motion), immediate on completion

### Focus ring
- `outline-offset` 0 → 2px over 100ms
- Visible immediately on focus, no easing on appearance (duration starts at offset transition only)

## What we don't animate

- **Layout changes** (height, width, flex-direction) — let them snap
- **Border-width** — flickery and accessibility-hostile
- **Font-size changes** — triggers layout jank
- **Card positions on grid reflow** — let the grid reflow instantly

## `prefers-reduced-motion`

```css
@media (prefers-reduced-motion: reduce) {
  * {
    transition-duration: 0ms !important;
    animation-duration: 0ms !important;
  }
}
```

Exception: essential loading indicators still rotate (at reduced speed if possible) — user needs the signal that work is happening.

## Framework guidance

- **CSS transitions** by default (browser-native, performant)
- **Web Animations API** for one-off choreographed sequences (modal open/close with multiple phases)
- **Framer Motion** only when a React component's state needs to drive motion declaratively; import carefully to avoid shipping the whole library
- **No react-spring** — spring physics conflict with our easing philosophy

## Future authoritative motion spec

This doc establishes defaults. Phase 8.5 (visual eval) may surface issues that lead to motion rule-ids added to `../design.md`. See `../decisions.md` for any changes.
