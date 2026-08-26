# ThemeHero

A full-width theme storytelling module with selectable copy, optional primary
and secondary CTAs, and a campaign image repeated as a blurred atmospheric
background.

## When to use

Use it at the top of a themed landing page when the campaign needs a concise
positioning statement and one or two clear paths into its content. The copy
remains real DOM text so it can be translated, selected and indexed.

## Content

- Keep the title to roughly two desktop lines.
- Use one or two short paragraphs for `description`. It is limited to three
  lines on desktop and two lines on mobile until expanded. Localize the
  disclosure with `descriptionExpandLabel` and `descriptionCollapseLabel`.
- Use `tags` for up to three concise brand, ingredient, or benefit keywords;
  they render with the shared `Badge`. `tagSize` selects the preferred desktop
  `sm` or `md` geometry, while `tagTone` selects the background-polarity
  treatment. ThemeHero compacts tags to the `sm` geometry below 1024px.
- Supply intrinsic image dimensions and meaningful foreground alt text. When an asset pipeline
  provides a focal point, map it to `image.objectPosition` so desktop and mobile crops preserve the
  intended product group rather than forcing a generic centered crop.
- Configure `cta` with destination-specific copy for the primary path.
- Add `secondaryCta` only when a distinct lower-emphasis destination exists.
- Actions use content-driven widths and the shared full-radius token.
- Omit both actions when the module is purely editorial.

## Accessibility

The title is an `h2`; place the component beneath the page's `h1`. Descriptive
tags render as a native list of non-interactive `Badge` labels. The blurred
background image is decorative and hidden from assistive technology. The
foreground image carries `image.alt`, and both CTAs use the shared `Button`
keyboard and focus behavior. The description disclosure is a native button with
`aria-expanded` and `aria-controls`; horizontally overflowing tags are keyboard
focusable. Use `controls` to identify an in-page destination.

## Responsive behavior

At 1024px and above, content is a centered, 1440px-capped two-column layout
inside the 448px full-bleed band. The desktop container is flush vertically and
uses a 48px inline inset; supporting copy uses 16px/20px type and the action
group uses 16px block padding. Below 1024px, the campaign artwork becomes a
full-bleed, cover-cropped visual with the selectable copy and action group
anchored over its lower edge. A contrast scrim preserves legibility, and
supporting copy uses 14px/20px. Supporting copy is limited to three lines on
desktop and two lines on mobile until the localized plain-text disclosure is
activated.
Keyword Badges use the compact 20px-high, 12px type geometry.
The mobile action group uses 8px block padding, spans the copy content width,
and distributes available space across one or two actions.
