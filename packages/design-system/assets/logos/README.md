# YAMI Logo

Source: Figma `YAMI-UI-UX-Guidelines` (`6oOAy72DBff4P6NzJYc2hi`), Brand page `2651:6535`.

## Files

`logo-icon` — standalone Y monogram, 64×64. Figma `2391:18244`.

| File | Style | Figma node |
| --- | --- | --- |
| `yami-icon-fill.svg` | red disc + white Y | `2279:2811` |
| `yami-icon-line.svg` | outlined ring + red Y | `2279:2819` |

`yami-icon-fill.svg` is the canonical brand mark declared by
[`design-system.meta.json#/assets/logo`](../../design-system.meta.json).

`logo-ui` — icon + wordmark horizontal lockup, for App / Web headers. Figma `2013:13691`. Icon 32px (mobile) / 52px (PC).

| Pattern | Variants |
| --- | --- |
| `yami-ui-{cn,en}-{mobile,pc}-{fill,line}.svg` | 8 — Language × Platform × Style |
| `yami-ui-{cn,en}-{mobile,pc}-fill-inverse.svg` | 4 — dark-surface counterparts to Fill |

CN wordmark = `YAMI 亚米`; EN = `YAMI`.

### `fill-inverse` — dark surfaces

Fill paints its wordmark `#222222`, which is invisible on a dark band. The
`-inverse` files are the **same locked lockup** with the wordmark at `#FFFFFF`;
the mark stays brand red. Nothing else differs — each was produced by recolouring
that single fill and diffed against its source to prove the geometry is
untouched.

These four files are the source of truth for dark surfaces. The dark form is
Fill + white wordmark rather than a Line variant, decided 2026-08-05.

Consume them by *swapping the whole file* (see `Header`'s `darkLogo` /
`darkMobileLogo`, switched by the `.dark` class in CSS). Never rebuild the
lockup from `logo-icon` + `logo-text` to recolour the text — see
[Usage rules](#usage-rules).

## Color binding

Red fills are `#FF0000` = `--color-brand-red` token (defined in
[`generated/tokens.css`](../../generated/tokens.css)). Brand red is **Logo only**;
CTA / promo / error use `--color-red-500` `#E00000`. See
[`DESIGN.md` §red-usage](../../DESIGN.md).

The UI-lockup wordmark uses `#222222` (Figma's neutral text color), or `#FFFFFF` in the `-inverse` files.

## Usage rules

- Don't mix CN and EN logos in the same surface. Pick one language per interface.
- Mobile uses `*-mobile-*`; PC uses `*-pc-*`.
- `Style=Fill` is default. Switch to `Style=Line` only when a coloured / photographic background clashes with the solid red disc.
- On dark surfaces use `-fill-inverse`, not a hand-assembled lockup. Figma's
  `brand / logo-ui` description is explicit: *不得自行拼装 Logo-icon 与
  Logo-text*, and `brand / logo-text` adds *Logo-text 不单独出现于产品界面*.
  Splitting the mark from the wordmark to control the text colour would move the
  locked spacing and proportion into every consumer, where nothing validates it.

## Not yet exported

`logo-text` (CN/EN, 2 files, Figma `2279:2857`) and `logo-vertical` (CN/EN × Fill/Line, 4 files, Figma `3124:560`) — export from Figma when consumed.

## Naming

```
yami-<set>[-<lang>][-<platform>][-<style>].svg
```

`<set>`: `icon` | `text` | `vertical` | `ui`. `<lang>`: `cn` | `en` (omit for `icon`). `<platform>`: `mobile` | `pc` (only for `ui`). `<style>`: `fill` | `line` | `fill-inverse` (omit for `text`).

## See also

Badge marks (Y monogram on a flag-shape container, used for tiers / categories) live in [`../badges/`](../badges/), not here. This folder is canonical brand-mark only.
