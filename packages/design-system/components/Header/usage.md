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

Geometry and token bindings for the PC band were reconciled against the production
www.yami.com/en header at 1480px. Where production uses a value the DS does not
sanction, the DS wins — see [Deviations](#deviations-from-production).

## Dark surfaces need their own lockup

The Fill lockup paints its wordmark `#222222`. On a dark band that wordmark is
invisible and the brand reads as a bare red disc. Pass `darkLogo` /
`darkMobileLogo` from `assets/logos/yami-ui-<lang>-<platform>-fill-inverse.svg`
— the same locked lockup with a white wordmark and a brand-red mark.

```tsx
<Header
  logo={{ src: logoZh, alt: '亚米' }}
  darkLogo={{ src: darkLogoZh, alt: '亚米' }}
  mobileLogo={{ src: mobileLogoZh, alt: '亚米' }}
  darkMobileLogo={{ src: darkMobileLogoZh, alt: '亚米' }}
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
| Active hall `font-weight: 700` | `--font-weight-emphasize` (500) | The DS exposes only 400 and 500; there is no bold token. |
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
