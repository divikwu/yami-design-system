# `tokens/typography/` — authored typography layer

Four files, three roles:

| File | Consumed by build? | Role |
|---|:---:|---|
| `mobile.tokens.json` | ✅ yes | `font-size` + `line-height` for every scale. Emitted into `:root`. |
| `tablet.tokens.json` | ✅ validation only | Equality mirror of mobile. The build rejects drift until a tablet runtime context exists. |
| `desktop-lg.tokens.json` | ✅ yes | Full desktop-lg values. The build diffs them against mobile and emits only changed values into `@media (min-width: 1440px)`. |
| `_base.tokens.json` | ❌ no | Cross-mode invariants (`font-family`, `font-weight`, `paragraph-spacing`). Documentation + sync-tokens-ci contract only. |

## Why `_base.tokens.json` exists but isn't built

Font-family and font-weight don't vary across breakpoints (verified: 21/21 scales have identical values in Figma's mobile/tablet/desktop-lg modes). They come to the runtime via `primitives/typography.tokens.json` + `styles/base.css` class rules, which is why mode files only need `font-size` and `line-height`.

Ordinary emphasis does vary by language: the primitive's EN value is Medium 500
and CN is SemiBold 600. `tooling/tokens/build.mjs` emits `locale-en` and `locale-zh`
contexts for differing language weights, including CSS selectors that follow
inherited `lang` and reset on nested language switches. Regular and explicit serif
weights stay language-independent. The approved serif stack is optical
`Source Serif 4 Variable` for Latin + `Noto Serif SC` for Chinese through
`--font-family-serif`. Never hard-code per-page language overrides.

But `sync-tokens-ci` (the Figma ↔ code drift checker) still needs to know the authored intent for every scale at every mode. Putting cross-mode invariants in `_base.tokens.json` is the canonical answer to "what is `display-xl.font-weight` in Figma's typography-mobile collection?" without repeating it 20× per mode file.

So: `_base.tokens.json` is **authored contract**, not **build input**. Style Dictionary does not read it. Only `sync-tokens-ci` does (Phase D+, not yet implemented).

## Layout rule

- Breakpoint mode files (`mobile` / `tablet` / `desktop-lg`) contain complete `font-size` and `line-height` snapshots.
- The generator emits mobile as the baseline, validates tablet equality, then emits only the desktop-lg diff.
- Desktop and Desktop-LG remain separate authored snapshots, but every `font-size` and `line-height` value must stay aligned. The generator therefore emits no typography diff at `1440px`, and component CSS must not swap typography roles there.
- If a value is the same across all breakpoints → `_base.tokens.json`.
- Do not add runtime typography overrides outside the generated token pipeline.

## Tablet equality mirror

Figma has a `typography-tablet` collection, and in the current design every
`typography-tablet` value equals `typography-mobile`. The authored
`tablet.tokens.json` file preserves that contract. `tooling/tokens/build.mjs`
compares the two documents and fails generation if they diverge, so Tablet never
silently gains values that the runtime cannot emit.

### Re-introducing tablet

If a future designer adds a tablet-specific value, first add an explicit tablet
runtime context and `@media (min-width: 768px)` diff emission to
`tooling/tokens/build.mjs`, then update the generated-output and typography-scale
tests. Only after that should `tablet.tokens.json` intentionally differ from
mobile.
