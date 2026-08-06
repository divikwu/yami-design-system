# `tokens/typography/` — authored typography layer

Three files, two roles:

| File | Consumed by build? | Role |
|---|:---:|---|
| `mobile.tokens.json` | ✅ yes | `font-size` + `line-height` for every scale. Emitted into `:root`. |
| `desktop-lg.tokens.json` | ✅ yes | Sparse overrides — only scales whose font-size/line-height differ from mobile. Emitted into `@media (min-width: 1440px)`. |
| `_base.tokens.json` | ❌ no | Cross-mode invariants (`font-family`, `font-weight`, `paragraph-spacing`). Documentation + sync-tokens-ci contract only. |

## Why `_base.tokens.json` exists but isn't built

Font-family and font-weight don't vary across breakpoints (verified: 20/20 scales have identical values in Figma's mobile/tablet/desktop-lg modes). They come to the runtime via `primitives/typography.tokens.json` + `styles/base.css` class rules, which is why mode files only need the truly-varying fields.

But `sync-tokens-ci` (the Figma ↔ code drift checker) still needs to know the authored intent for every scale at every mode. Putting cross-mode invariants in `_base.tokens.json` is the canonical answer to "what is `display-xl.font-weight` in Figma's typography-mobile collection?" without repeating it 20× per mode file.

So: `_base.tokens.json` is **authored contract**, not **build input**. Style Dictionary does not read it. Only `sync-tokens-ci` does (Phase D+, not yet implemented).

## Layout rule

- If a value varies by breakpoint → mode file (`mobile` / `desktop-lg`).
- If a value is the same across all breakpoints → `_base.tokens.json`.
- Never write the same value to both — that's drift waiting to happen.

## Missing tablet

Figma has a `typography-tablet` collection, but in the current design every
`typography-tablet` value equals `typography-mobile`. The authored layer drops
`tablet.tokens.json` as dead weight. The raw layer (`figma-snapshot/variables/typography-tablet.json`)
still keeps it because that file mirrors Figma's export.

### Re-introducing tablet

If a future designer adds a tablet-specific value, four coordinated changes
are required (config alone is not enough — the build has no tablet @media
emission logic today):

1. Create `tokens/typography/tablet.tokens.json` with the sparse override shape
   (same structure as `desktop-lg.tokens.json`).
2. Add `tablet` to both `TYPOGRAPHY_SOURCES` and `TYPOGRAPHY_CLEANED` in
   [`style-dictionary-config.ts`](../../../../platform/build-tools/src/style-dictionary-config.ts).
3. Extend the preprocess loop in
   [`build-tokens.ts`](../../../../platform/build-tools/src/build-tokens.ts)
   from `['mobile', 'desktopLg']` to `['mobile', 'tablet', 'desktopLg']`.
4. Add a tablet `@media` block emission: flatten the cleaned tablet JSON,
   diff against mobile, emit at `BREAKPOINTS.tablet` (768px — add to the
   `BREAKPOINTS` const first). Mirrors the existing desktop-lg logic.
