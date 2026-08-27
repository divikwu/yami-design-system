# Header — Usage

YAMI global navigation. The band carries two anatomies and swaps between them
at `--breakpoints-desktop` (1024px).

**At and above 1024px** — one band, two rows, 130.6px total:

1. **Utility row** (64px + 1px rule) — brand lockup · hall switcher · locale · deliver-to · search · account · cart
2. **Category rail** (63.6px + 2px closing rule) — 48px inline gutter,
   category artwork + label, with edge paging

**Below 1024px** — the mobile chrome (Figma `2725:151904`), 100px total:

1. **Brand bar** (56px) — Mobile lockup · deliver-to · inbox, on an 8px page inset
2. **Search row** (36px field + 8px) — full-width field with visual search

For Product Detail, pass `mobileVariant="pdp"`. Below 1024px it uses the H5 PDP
navigation from Figma `2786:18423`: one 56px row with the 84 × 32 English
mobile lockup, deliver-to, search, and cart. The separate search row is hidden.
The row stays pinned to the top of the viewport while the PDP scrolls.

## The two bands are not a reflow of each other

The mobile band is a different anatomy, not the PC one rearranged. The hall
switcher, locale flag, account, cart, and the entire category rail have no
mobile counterpart and drop out; the inbox entry and visual search exist only
below 1024px.

Both trees are always rendered and `@media` picks one, so `Header` needs no
width probe and stays server-renderable — but it also means every prop is
parsed at both sizes. Pass `mobileLogo` and `inbox` even on a desktop-first
surface, or the mobile band degrades to the PC lockup with no message entry.
Use the English YAMI Mobile Logo-UI asset for `mobileLogo` in every locale; only
the PC `logo` follows the storefront language.

