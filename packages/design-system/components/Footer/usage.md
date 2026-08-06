# Footer

The YAMI PC global site footer. Three bands inside one `contentinfo` landmark:

| Band | Contents |
|---|---|
| Masthead — left | CMS link columns on `--surface-secondary` |
| Masthead — right | "Keep in touch" (social + newsletter) over "Get the app" |
| Closing bar | Payment marks, copyright, legal links on a fixed dark `--surface-inverse` |

The layout follows the Figma PC variants:

| Viewport | Masthead layout | Link layout |
|---|---|---|
| 1920px and wider | 50/50 link/right split | Four columns |
| 1025–1440px | 50/50 link/right split | Two-by-two grid |
| 1024px | Link row above right bands | Four columns; right bands side by side |

The footer has a minimum width of 1024px. Below that viewport width, the page
retains the PC footer width and scrolls horizontally rather than compressing
the 1024px layout.

The masthead uses 1px structural gaps and the footer defaults to a 2px
`--divider-emphasis` top border (black in the default light theme). PC only —
the mobile footer stacks differently and ships separately.

The closing bar is intentionally theme-invariant: its dark payment/legal
surface and light text remain unchanged when the surrounding page switches to
dark mode. The masthead continues to follow the active page theme.

## Content shape

The Figma fixture exposes five link groups as four visual columns; the last
column owns the Make Money and Contact groups. A `FooterColumn` owns an ordered
list of groups rather than a single one:

```tsx
columns={[
  {
    id: 'column-1',
    groups: [
      { id: 'about', title: 'About Yami', links: [{ id: 'about-us', label: 'About Us' }] },
    ],
  },
]}
```

Group titles render as `h3`, so the footer is navigable by heading.

## Destinations are optional

Every `href` in this component is optional and follows the Header convention:
production routes the whole footer through the CMS, so the DS never hardcodes a
destination. An entry without `href` renders as a plain, unlinked label — an
unconfigured footer therefore exposes no empty links.

## Optional bands

`subscribe`, `socialLinks`, `appTitle`, and `appLinks` are all optional. Omit
them and the corresponding band disappears; a links-only footer is a supported
configuration.

## Newsletter validation is yours

`FooterSubscribe` is the only stateful slot in the landmark, and it deliberately
ships no email regex and no endpoint. It fires `onSubmit` with the current value
and renders whatever you pass back as `error`:

```tsx
subscribe={{
  title: "Let's keep in touch",
  label: 'Email',
  submitLabel: 'Subscribe',
  value: email,
  onValueChange: setEmail,
  onSubmit: (value) => setError(isValid(value) ? undefined : 'Invalid email'),
  error,
}}
```

The field wires `aria-invalid` and `aria-describedby` to that error node for you.

## Store badges are caller-supplied

`FooterAppButton` takes an `icon` image slot rather than baking in the Apple and
Google marks — both are licensed artwork and stay out of the DS bundle. The
button renders label-only when `icon` is omitted; the Figma-aligned fixture
passes the maintained 24px marks from `assets/icons/social/`.
The same control is exported on its own so app-download modules outside the
footer can reuse it without lifting the whole landmark.

## Copyright copy

Pass either one string or the four-line Figma form. An array renders as four
paragraphs with the Figma spacing rhythm:

```tsx
copyright={[
  '© Copyright 2012-2019 Yamibuy.com …',
  'Yamibuy.com is operated by Transocean Resources Management, Inc. …',
  'For more merchant information please contact help@yamibuy.com',
  'All rights reserved by Yamibuy.com',
]}
```

## Accessibility notes

- Social glyphs are decorative (`alt=""`); the anchor carries the accessible name.
- Payment marks carry the scheme name as `alt`, because no visible label repeats it.
- Use `FooterLegalLink.ariaLabel` where the visible label under-describes the
  target — production's "Business license" opens a bare image file, so it needs one.
- Column links and social glyphs keep their production visual size and gain
  transparent 44px hit areas rather than growing the rows.

## Known deviations from production

Recorded in full in `meta.json → rules`. The ones worth knowing:

- Group titles are 16/20, not production's 16/24 — the DS has no 16/24 slot.
- The newsletter input (2px) and app buttons (4px) both round to
  `--radius-component-default` (8px).

## Figma

Bound to the Footer parent `6970:69275` and verified against the PC variants:
`6970:69276` (1920px), `6970:69581` (1440px), and `6970:69886` (1024px).