Geometry and token bindings for the PC band were reconciled against the production
www.yami.com/en header at 1480px. Where production uses a value the DS does not
sanction, the DS wins — see [Deviations](#deviations-from-production).

## Dark surfaces need their own lockup

The Fill lockup paints its wordmark `#222222`. On a dark band that wordmark is
invisible and the brand reads as a bare red disc. Pass the locale-specific PC
`darkLogo` and the English `yami-ui-en-mobile-fill-inverse.svg` as
`darkMobileLogo` — the same locked lockups with a white wordmark and a
brand-red mark.

```tsx
<Header
  logo={{ src: logoZh, alt: '亚米' }}
  darkLogo={{ src: darkLogoZh, alt: '亚米' }}
  mobileLogo={{ src: mobileLogoEn, alt: 'YAMI' }}
  darkMobileLogo={{ src: darkMobileLogoEn, alt: 'YAMI' }}
/>
```

`Header` renders both and the `.dark` class picks one in CSS, so there is no
theme probe and no hydration mismatch. The hidden lockup is `display: none` and
therefore out of the accessibility tree, so the brand slot still exposes exactly
one accessible name — give both the same `alt`.

Do **not** split the lockup into `logo-icon` + `logo-text` to recolour the
wordmark. Figma's `brand / logo-ui` is explicit — *不得自行拼装 Logo-icon 与
Logo-text* — and `brand / logo-text` adds *Logo-text 不单独出现于产品界面*.
Assembling in code moves the locked mark-to-wordmark spacing and proportion into
every consumer, where nothing validates it.

## When to use

- Every logged-in and anonymous storefront page, at any width

## When NOT to use

- Checkout funnels that intentionally strip navigation. Render the brand lockup
  alone instead of hiding half of `Header`'s slots.

## Category entries are images, not icons

### PC category navigation

Pass `categoryMenu` to turn the rail entry matching `triggerId` into a disclosure
button. Omit it to preserve the ordinary rail. The tree is caller-owned and
supports up to three levels: branches expand; leaves use their supplied `href`.
Include an explicit All link in a branch when the parent also has a destination.

The menu follows English Site Optimization 2026 nodes `947:53795` / `951:24791`
(file `wE2APma1NxPl3eHM5NFpU9`): 248px columns, a maximum 548px height,
independent vertical scrolling, 44px rows, and a scrim below the header. It
anchors to the Categories entry and follows the header when it scrolls or sticks.
The design's 16px shell radius maps to the maintained 12px surface token.

Mouse hover, click or Arrow Down on the entry opens the menu in both V1 and V2.
Hover opening does not move focus; click or Arrow Down enters the menu.
Hover, focus, or click selects
a branch; switching a parent clears its old child selection. Up/Down, Home/End,
and Left/Right move through the visible levels. Escape or the scrim closes and
returns focus to the entry; leaving the menu by Tab dismisses it. Search and
categories are mutually exclusive. Below 1024px the menu closes and leaves the
existing mobile header unchanged.

Leaving the trigger and panel closes after 200ms. A diagonal pointer route from
the trigger toward the panel's upper edge renews a 350ms grace period. Entering
either region cancels dismissal; moving away resumes the 200ms delay. Keyboard
navigation stays open. There is no pointer-blocking overlay over neighboring links.

`Pages → Categories` shows `PC — V1 Text` and `PC — V2 Images` on the real
storefront, both initially collapsed. Explore two and three levels within each
example; these states remain covered by browser regression tests.
`createHeaderCategoryMenu` supplies separate English and Chinese V1
API snapshots, preserving each locale's ordering, full tree, root icons and real
destination links. `category-menu.en.json` / `category-menu.zh.json` record the
endpoint, language, version and capture time. Display labels omit emoji per the
DS rule; original labels remain in the snapshots. Protocol-relative image URLs
and malformed URL slashes are normalized; no HTML template is injected.

Root `image` / `activeImage` come from the API's `image` / `active_image` fields.
The fixture resolves both to downloaded local assets, preserving GIF animation
and locale-specific artwork. Hover, focus, or click uses the selected icon;
moving into its children keeps it selected. Selecting another root restores the
previous default icon. If callers omit `activeImage`, `image` remains visible.
The existing 20 × 20 menu icon size and text-tree layout are unchanged.

All three levels accept `fontColor` / `activeFontColor` from the API's
`font_color` / `active_font_color`. These are explicitly API-owned merchandising
colors and retain the configured original colors, including campaign colors;
they are not remapped to design-system tokens. The refresh script strips the
API's trailing `!important` and accepts hexadecimal colors only. Both V1 and V2
keep the default `fontColor` on hover, keyboard focus and selected branches;
missing defaults fall back to the existing text color. Hover underlines only the
text label. `activeFontColor` remains in the API data but is not applied. Icon
state switching, selected backgrounds and keyboard focus outlines are unchanged.

Refresh explicitly with `node tooling/storybook/refresh-category-menu-fixture.mjs`.
This also downloads both states to `assets/category-menu/api/` and regenerates
`category-menu.images.ts`; snapshots retain the original CDN URLs for provenance.
The capture uses `pageScene=cms_main`, `customized_template=true`, `env=pre` and
requires a nonempty V1 response. This preview parameter is only used by the
refresh script: the storefront does not fetch that environment at runtime.
Production integration still requires confirmation of the official V1 rollout.

### V2 image categories

Set `categoryMenu.presentation` to `'images'` to opt into V2; omission or `'text'`
retains V1. This is a presentation choice, not a claim that the upstream API's
AB assignment has changed to V2.

V2 follows [Figma 951:24797](https://www.figma.com/design/wE2APma1NxPl3eHM5NFpU9/English-Site-Optimization-2026?node-id=951-24797):
two 240px text columns and a 440px independently scrolling third-level panel,
with three image cards per row, 80px-high artwork, centered two-line labels and a
548px maximum panel height. The full label remains the link's accessible name
and title. Missing image data leaves a text link, not a fabricated image.
Third-level artwork comes from the snapshot's original CDN URLs and needs a
network connection; root default/active icons remain bundled locally.
The snapshot preserves API `img_ratio` as `imageRatio`: `1` (or omitted) keeps
80×80 artwork; `2` renders 160×80 artwork at full frame height, centered and
clipped horizontally by the card rather than shrunk into a square.
Hovering the image frame scales only its artwork to 1.03 over 150ms, clipped
inside the unchanged frame. Hovering the label does not zoom the image.
Reduced-motion preference removes the transition.

Up/Down move one grid row, Left/Right move within a row; Left from the first
column returns to the selected second-level category. Home/End move to the
first/last card, Tab follows native link order, and Escape returns to Categories.
Changing a parent discards the previous panel and resets its scroll position.

`Pages → Categories → PC — V2 Images` lets users explore all levels in one
example. The Figma reference shows makeup artwork with a Skincare selection;
the example uses the API's matching branches rather than mixing categories.

### Rail artwork

`categories[].image` is an `<img>` source rendered at 24 × 24. This is
deliberate: category artwork is merchandising content that campaign teams reskin
per season, so it must not require a component release.

```tsx
categories={[
  { id: 'categories', label: 'Categories', href: '/en/category/all' },
  {
    id: 'health',
    label: 'Health',
    href: '/en/c/health/7',
    image: { src: '/images/categories/health.png', alt: 'Health' },
    badges: ['999+', 'NEW'],
  },
]}
```

Omitting `image` yields the built-in grid glyph. That is reserved for the
leading "Categories" entry, which is a menu affordance rather than a
merchandising tile — production does the same.

Do **not** substitute `assets/icons/category/*.svg` icon components. Those are
the line-art system icons; the rail carries full-color artwork, and the icon set
does not cover the production category list.

`alt` carries the category name and the visible label repeats it, so keep them
identical.

Supply artwork at 2× (48 × 48) for raster sources — that is what production
ships.

## Halls are EN-only, and are not search scopes

`All | Beauty` switches the **storefront**, not the search query. It therefore
lives in the brand group, left of the search field, and reports through
`onHallChange` — not through `onSearchSubmit`.

**Only the EN storefront ships it.** The CN storefront has no hall switcher, so
`halls` must be omitted there. Passing halls on CN invents a control that does
not exist in production.

```tsx
{/* EN */}
<Header
  halls={[{ id: 'all', label: 'All' }, { id: 'beauty', label: 'Beauty' }]}
  onHallChange={(hallId) => router.push(hallId === 'all' ? '/en' : `/en/pages/${hallId}`)}
/>

{/* CN — no halls prop at all */}
<Header zipcode={{ code: '94199', label: '配送至' }} /* … */ />
```

Selection is uncontrolled by default and falls back to the first hall. Pass
`hallId` + `onHallChange` to control it.

When `halls` is omitted and `zipcode` is present, `Header` renders a rule
between the lockup and the locale / deliver-to group, which is what production
does on CN — the controls would otherwise sit flush.

## The EN and CN rails are separate feeds

They are distinct CMS feeds, not translations of one list. As observed in
production: EN ships 24 entries, CN ships 25; labels are not literal
translations (`Summer Picks` / `凉夏好物`, `K-Trend` / `遇见首尔`); the order
diverges after the regional group; CN has a `网红好味` entry with no EN
counterpart; and a few categories ship different artwork per locale. The
promotion badge also sits on a different category (EN `Health`, CN `厨电家电`).

Drive each locale from its own data. Do not derive one rail from the other by
translating labels.

## Locale flag

`locale.flag` takes a 20px image. Use the maintained DS country icons from
`assets/icons/area/` (`united-states`, `canada`, `china`, `japan`, `korea`) —
these are the same assets the Storybook **Assets → Icons** story documents.
Unlike the category rail, the flag is chrome, not merchandising, so it belongs
to the icon set rather than to campaign artwork. The locale control lives in
the left brand group immediately before deliver-to.

```tsx
locale={{ label: 'EN', flag: { src: unitedStatesIcon, alt: 'United States' } }}
```

## Deliver-to

```tsx
<Header zipcode={{ code: '91789', label: 'Deliver to', href: '/en/delivery' }} />
```

`label` is the localized accessible name; the accessible name becomes
`"Deliver to 91789"`. Omit `zipcode` to hide the control.

## Promotion badges

`badges` renders in the category entry's top-right corner in `--text-emphasis`.
Rule `red-usage` makes this the only red permitted in the chrome, and only for
**promotions** — counts (`"999+"`) and promotion flags (`"NEW"`, `"SALE"`). A category name or a
neutral status does not belong here.

Multiple badges stack and are **clipped to one line**, so a multi-badge entry
cannot change the row height. Production rotates the stack; rotation is the
caller's concern.

## Cart shows no visible count

The cart is icon-only. `cart.count` is folded into the accessible name
(`"Shopping cart, 3"`), matching production. Do not add a visible count badge —
it changes the 75 × 36 control geometry.

## Search

The field is a 40px pill with an embedded 52 × 32 submit.

```tsx
<Header
  searchPlaceholder="Best 300K Asian products to explore"
  onSearchSubmit={(query) => router.push(`/en/search?q=${encodeURIComponent(query)}`)}
/>
```

Production rotates hot searches through the placeholder. That is a data
concern — drive it by changing `searchPlaceholder`.

Pass `searchPanel` to enable the PC discovery states. Focusing an empty field
opens recent, popular, and deal tags over a page scrim; typing switches the
same panel to image-backed keyword suggestions. The panel closes on its scrim,
submit, or <kbd>Escape</kbd>. Its content remains caller-owned so search data
can change without changing the component.

Discovery tags accept an optional `image`. Use it for image-backed Popular
Searches; the component renders a 32px circular crop before the label. Keep the
image `alt` empty when the adjacent label already names the destination.

Below 1024px the same field renders as a 36px pill with a 48 × 28 submit on its
own row, plus a visual-search control that reports through `onScan`. That
control consumes `assets/icons/action/camera.svg` — **not** `action/scan.svg`,
which is the barcode glyph. Give it a localized `scanLabel`; without one the
control is not rendered at all, since an unnamed icon button is unusable to
assistive tech. Set `mobileSearchHref` when mobile search lives on a dedicated
page; activating the field then opens that destination instead of editing the
header field in place.

### Why the search field is not an `Input`

`Input` is an 8px (`--radius-component-default`) labelled form field with helper
text, clear-action, and error machinery. The header search is a pill
(`--radius-button-primary`) with an embedded submit button and no label.
Composing `Input` would mean overriding its radius, suppressing its label and
helper slots, and reaching into its internals from the outside. The header field
is therefore built directly on tokens.

## Grouping

Set `startsGroup` on the first entry of the regional block. It renders one
1px × 32px divider before that entry, separating Greater China / Japan / Korea /
Southeast Asia from the merchandise categories.

Production draws the same rule as a trailing `::after` on the last entry of the
first group; anchoring it to the first entry of the second group is the same
pixel result with a clearer authoring model.

## Deviations from production

| Production | This component | Why |
| --- | --- | --- |
| Active hall `font-weight: 700` | `--font-weight-emphasize` (EN 500 / CN 600) | Ordinary emphasis follows `lang`; reserve the fixed semibold token for explicit serif titles. |
| Search ring `2px solid #000` | `--stroke-thick` + `--border-focus` (87% black) | Rule `border-strength` allows three strengths only. |
| Cart ring and rail divider at 17% black | `--border-default` (8%) and `--divider-subtle` (29%) | Same rule — 17% is not a sanctioned strength. |
| Row rule `#f5f5f5`, closing rule `#222` | `--border-default`, `--divider-emphasis` | Semantic aliases instead of raw neutrals. |
| Utility row `padding: 6px 48px` | `height: 64px` + centering | 6px is not on the 8px spacing scale; the result is identical. |
| Paging control at `right: 18px` | `--space-600` (48px) | Aligns both paging controls with the 48px page gutter. |

## Anti-patterns

### ✗ Icon components in the rail

```tsx
<Header categories={[{ id: 'snack', label: 'Snack', icon: <SnackIcon /> }]} />
```

There is no `icon` prop. Ship artwork through `image`.

### ✗ Treating halls as search scopes

```tsx
onSearchSubmit={(q, hallId) => …}   /* onSearchSubmit takes only the query */
```

### ✗ A hue baked into the header CSS

```css
.root { background: var(--color-blue-200); }   /* breaks semantic-color-only */
```

### ✗ Red as chrome decoration

```tsx
{ id: 'snack', label: 'Snack', badges: ['Snacks'] }   /* not a promotion */
```

## Related

- Rules `red-usage`, `semantic-color-only`, `border-strength`, `tap-target`,
  `focus-style`, `no-custom-radii` — [`../../DESIGN.md`](../../DESIGN.md)
- Brand lockup assets — [`../../assets/logos/README.md`](../../assets/logos/README.md)
- Category artwork provenance — [`assets/README.md`](./assets/README.md)
- Rail paging precedent — [`../HeroBanner/usage.md`](../HeroBanner/usage.md)
